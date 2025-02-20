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

	private async calculeAge(birthDate: string) : Promise<number> {
		const today = new Date();
		const birth = new Date(birthDate);
		let age = today.getFullYear() - birth.getFullYear();
		const monthDiff = today.getMonth() - birth.getMonth();
		if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate()))
			age--;
		return age;
	}

	private async findCommonTags(userTags: Tag[], otherUserTags: Tag[]) : Promise<number> {
		return userTags.filter((tag) => otherUserTags.find((t) => t.category === tag.category && t.tag === tag.tag)).length;
	}

	async getMatches(userId: number) : Promise<any> {
		try {
			const userExists = await this.database.getFirstRow('users', [], { id: userId });
			if (!userExists) throw new Error('User not found');
			const userSettings = await this.database.getFirstRow('settings', [], { userId }) as Settings;
			if (!userSettings) throw new Error('User settings not found');
			const userTags = await this.database.getRows('tags_entity', [], { settingsId: userSettings.id }) as Tag[];
			const userPictures = await this.database.getRows('picture', [], { settingsId: userSettings.id }) as Picture[];
			if (userTags.length === 0) throw new Error('User has no tags');
			if (userPictures.length === 0) throw new Error('User has no pictures');
			const potentialUsersSetting = await this.database.getRows('settings', []) as Settings[];
			if (potentialUsersSetting.length === 0) throw new Error('No potential users found');
			const potentialUsers = await Promise.all(potentialUsersSetting.map(async (settings) => {
				if (Number(settings.userId) === userId) return null
				console.log(settings)
				const otherTags = await this.database.getRows('tags_entity', [], { settingsId: settings.id }) as Tag[];
				const distance = await this.calculateDistance(userSettings.latitude, userSettings.longitude, settings.latitude, settings.longitude);
				const commonTagsCount = await this.findCommonTags(userTags, otherTags);
				console.log(commonTagsCount, ' ', distance);
				if (commonTagsCount === 0 || distance > userSettings.maxDistance || distance > settings.maxDistance) return null;
				console.log('oui')
				const otherUser = await this.database.getFirstRow('users', [], { id: settings.userId }) as Users;
				if (!otherUser) return null;
				delete otherUser.password;
				delete otherUser.email;
				console.log('oui1')
				// Vérification de la compatibilité des orientations sexuelles
				const isCompatible = (userSettings.sexualOrientation === 'heterosexual' && settings.gender !== userSettings.gender) ||
						(userSettings.sexualOrientation === 'homosexual' && settings.gender === userSettings.gender) ||
						(userSettings.sexualOrientation === 'bisexual' && settings.sexualOrientation === 'bisexual');

				const otherIsCompatible = (settings.sexualOrientation === 'heterosexual' && userSettings.gender !== settings.gender) ||
						(settings.sexualOrientation === 'homosexual' && userSettings.gender === settings.gender) ||
						(settings.sexualOrientation === 'bisexual' && userSettings.sexualOrientation === 'bisexual');
				console.log(isCompatible, ' ', otherIsCompatible);
				if (!isCompatible || !otherIsCompatible) return null;
				const age = await this.calculeAge(otherUser.birthDate);
				console.log(age);
				if (age < userSettings.minAgePreference || age > userSettings.maxAgePreference || age < settings.minAgePreference || age > settings.maxAgePreference) return null;
				const userLikeOther = await this.database.getRows('action', [], { userId: userId, targetUserId: settings.userId, status: 'like'});
				// const userLikeReverse = await this.database.getRows('action', [], { userId: settings.userId, targetUserId: userId, status: 'like'});
				console.log(userLikeOther)
				if (userLikeOther.length > 0) return null;
				const otherPictures = await this.database.getRows('picture', [], { settingsId: settings.id }) as Picture[];
				if (otherPictures.length === 0) return null;
				console.log('ouiii')
				return { user: otherUser, settings, tags: otherTags, pictures: otherPictures, distance, age };
			}));
			return potentialUsers.filter((user) => user !== null);
		} catch (error) {
			throw new Error(`Failed to get matches: ${error.message}`);
		}
	}

}