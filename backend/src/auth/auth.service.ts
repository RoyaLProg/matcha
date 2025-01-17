import { Injectable } from '@nestjs/common';
import Users from 'src/entities/users.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { randomUUID } from 'crypto';
import Auth, { tokenType } from 'src/entities/auth.entity';

@Injectable()
class AuthService {

	constructor(
		@InjectRepository(Users)
		private readonly usersRepository: Repository<Users>,
		private dataSources: DataSource,
		@InjectRepository(Auth)
		private readonly authRepository: Repository<Auth>
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

	async getToken(token: string): Promise<Auth | null>{
		return await this.authRepository.findOne({where: {token: token}, relations: ["user"]});
	}

	async deleteToken(token: string) {
		return await this.authRepository.delete({token: token});
	}

	async updateUser(user: Users) {
		return await this.usersRepository.save(user);
	}

	async getLogin(username: string, password: string): Promise<Users | null> {
		return await this.usersRepository.findOne({ where: { username: username, password: password }});
	}
}

export default AuthService;
