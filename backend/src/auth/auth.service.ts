import { Injectable } from '@nestjs/common';
import Users from 'src/entities/users.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
class AuthService {

	constructor(
		@InjectRepository(Users)
		private readonly UsersRepository: Repository<Users>,
	) {}

	async addUser(user: Users): Promise<Users> {
		return await this.UsersRepository.save(user);
	}
}

export default AuthService;
