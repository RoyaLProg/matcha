import { UseGuards, Controller, Get, Body, Param, Delete, Patch, HttpException, HttpStatus, Post, UseInterceptors, UploadedFiles, Request, Put, BadRequestException, NotFoundException } from '@nestjs/common';
import Users from 'src/interface/users.interface';
import UserService from './user.service';
import Settings from 'src/interface/settings.interface';
import SettingsService from './settings.service';
import * as fs from 'fs';
import Picture from 'src/interface/picture.interface';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UploadService } from 'src/upload/upload.service';
import AuthGuard from 'src/auth/auth.guard';
import UserGuard from './user.guard';
import HistoryService from 'src/history/history.service';
import { Database } from 'src/database/Database';
import { NotificationType, SocketsService } from 'src/sockets.service';
import Tag from 'src/interface/tags.interface';
import { Query } from 'express-serve-static-core';

@Controller('users')
class UserController {
	constructor(
		private readonly userService: UserService,
		private readonly settingsService: SettingsService,
		private readonly historyService: HistoryService,
		private readonly database: Database,
		private readonly socketsService: SocketsService,
	) { }

	private async getProfileAvatarUrl(userId: number) {
		const settings = await this.database.getFirstRow('settings', [], { userId }) as any;
		if (!settings) return undefined;
		const pics = await this.database.getRows('picture', [], { settingsId: settings.id }) as any[];
		const profile = pics.find(p => p.isProfile) ?? pics[0];
		return profile ? `/api${profile.url}` : undefined;
	}

	@Get('blocks')
	@UseGuards(AuthGuard)
	async getBlockedUsers(@Request() req) : Promise<any[]> {
		const me = await this.userService.findOne(req.user.id);
		const ids: number[] = Array.isArray(me.blockedIds) ? me.blockedIds : [];
		const out: any[] = [];
		for (const id of ids) {
			const u = await this.userService.findOne(id).catch(() => null);
			if (!u) continue;
			const avatar = await this.getProfileAvatarUrl(id);
			out.push({ id: u.id, username: u.username, firstName: u.firstName, avatar });
		}
		return out;
	}

	@Get('search')
	@UseGuards(AuthGuard)
	async searchUsers(@Request() req): Promise<any[]> {
		const q = (req.query?.query ?? '').toString().trim().toLowerCase();
		const ageMin = Number(req.query?.ageMin ?? 18);
		const ageMax = Number(req.query?.ageMax ?? 100);
    const fameMin = Number(req.query?.fameMin ?? 0);
    const fameMax = req.query?.fameMax !== undefined ? Number(req.query.fameMax) : undefined;
		const maxDistance = req.query?.distance !== undefined ? Number(req.query.distance) : undefined;
		const lat = req.query?.lat !== undefined ? Number(req.query.lat) : undefined;
		const lng = req.query?.lng !== undefined ? Number(req.query.lng) : undefined;
		const tagsParam = (req.query?.tags ?? '').toString();
		const requestedTags: string[] = tagsParam
			.split(',')
			.map((t: string) => t.trim())
			.filter((t: string) => t.length)
			.map((t: string) => t.toLowerCase().replace(/#/g, '').replace(/\s+/g, '_'));

		const currentUser = await this.database.getFirstRow('users', [], { id: req.user.id }) as Users;
		if (!currentUser) throw new HttpException('User not found', HttpStatus.NOT_FOUND);
		const currentSettings = await this.database.getFirstRow('settings', [], { userId: req.user.id }) as Settings;

		const refLat = lat ?? currentSettings?.latitude;
		const refLng = lng ?? currentSettings?.longitude;

		function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
			if ([lat1, lon1, lat2, lon2].some((v) => typeof v !== 'number' || isNaN(v))) return Number.POSITIVE_INFINITY;
			const R = 6378;
			[lat1, lon1, lat2, lon2] = [lat1, lon1, lat2, lon2].map((coord) => coord * (Math.PI / 180));
			const dLat = lat2 - lat1;
			const dLon = lon2 - lon1;
			const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
			const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
			return R * c;
		}

		const allSettings = (await this.database.getRows('settings', [])) as Settings[];
		const results: any[] = [];
		for (const s of allSettings) {
			if (Number(s.userId) === req.user.id) continue;
			const otherUser = (await this.database.getFirstRow('users', [], { id: s.userId })) as Users;
			if (!otherUser) continue;

			if (currentUser.blockedIds?.includes(Number(s.userId)) || otherUser.blockedIds?.includes(req.user.id))
				continue;

			if (q.length) {
				const hay = `${otherUser.username ?? ''} ${otherUser.firstName ?? ''} ${otherUser.lastName ?? ''}`.toLowerCase();
				if (!hay.includes(q)) continue;
			}

			const otherTags = (await this.database.getRows('tags_entity', [], { settingsId: s.id })) as Tag[];
			if (requestedTags.length) {
				const hasAll = requestedTags.every((t) => otherTags.some((ot) => ot.tag === t));
				if (!hasAll) continue;
			}

			const otherPictures = (await this.database.getRows('picture', [], { settingsId: s.id })) as Picture[];
			if (!otherPictures || otherPictures.length === 0) continue;

			const birth = new Date(otherUser.birthday);
			const now = new Date();
			let age = now.getFullYear() - birth.getFullYear();
			const m = now.getMonth() - birth.getMonth();
			if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
			if (age < ageMin || age > ageMax) continue;

      try {
        const fr = await this.userService.getFameRating(otherUser.id);
        if (typeof fameMin === 'number' && isFinite(fameMin) && fr < fameMin) continue;
        if (typeof fameMax === 'number' && isFinite(fameMax) && fr > fameMax) continue;
      } catch {}

			let distance = undefined as number | undefined;
			if (refLat !== undefined && refLng !== undefined && s.latitude !== undefined && s.longitude !== undefined) {
				distance = calculateDistance(refLat, refLng, s.latitude, s.longitude);
				if (typeof maxDistance === 'number' && isFinite(maxDistance) && distance > maxDistance) continue;
			}

			const userLikeReverse = await this.database.getRows('action', [], { userId: s.userId, targetUserId: req.user.id, status: 'like'});
			const myLikeToUser = await this.database.getRows('action', [], { userId: req.user.id, targetUserId: s.userId, status: 'like'});

			const safeUser: any = { ...otherUser };
			delete safeUser.password;
			delete safeUser.email;

			results.push({
				user: safeUser,
				settings: s,
				tags: otherTags,
				pictures: otherPictures,
				age,
				distance,
				likedYou: userLikeReverse.length > 0,
				likedByMe: myLikeToUser.length > 0,
			});
		}

		return results;
	}

	@Post(':id/block')
	@UseGuards(AuthGuard)
	async blockUser(@Param('id') id: number, @Request() req) : Promise<void> {
		try {
			if (req.user.id === id)
				throw new HttpException('You cannot block yourself', HttpStatus
					.BAD_REQUEST);
			await this.userService.blockUser(req.user.id, id);
		} catch (error) {
			if (error.message === 'User not found')
				throw new HttpException(error.message, HttpStatus.NOT_FOUND);
			throw new HttpException(
				'Failed to block user',
				HttpStatus.BAD_REQUEST,
			);
		}
	}

	@Post(':id/unblock')
	@UseGuards(AuthGuard)
	async unblockUser(@Param('id') id: number, @Request() req): Promise<void> {
		try {
			if (req.user.id === id)
				throw new BadRequestException('You connot unblock yourself');
			await this.userService.unblockUser(req.user.id, id);
		} catch (error) {
			if (error.message === 'User not found')
				throw new NotFoundException(error.message);
			throw new BadRequestException('Failed to unblock user')
		}
	}

	@Post('/settings/create')
@UseGuards(AuthGuard)
@UseInterceptors(FilesInterceptor('files', 5, {
  storage: UploadService.fileStorage('pictures'),
  fileFilter: UploadService.fileFilter(/image\/jpeg|image\/png|image\/gif/),
  limits: { fileSize: 5 * 1024 * 1024 },
}))
async createSettings(
  @UploadedFiles() files: Express.Multer.File[],
  @Body() body: any,
  @Request() req
): Promise<Settings> {
  const invalidFiles = files.filter(file => !['image/jpeg', 'image/png', 'image/gif'].includes(file.mimetype));
  if (invalidFiles.length > 0) {
    files.forEach(file => {
      const filePath = `./uploads/pictures/${file.filename}`;
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });
    throw new HttpException(`Unsupported file type. Allowed types: .png, .jpg, .jpeg, .gif`, HttpStatus.BAD_REQUEST);
  }

  let createdSettingsId: number | null = null;
  const createdTagsIds: number[] = [];
  const createdPicturesIds: number[] = [];
  let parsedData: Settings;

  try {
    parsedData = JSON.parse(body.data);
    const { tags, pictures, ...settingsData } = parsedData;

    if (settingsData.userId != req.user.id)
      throw new HttpException('You do not have permission to create settings for this user', HttpStatus.FORBIDDEN);

    if (!tags || tags.length < 7)
      throw new HttpException({ message: "Validation error", details: "You must select at least 7 tags." }, HttpStatus.BAD_REQUEST);

    if (!pictures || pictures.length < 1)
      throw new HttpException({ message: "Validation error", details: "You must upload at least one picture." }, HttpStatus.BAD_REQUEST);

    if (settingsData.minAgePreference < 18)
      throw new HttpException({ message: "Validation error", details: "Minimum age cannot be less than 18." }, HttpStatus.BAD_REQUEST);

    if (settingsData.maxAgePreference <= settingsData.minAgePreference)
      throw new HttpException({ message: "Validation error", details: "Maximum age must be greater than minimum age." }, HttpStatus.BAD_REQUEST);

    const sanitize = (value: any, maxLength: number = 255): string => {
      if (typeof value !== 'string') return '';
      return value.replace(/<[^>]+>/g, '').trim().substring(0, maxLength);
    };


    settingsData.biography = sanitize(settingsData.biography, 300);
	settingsData.maxAgePreference = 80;
	settingsData.minAgePreference = 18;
    const settings = await this.settingsService.createSettings(settingsData as Settings);
    createdSettingsId = settings.id;

    const createdTags = await Promise.all(
  (tags as Tag[]).map(tagObj =>
    this.settingsService.createTag(settings.id, (tagObj as any).tag ?? tagObj)
  )
);

    createdTagsIds.push(...createdTags.map(tag => tag.id));

    let normalizedPictures = pictures;
    if (Array.isArray(pictures) && pictures.length > 0) {
      const firstIdx = pictures.findIndex((p: any) => p?.isProfile === true);
      if (firstIdx < 0) {
        normalizedPictures = pictures.map((p: any, i: number) => ({ ...p, isProfile: i === 0 }));
      } else {
        normalizedPictures = pictures.map((p: any, i: number) => ({ ...p, isProfile: i === firstIdx }));
      }
    }
    const createdPictures: Picture[] = [];
    for (const [index, file] of files.entries()) {
      const isProfileFromRequest = normalizedPictures && normalizedPictures[index]
        ? normalizedPictures[index].isProfile
        : false;
      const picture = {
        url: `/upload/pictures/${file.filename}`,
        isProfile: isProfileFromRequest,
      };
      const createdPicture = await this.settingsService.createPicture(settings.id, picture);
      if (createdPicture) createdPictures.push(createdPicture);
    }
    createdPicturesIds.push(...createdPictures.map(pic => pic.id));

    settings.pictures = createdPictures;
    settings.tags = createdTags;
    return settings;

  } catch (error) {
    files.forEach(file => {
      const filePath = `./uploads/pictures/${file.filename}`;
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });
    if (createdPicturesIds.length > 0)
      await Promise.all(createdPicturesIds.map(id => this.settingsService.deletePicture(id)));

    if (createdTagsIds.length > 0)
      await Promise.all(createdTagsIds.map(id => this.settingsService.deleteTag(id)));

    if (createdSettingsId)
      await this.settingsService.deleteSettings(createdSettingsId);

    if (error instanceof HttpException) throw error;
    throw new HttpException('Failed to create settings', HttpStatus.BAD_REQUEST);
  }
}


	@Get('me')
	@UseGuards(AuthGuard)
	async getMe(@Request() req) : Promise<Users | null> {
		try {
			const user = await this.userService.findOne(req.user.id);
			user['fameRating'] = await this.userService.getFameRating(req.user.id);
			return user;
		} catch (error) {
			if (error.message === 'User not found')
				throw new HttpException(error.message, HttpStatus.NOT_FOUND);
			throw new HttpException(
				'Failed to retrieve user',
				HttpStatus.BAD_REQUEST,
			);
		}
	}
	
	@Get(':id/username')
	@UseGuards(AuthGuard)
	async getUsername(@Param('id') id: number){
		const user = this.userService.findOne(id);
		return (await user).username;
	}

  @Get(':id')
  @UseGuards(AuthGuard)
  async getUser(@Param('id') id: number, @Request() req) : Promise<any> {
		try {
			if (id == req.user.id) {
				return this.getMe(req);
			}
			const user = await this.userService.findOne(id);
			const me = await this.userService.findOne(req.user.id);
			if (Array.isArray(me.blockedIds) && me.blockedIds.includes(id)) {
				throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
			}
			if (Array.isArray(user.blockedIds) && user.blockedIds.includes(req.user.id)) {
				throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
			}
			delete user.settings.maxDistance
			delete user.settings.minAgePreference
			delete user.settings.maxAgePreference
			delete user.settings.id
			delete user.lastName
			delete user.isValidated
			delete user.password
			delete user.email
      delete user.blockedIds
      const chat1 = await this.database.getFirstRow('chat', [], { userId: req.user.id, targetUserId: id });
      const chat2 = await this.database.getFirstRow('chat', [], { userId: id, targetUserId: req.user.id });
      user['connected'] = !!(chat1 || chat2);
			await this.historyService.pushHistory({
				userId: id,
				fromId: req.user.id,
				message: "%user% visited your profile",
			});
			this.socketsService.getNotificationByUserId(String(id), NotificationType.Info, 'Someone visited your profile');
			user['fameRating'] = await this.userService.getFameRating(id);
      user['likedYou'] = (await this.database.getRows('action', [], { userId: id, targetUserId: req.user.id, status: 'like'})).length > 0;
			user['blocked'] = (await this.userService.findOne(req.user.id)).blockedIds.find((v) => v == id) !== undefined;
			
			return user;
		} catch (error) {
			console.error(error.message);
			if (error.message === 'User not found')
				throw new HttpException(error.message, HttpStatus.NOT_FOUND);
			throw new HttpException(
				'Failed to retrieve user',
				HttpStatus.BAD_REQUEST,
			);
		}
	}

	@Patch('settings')
	@UseInterceptors(FilesInterceptor('files', 5, {
		storage: UploadService.fileStorage('pictures'),
		fileFilter: UploadService.fileFilter(/image\/jpeg|image\/png|image\/gif/),
		limits: { fileSize: 5 * 1024 * 1024 },
	}))
	@UseGuards(AuthGuard)
	async updateSettingMe(@UploadedFiles() files: Express.Multer.File[], @Request() req, @Body() body: any) : Promise<Partial<Settings>> {
		try {
			const data = JSON.parse(body.data);

			let incomingPictures = Array.isArray(data.pictures) ? [...data.pictures] : null;
			let tags = Array.isArray(data.tags) ? [...data.tags] : null;

			if (Array.isArray(incomingPictures) && incomingPictures.length === 0) incomingPictures = null;
			if (Array.isArray(tags) && tags.length === 0) tags = null;

			delete data.pictures;
			delete data.tags;

			const hasUploadedFiles = Array.isArray(files) && files.length > 0;
			const shouldUpdatePictures = (incomingPictures !== null) || hasUploadedFiles;

			if (!shouldUpdatePictures && !tags) {
				await this.database.updateRows("settings", data, { userId: req.user.id });
				return await this.settingsService.getSettings(req.user.id);
			}

			let pictures: any[] | null = null;
			if (shouldUpdatePictures) {
				pictures = Array.isArray(incomingPictures) ? incomingPictures.map((p) => ({ ...p })) : [];
				const pending = [...(files ?? [])];
				for (let i = 0; i < pictures.length && pending.length > 0; i++) {
					if (!pictures[i].url || pictures[i].url === '') {
						const f = pending.shift();
						pictures[i].url = `/upload/pictures/${f.filename}`;
					}
				}
				while (pending.length > 0 && pictures.length < 5) {
					const f = pending.shift();
					pictures.push({ url: `/upload/pictures/${f.filename}`, isProfile: false });
				}
			}

			await this.settingsService.updateSettings(data, pictures, tags, req.user.id);
			return await this.settingsService.getSettings(req.user.id);
		} catch (error) {
			if (error.message === 'User not found') {
 				throw new HttpException(error.message, HttpStatus.NOT_FOUND);
			}
			throw new HttpException(
				error.message,
				HttpStatus.BAD_REQUEST,
			);
		}
	}

	@Patch(':id')
	@UseGuards(AuthGuard, UserGuard)
	updateUser(@Param('id') id: number, @Body() data: Partial<Users>) : Promise<Users> {
		try {
			return this.userService.update(id, data);
		} catch (error) {
			if (error.message === 'User not found') {
 				throw new HttpException(error.message, HttpStatus.NOT_FOUND);
			}
			throw new HttpException(
				'Failed to update user',
				HttpStatus.BAD_REQUEST,
			);
		}
	}


	@Delete('me')
	@UseGuards(AuthGuard)
	async deleteMyAccount(@Request() req) : Promise<void> {
		try {
			await this.userService.remove(req.user.id);
		} catch (error) {
			if (error.message === 'User not found') {
				throw new HttpException(error.message, HttpStatus.NOT_FOUND);
			}
			throw new HttpException(
				'Failed to delete account',
				HttpStatus.BAD_REQUEST,
			);
		}
	}

	@Delete(':id')
	@UseGuards(AuthGuard, UserGuard)
	deleteUser(@Param('id') id: number) : Promise<void> {
		try {
			return this.userService.remove(id);
		} catch (error) {
			if (error.message === 'User not found') {
				throw new HttpException(error.message, HttpStatus.NOT_FOUND);
			}
			throw new HttpException(
				'Failed to delete user',
				HttpStatus.BAD_REQUEST,
			);
		}
	}
}

export default UserController;
