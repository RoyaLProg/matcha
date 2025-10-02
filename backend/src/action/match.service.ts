import { Injectable } from '@nestjs/common';
import { Database } from 'src/database/Database';
import Picture from 'src/interface/picture.interface';
import Settings from 'src/interface/settings.interface';
import Tag from 'src/interface/tags.interface';
import Users from 'src/interface/users.interface';

@Injectable()
export default class MatchService {
    constructor(private database: Database) {}

	private async calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) : Promise<number> {
		const R = 6378;
		[lat1, lon1, lat2, lon2] = [lat1, lon1, lat2, lon2].map(coord => coord * (Math.PI / 180));
		const dLat = lat2 - lat1;
		const dLon = lon2 - lon1;

		const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		return R * c;
	}

	private async calculeAge(birthday: string) : Promise<number> {
		const today = new Date();
		const birth = new Date(birthday);
		let age = today.getFullYear() - birth.getFullYear();
		const monthDiff = today.getMonth() - birth.getMonth();
		if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate()))
			age--;
		return age;
	}

    private async findCommonTags(userTags: Tag[], otherUserTags: Tag[]) : Promise<number> {
        return userTags.filter((tag) => otherUserTags.some((t) => t.tag === tag.tag)).length;
    }


	private isOrientationCompatible(my: Settings, other: Settings): boolean {
		// Si orientation non spécifiée = bisexuel par défaut (selon specs)
		const mine = my.sexualOrientation || 'bisexual';
		const theirs = other.sexualOrientation || 'bisexual';

		const sameGender = my.gender === other.gender;
		const differentGender = my.gender !== other.gender;

		const meOk =
			mine === 'bisexual' ? true :
			mine === 'heterosexual' ? differentGender :
			mine === 'homosexual' ? sameGender : false;

		const otherOk =
			theirs === 'bisexual' ? true :
			theirs === 'heterosexual' ? differentGender :
			theirs === 'homosexual' ? sameGender : false;

		return meOk && otherOk;
	}

	async getMatches(userId: number) : Promise<any> {
		try {
			const userExists = await this.database.getFirstRow('users', [], { id: userId }) as Users;
			if (!userExists) throw new Error('User not found');
			const userSettings = await this.database.getFirstRow('settings', [], { userId }) as Settings;
			if (!userSettings) throw new Error('User settings not found');
			const userTags = await this.database.getRows('tags_entity', [], { settingsId: userSettings.id }) as Tag[];
			const userPictures = await this.database.getRows('picture', [], { settingsId: userSettings.id }) as Picture[];
			if (!Array.isArray(userTags) || userTags.length === 0) return [];
			if (!Array.isArray(userPictures) || userPictures.length === 0) return [];
			const potentialUsersSetting = await this.database.getRows('settings', []) as Settings[];
			if (!Array.isArray(potentialUsersSetting) || potentialUsersSetting.length === 0) return [];
		
            const myAge = await this.calculeAge(userExists.birthday);
            const potentialUsers = await Promise.all(potentialUsersSetting.map(async (settings) => {
                if (Number(settings.userId) === userId) return null
                const otherTags = await this.database.getRows('tags_entity', [], { settingsId: settings.id }) as Tag[];
                const distance = await this.calculateDistance(userSettings.latitude, userSettings.longitude, settings.latitude, settings.longitude);
                const commonTagsCount = await this.findCommonTags(userTags, otherTags);
                if (commonTagsCount === 0 || distance > userSettings.maxDistance || distance > settings.maxDistance) return null;
                const otherUser = await this.database.getFirstRow('users', [], { id: settings.userId }) as Users;
                if (!otherUser) return null;
                delete otherUser.password;
                delete otherUser.email;
                const myBlocked = Array.isArray(userExists.blockedIds) ? userExists.blockedIds : [];
                const theirBlocked = Array.isArray(otherUser.blockedIds) ? otherUser.blockedIds : [];
                if (myBlocked.includes(Number(settings.userId)) || theirBlocked.includes(userId)) {
                    return null;
                }
                if (!this.isOrientationCompatible(userSettings, settings)) return null;
                const age = await this.calculeAge(otherUser.birthday);
                if (age < userSettings.minAgePreference || age > userSettings.maxAgePreference) return null;
                if (myAge < settings.minAgePreference || myAge > settings.maxAgePreference) return null;
                const userLikeOther = await this.database.getRows('action', [], { userId: userId, targetUserId: settings.userId, status: 'like'});
                const userLikeReverse = await this.database.getRows('action', [], { userId: settings.userId, targetUserId: userId, status: 'like'});
                if (userLikeOther.length > 0) return null;
                const otherPictures = await this.database.getRows('picture', [], { settingsId: settings.id }) as Picture[];
                if (otherPictures.length === 0) return null;
                const otherFameRating = await this.getFameRating(otherUser.id);
                const userFameRating = await this.getFameRating(userId);
                if (otherFameRating > userSettings.maxFameRating || userFameRating > settings.maxFameRating) return null;
                return {
                    user: otherUser,
                    settings,
                    tags: otherTags,
                    pictures: otherPictures,
                    distance,
                    age,
                    likedYou: userLikeReverse.length > 0,
                    commonTagsCount,
                    fameRating: otherFameRating,
                };
            }));
			const areaThresholdKm = 10;
			return potentialUsers
				.filter((u: any) => u !== null)
				.sort((a: any, b: any) => {
					const aSame = Number(a.distance !== undefined && a.distance <= areaThresholdKm);
					const bSame = Number(b.distance !== undefined && b.distance <= areaThresholdKm);
					if (aSame !== bSame) return bSame - aSame;
					const da = typeof a.distance === 'number' ? a.distance : Number.POSITIVE_INFINITY;
					const db = typeof b.distance === 'number' ? b.distance : Number.POSITIVE_INFINITY;
					if (da !== db) return da - db;
					const ta = a.commonTagsCount ?? 0;
					const tb = b.commonTagsCount ?? 0;
					if (ta !== tb) return tb - ta;
					const fa = a.fameRating ?? 0;
					const fb = b.fameRating ?? 0;
					return fb - fa;
				});
		} catch (error) {
			throw new Error(`Failed to get matches: ${error.message}`);
		}
	}

    async getFameRating(userId: number) {
        // Count all likes received (from action table, not history)
        const likes = await this.database.getRows("action", undefined, {targetUserId: userId, status: 'like'});
        return likes.length;
    }

}
