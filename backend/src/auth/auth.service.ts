import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import Auth, { TokenType } from 'src/entities/auth.interface';
import { Database } from '../database/Database';
import Users from 'src/entities/users.interface';

@Injectable()
class AuthService {

	constructor(
		private readonly database: Database
	) {}

	async addUser(user: Users): Promise<Users> {
		return (await this.database.addOne('users', user)) as Users;
	}

	private async addToken(token: Auth) {
		return (await this.database.addOne('auth', token)) as Auth;
	}

	async create_token(user: Users, type?: TokenType): Promise<Auth>{
		const token: Auth = {
			token: randomUUID(),
			type: type,
			user: user
		}

		return await this.addToken(token);
	}

	async getToken(token: string): Promise<Auth | null>{
		const result = (await this.database.getFirstRow('auth', [], { token: token }, { Users: { userId: 'id' } })) as Auth | null;
		return result;
	}

	async deleteToken(token: string) {
		return await this.database.deleteRows('auth', { token: token });
	}

	async updateUser(user: Users) {
		const updatedUser = await this.database.updateRows('users', user, { id: user.id });
		return updatedUser as Users;
	}

	async getLogin(username: string, password: string): Promise<Users | null> {
		const user = (await this.database.getFirstRow('users', [], { username: username, password: password })) as Users | null;
		return user;
	}

	async test(){
		return await this.database.getFirstRow('auth', [], {}, { Users: { userId: 'id' } });
	}
}

export default AuthService;
