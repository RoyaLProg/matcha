import { Injectable } from '@nestjs/common';
import { Database } from 'src/database/Database';
import Settings from 'src/interface/settings.interface';

@Injectable()
export default class SettingsService {
	constructor(private database: Database) {}

	async createSettings(data: any) : Promise<Settings> {
		//add en premier les tags et les pictures
		const settings = await this.database.addOne("settings", data);
		return settings as Settings;
	}

	async updateSettings(data: any, id: number) : Promise<Settings> {
		const settings = await this.database.updateRows("settings", data, { id });
		return settings[0] as Settings;
	}

	async getSettings(id: number) : Promise<Settings> {
		const settings = await this.database.getFirstRow("settings", [], { id });
		return settings as Settings;
	}

	async deleteSettings(id: number) : Promise<void> {
		await this.database.deleteRows("settings", { id });
	}
}
