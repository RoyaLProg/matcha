import { Injectable } from '@nestjs/common';
import Users from 'src/entities/users.entity';
import { DataSource } from 'typeorm';

@Injectable()
class UserService {
	constructor(
		private dataSources: DataSource
	) { }

	async findAll() : Promise<Users[]> {
		return await this.dataSources.getRepository(Users).find();
	}

	async findOne(id: number) : Promise<Users> {
		const user = await this.dataSources.getRepository(Users).findOne({ where: { id } });
		if (!user) {
			throw new Error('User not found');
		}
		return user;
	}

	async update(id: number, data: Partial<Users>) : Promise<Users> {
		const user = await this.dataSources.getRepository(Users).findOne({ where: { id } });
		if (!user) {
			throw new Error('User not found');
		}
		Object.assign(user, data);
		return await this.dataSources.getRepository(Users).save(user);
	}

	async remove(id: number) : Promise<void> {
		const user = await this.dataSources.getRepository(Users).findOne({ where: { id } });
		if (!user) {
			throw new Error('User not found');
		}
		await this.dataSources.getRepository(Users).remove(user);
	}
}

export default UserService;
