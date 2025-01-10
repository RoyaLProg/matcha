import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Users from 'src/entities/users.entity';
import { DataSource, Repository } from 'typeorm';

@Injectable()
class UserService {
	constructor(
		@InjectRepository(Users)
		private userRepository: Repository<Users>
	) { }

	async findAll() : Promise<Users[]> {
		return await this.userRepository.find();
	}

	async findOne(id: number) : Promise<Users> {
		const user = await this.userRepository.findOne({ where: { id } });
		if (!user) {
			throw new Error('User not found');
		}
		return user;
	}

	async update(id: number, data: Partial<Users>) : Promise<Users> {
		const user = await this.userRepository.findOne({ where: { id } });
		if (!user) {
			throw new Error('User not found');
		}
		Object.assign(user, data);
		return await this.userRepository.save(user);
	}

	async remove(id: number) : Promise<void> {
		const user = await this.userRepository.findOne({ where: { id } });
		if (!user) {
			throw new Error('User not found');
		}
		await this.userRepository.remove(user);
	}

	async findOneByUsername(username: string) : Promise<Users> {
		return await this.userRepository.findOne({ where: { username: username } });
	}
}

export default UserService;
