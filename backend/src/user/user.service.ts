import { Injectable } from '@nestjs/common';
import { Database } from 'src/database/Database';
import Picture from 'src/interface/picture.interface';
import Settings from 'src/interface/settings.interface';
import Tag from 'src/interface/tags.interface';
import Users from 'src/interface/users.interface';

@Injectable()
export default class UserService {
	constructor(
		private database: Database
	) { }

	async findAll() : Promise<Users[]> {
		const users = await this.database.getRows('users');
		return users as Users[];
	}

	async findOne(id: number) : Promise<Users> {
		const user = await this.database.getFirstRow('users', [], { id }) as Users;
		if (!user)
			throw new Error('User not found');
		const settings = await this.database.getFirstRow('settings', [], { userId: id }) as Settings;
		if (settings) {
			user.settings = settings;
			const tags = await this.database.getRows('tags_entity', [], { settingsId: settings.id })// as Tag[];
			const pictures = await this.database.getRows('picture', [], { settingsId: settings.id })// as Picture[];
			// console.log(tags, pictures);
			if (tags)
				settings.tags = tags.map((v) => {return v as Tag});
			if (pictures)
				settings.pictures = pictures.map((v) => {return v as Picture});
		}
		delete user.password;
		return user as Users;
	}

	async update(id: number, data: Partial<Users>) : Promise<Users> {
		const user = await this.database.getFirstRow('users', [], { id });
		if (!user)
			throw new Error('User not found');
		const updatedUser = await this.database.updateRows('users', data, { id });
		return updatedUser[0] as Users;
	}

	async remove(id: number) : Promise<void> {
		const user = await this.database.getFirstRow('users', [], { id });
		if (!user)
			throw new Error('User not found');
		await this.database.deleteRows('users', { id });
	}

	async findOneByUsername(username: string) : Promise<Users> {
		const user = await this.database.getFirstRow('users', [], { username });
		if (!user)
			throw new Error('User not found');
		return user as Users;
	}
}
