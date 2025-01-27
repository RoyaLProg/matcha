import { Injectable } from '@nestjs/common';
import { Database } from 'src/database/Database';
import Users from 'src/entities/users.interface';

@Injectable()
class UserService {
	constructor(
		private database: Database
	) { }

	async findAll() : Promise<Users[]> {
		const users = await this.database.getRows('users');
		return users as Users[];
	}

	async findOne(id: number) : Promise<Users> {
		const user = await this.database.getFirstRow('users', [], { id });
		if (!user)
			throw new Error('User not found');
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

export default UserService;
