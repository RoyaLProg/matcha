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

@Controller('Users')
class UserController {
	constructor(
		private readonly userService: UserService,
		private readonly settingsService: SettingsService,
		private readonly historyService: HistoryService,
		private readonly database: Database,
	) { }

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
	}))
	async createSettings(@UploadedFiles() files: Express.Multer.File[], @Body() body: any, @Request() req): Promise<Settings> {
		const invalidFiles = files.filter((file) => !['image/jpeg', 'image/png', 'image/gif'].includes(file.mimetype));
		if (invalidFiles.length > 0) {
			files.forEach((file) => {
				const filePath = `./upload/pictures/${file.filename}`;
				fs.unlinkSync(filePath);
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
			settingsData.country = sanitize(settingsData.country, 100);
			settingsData.city = sanitize(settingsData.city, 100);

			const settings = await this.settingsService.createSettings(settingsData as Settings);
			createdSettingsId = settings.id;
			const createdTags = await Promise.all(
				tags.map((tag) => this.settingsService.createTag(settings.id, tag))
			);
			createdTagsIds.push(...createdTags.map((tag) => tag.id));

			const createdPictures: Picture[] = [];
			for (const [index, file] of files.entries()) {
				const isProfileFromRequest = pictures && pictures[index] ? pictures[index].isProfile : false;
				const picture = {
					url: `/upload/pictures/${file.filename}`,
					isProfile: isProfileFromRequest,
				}
				const createdPicture = await this.settingsService.createPicture(settings.id, picture);
				if (createdPicture) createdPictures.push(createdPicture);
			}
			createdPicturesIds.push(...createdPictures.map((picture) => picture.id));

			settings.pictures = createdPictures;
			settings.tags = createdTags;
			return settings;
		} catch (error) {
			files.forEach((file) => {
				const filePath = `./uploads/pictures/${file.filename}`;
				if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
			});
			if (createdPicturesIds.length > 0) {
				await Promise.all(createdPicturesIds.map((id) => this.settingsService.deletePicture(id)));
			}
			if (createdTagsIds.length > 0) {
				await Promise.all(createdTagsIds.map((id) => this.settingsService.deleteTag(id)));
			}
			if (createdSettingsId) {
				await this.settingsService.deleteSettings(createdSettingsId);
			}

			if (error instanceof HttpException) {
				throw error;
			}
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
			delete user.settings.maxDistance
			delete user.settings.minAgePreference
			delete user.settings.maxAgePreference
			delete user.settings.id
			delete user.lastName
			delete user.isValidated
			delete user.password
			delete user.email
			delete user.blockedIds
			await this.historyService.pushHistory({
				userId: id,
				fromId: req.user.id,
				message: "%user% visited your profile",
			});
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
	}))
	@UseGuards(AuthGuard)
	async updateSettingMe(@UploadedFiles() files: Express.Multer.File[], @Request() req, @Body() body: any) : Promise<Partial<Settings>> {
		try {
			const data = JSON.parse(body.data);

			const pictures = Array.isArray(data.pictures) ? [...data.pictures] : null;
			const tags = Array.isArray(data.tags) ? [...data.tags] : null;

			delete data.pictures;
			delete data.tags;

			if (!pictures && !tags) {
				await this.database.updateRows("settings", data, { userId: req.user.id });
				return await this.settingsService.getSettings(req.user.id);
			}

			files.forEach(
				(f, i) => pictures[i].url = `/upload/pictures/${f.filename}`
			);


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
