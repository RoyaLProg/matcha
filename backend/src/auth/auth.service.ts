import { Injectable } from '@nestjs/common';
import Users from 'src/entities/users.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

@Injectable()
class AuthService {

	constructor(
		@InjectRepository(Users)
		private readonly UsersRepository: Repository<Users>,
		private dataSources: DataSource
	) {}

	async addUser(user: Users): Promise<Users> {
		return await this.usersRepository.save(user);
	}
	private async addToken(token: Auth) {
		return await this.authRepository.save(token);
	}

	async create_token(user: Users, type?: tokenType): Promise<Auth>{
		const token: Auth = {
			token: randomUUID(),
			type: type,
			user: user
		}
		
		return await this.addToken(token);
	}
}

export default AuthService;
