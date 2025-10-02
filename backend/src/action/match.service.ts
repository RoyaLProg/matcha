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

    private jaccardSimilarity(userTags: Tag[], otherUserTags: Tag[]): number {
        try {
            const a = new Set((userTags || []).map((t) => t.tag));
            const b = new Set((otherUserTags || []).map((t) => t.tag));
            if (a.size === 0 && b.size === 0) return 0;
            let inter = 0;
            for (const t of a) if (b.has(t)) inter++;
            const union = new Set<string>([...a, ...b]).size || 1;
            return inter / union;
        } catch {
            return 0;
        }
    }

    private clamp01(n: number): number {
        if (!Number.isFinite(n)) return 0;
        if (n < 0) return 0;
        if (n > 1) return 1;
        return n;
    }

    private computeCompatibility(args: {
        mySettings: Settings,
        myAge: number,
        myTags: Tag[],
        otherSettings: Settings,
        otherAge: number,
        otherTags: Tag[],
        distanceKm: number,
        otherFame: number,
        myFame: number,
        likedYou: boolean,
    }) {
        const {
            mySettings, myAge, myTags,
            otherSettings, otherAge, otherTags,
            distanceKm, otherFame, myFame, likedYou,
        } = args;

        // Weights (sum to 1). LikedYou adds a small bonus treated after weighting
        const W_TAGS = 0.35;
        const W_DISTANCE = 0.30;
        const W_AGE = 0.25;
        const W_FAME = 0.10;
        const BONUS_LIKED = 0.10; // bonus if the other user liked you

        // Tags similarity via Jaccard (0..1)
        const tagSim = this.jaccardSimilarity(myTags, otherTags);

        // Distance: closer is better
        // Use exponential decay for more realistic distance scoring
        // Users within 10km get high score, drops off quickly after
        let distScore = 0;
        if (Number.isFinite(distanceKm)) {
            const maxReasonableDistance = 100; // km - beyond this compatibility drops significantly
            distScore = Math.exp(-distanceKm / (maxReasonableDistance / 3));
            distScore = this.clamp01(distScore);
        }

        // Age fit: check if each person is within the other's preferred range
        const myMin = Number(mySettings.minAgePreference ?? 18);
        const myMax = Number(mySettings.maxAgePreference ?? 80);
        const otherMin = Number(otherSettings.minAgePreference ?? 18);
        const otherMax = Number(otherSettings.maxAgePreference ?? 80);

        // Calculate how well the other person fits MY age preference
        let fitOtherToMe = 0;
        if (otherAge >= myMin && otherAge <= myMax) {
            // Within range: score based on distance from ideal (middle of range)
            const myIdeal = (myMin + myMax) / 2;
            const myRange = Math.max(1, myMax - myMin);
            const deviation = Math.abs(otherAge - myIdeal) / (myRange / 2);
            fitOtherToMe = this.clamp01(1 - deviation * 0.3); // Max 30% penalty for edge of range
        } else {
            // Outside range: 0 score
            fitOtherToMe = 0;
        }

        // Calculate how well I fit the OTHER person's age preference
        let fitMeToOther = 0;
        if (myAge >= otherMin && myAge <= otherMax) {
            const otherIdeal = (otherMin + otherMax) / 2;
            const otherRange = Math.max(1, otherMax - otherMin);
            const deviation = Math.abs(myAge - otherIdeal) / (otherRange / 2);
            fitMeToOther = this.clamp01(1 - deviation * 0.3);
        } else {
            fitMeToOther = 0;
        }

        // Both must fit each other's preferences for good compatibility
        const ageScore = (fitOtherToMe * 0.5) + (fitMeToOther * 0.5);

        // Fame: prefer similar fame ratings (normalized)
        const maxFame = 100; // reasonable upper bound for fame
        const fameDiff = Math.abs((otherFame || 0) - (myFame || 0));
        const fameScore = this.clamp01(1 - (fameDiff / maxFame));

        const base = (tagSim * W_TAGS) + (distScore * W_DISTANCE) + (ageScore * W_AGE) + (fameScore * W_FAME);
        const finalScore = Math.min(1, base + (likedYou ? BONUS_LIKED : 0));

        const breakdown = {
            tags: Math.round(tagSim * W_TAGS * 100),
            distance: Math.round(distScore * W_DISTANCE * 100),
            age: Math.round(ageScore * W_AGE * 100),
            fame: Math.round(fameScore * W_FAME * 100),
            likedBonus: likedYou ? Math.round(BONUS_LIKED * 100) : 0,
        };
        const percentage = Math.max(0, Math.min(100, Math.round(finalScore * 100)));
        return { percentage, breakdown };
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
                const compatibility = this.computeCompatibility({
                    mySettings: userSettings,
                    myAge,
                    myTags: userTags,
                    otherSettings: settings,
                    otherAge: age,
                    otherTags,
                    distanceKm: distance,
                    otherFame: otherFameRating,
                    myFame: userFameRating,
                    likedYou: userLikeReverse.length > 0,
                });
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
                    compatibility,
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

    // Public API used by UserController to compare two users directly
    public async calculateCompatibilityScore(userId: number, otherUserId: number): Promise<number> {
        try {
            if (!Number.isFinite(userId) || !Number.isFinite(otherUserId) || userId === otherUserId) return 0;

            const me = await this.database.getFirstRow('users', [], { id: userId }) as Users;
            const other = await this.database.getFirstRow('users', [], { id: otherUserId }) as Users;
            if (!me || !other) return 0;

            const mySettings = await this.database.getFirstRow('settings', [], { userId }) as Settings;
            const otherSettings = await this.database.getFirstRow('settings', [], { userId: otherUserId }) as Settings;
            if (!mySettings || !otherSettings) return 0;

            // If sexual orientations are incompatible, compatibility is 0
            if (!this.isOrientationCompatible(mySettings, otherSettings)) return 0;

            const myTags = await this.database.getRows('tags_entity', [], { settingsId: mySettings.id }) as Tag[];
            const otherTags = await this.database.getRows('tags_entity', [], { settingsId: otherSettings.id }) as Tag[];

            let distanceKm = Number.POSITIVE_INFINITY;
            if (
                Number.isFinite(mySettings.latitude) && Number.isFinite(mySettings.longitude) &&
                Number.isFinite(otherSettings.latitude) && Number.isFinite(otherSettings.longitude)
            ) {
                distanceKm = await this.calculateDistance(
                    Number(mySettings.latitude), Number(mySettings.longitude),
                    Number(otherSettings.latitude), Number(otherSettings.longitude)
                );
            }

            const myAge = await this.calculeAge(me.birthday as any);
            const otherAge = await this.calculeAge(other.birthday as any);
            const myFame = await this.getFameRating(userId);
            const otherFame = await this.getFameRating(otherUserId);
            const likedYou = (await this.database.getRows('action', [], { userId: otherUserId, targetUserId: userId, status: 'like'})).length > 0;

            const { percentage } = this.computeCompatibility({
                mySettings,
                myAge,
                myTags,
                otherSettings,
                otherAge,
                otherTags,
                distanceKm,
                otherFame,
                myFame,
                likedYou,
            });
            return percentage;
        } catch {
            return 0;
        }
    }
}
