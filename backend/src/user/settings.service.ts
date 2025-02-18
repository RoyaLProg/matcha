import { Injectable } from '@nestjs/common';
import { Database } from 'src/database/Database';
import Picture from 'src/interface/picture.interface';
import Settings from 'src/interface/settings.interface';
import Tag from 'src/interface/tags.interface';

@Injectable()
export default class SettingsService {
	constructor(private database: Database) {}

	async createSettings(data: Settings): Promise<Settings> {
		const settings = await this.database.addOne('settings', data);
		return settings as Settings;
	}

	async createTag(settingsId: number, tag: Tag): Promise<Tag> {
		console.log(tag);
		const formattedCategory = tag.category.toLowerCase().replace(/\s+/g, '_');
		const formattedTag = tag.tag.toLowerCase().replace(/\s+/g, '_');
		try {
			const existingPictures = await this.database.getFirstRow('tags_entity', [], { settingsId, category: formattedCategory, tag: formattedTag });
			if (existingPictures) {
				console.warn(`Tag ${formattedTag} already exists for category ${formattedCategory} in settings with id ${settingsId}.`);
				return existingPictures as Tag;
			}
			return await this.database.addOne('tags_entity', { settingsId, category: formattedCategory, tag: formattedTag }) as Tag;
		} catch (error) {
			throw new Error(`Failed to create tag: ${error.message}`);
		}
	}

	async createPicture(settingsId: number, picture: Picture): Promise<Picture | null> {
		try {
			const existingPictures = await this.database.getRows('picture', ['id'], { settingsId });
			if (existingPictures.length >= 5) {
				console.warn(`User with settingsId ${settingsId} already has the maximum number of pictures.`);
				return null;
			}
			return await this.database.addOne('picture', { settingsId, url: picture.url, isProfile: picture.isProfile }) as Picture;
		} catch (error) {
			throw new Error(`Failed to create picture: ${error.message}`);
		}
	}


	async updateSettings(settings: Partial<Settings>, pictures: Picture[], tags: Tag[], id: number) : Promise<void> {
		try {
			const settingsId = (await this.database.getFirstRow("settings", ["id"], {userId: id}))['id'];
			await this.database.updateRows("settings", settings, { userId: id });
			await this.database.deleteRows("picture", { settingsId: settingsId });
			pictures.forEach((p) => this.createPicture(settingsId, p));
			await this.database.deleteRows("tags_entity", { settingsId: settingsId });
			tags.forEach((t) => this.createTag(settingsId, t));
		}
		catch (error) {
			throw new Error(`Failed to update settings: ${error.message}`);
		}
	}

	async getSettings(id: number) : Promise<Settings> {
		const settings = await this.database.getFirstRow("settings", [], { userId: id }) as Settings;
		if (!settings)
			throw new Error("Settings not found");
		const settingsId = settings.id;
		const tags = await this.database.getRows("tags_entity", [], { settingsId });
		const pictures = await this.database.getRows("picture", [], { settingsId });
		if (tags)
			settings.tags = tags as Tag[];
		if (pictures)
			settings.pictures = pictures as Picture[];
		return settings as Settings;
	}

	async deleteSettings(id: number) : Promise<void> {
		await this.database.deleteRows("settings", { id });
	}

	async deleteTag(id: number) : Promise<void> {
		await this.database.deleteRows("tags_entity", { id });
	}

	async deletePicture(id: number) : Promise<void> {
		await this.database.deleteRows("picture", { id });
	}
}
