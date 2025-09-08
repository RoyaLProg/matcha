import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import Auth, { TokenType } from 'src/interface/auth.interface';
import { Database } from '../database/Database';
import Users from 'src/interface/users.interface';
import * as crypto from 'crypto';

@Injectable()
class AuthService {

	constructor(
		private readonly database: Database
	) {}

	async hashPassword(plain: string): Promise<string> {
		const salt = crypto.randomBytes(16);
		const key = await new Promise<Buffer>((resolve, reject) => {
			crypto.scrypt(plain, salt, 64, { N: 16384, r: 8, p: 1 }, (err, derivedKey) => {
				if (err) reject(err); else resolve(derivedKey as Buffer);
			});
		});
		return `s2$${salt.toString('base64')}$${key.toString('base64')}`;
	}

	async verifyPassword(plain: string, stored: string): Promise<{ valid: boolean, needsUpgrade?: boolean, newHash?: string }>{
		if (stored && stored.startsWith('s2$')) {
			const parts = stored.split('$');
			if (parts.length !== 3) return { valid: false };
			const salt = Buffer.from(parts[1], 'base64');
			const hash = parts[2];
			const derived = await new Promise<Buffer>((resolve, reject) => {
				crypto.scrypt(plain, salt, 64, { N: 16384, r: 8, p: 1 }, (err, dk) => {
					if (err) reject(err); else resolve(dk as Buffer);
				});
			});
			const valid = crypto.timingSafeEqual(derived, Buffer.from(hash, 'base64'));
			return { valid };
		}
		try {
			const sha256 = require('js-sha256');
			const hex = sha256.sha256(plain);
			if (typeof stored === 'string' && stored.length === 64 && /^[a-f0-9]+$/i.test(stored) && stored === hex) {
				const newHash = await this.hashPassword(plain);
				return { valid: true, needsUpgrade: true, newHash };
			}
		} catch {}
		return { valid: false };
	}

	async addUser(user: Users): Promise<Users> {
		return (await this.database.addOne('users', user)) as Users;
	}

	private async addToken(token: Auth) {
		return (await this.database.addOne('auth', token)) as Auth;
	}

	async create_token(user: Users, type?: TokenType): Promise<Auth>{
		const token: Auth = {
			token: randomUUID(),
			type: type ?? TokenType.CREATE,
			userId: user.id.toString()
		}

		return await this.addToken(token);
	}

	async getToken(token: string): Promise<Auth | null>{
		const result = (await this.database.getFirstRow('auth', [], { token: token }, { users: { userId: 'id' } })) as Auth | null;
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
		const user = (await this.database.getFirstRow('users', [], { username })) as Users | null;
		if (!user) return null;
		const check = await this.verifyPassword(password, (user as any).password);
		if (!check.valid) return null;
		if (check.needsUpgrade && check.newHash) {
			try { await this.database.updateRows('users', { password: check.newHash }, { id: (user as any).id }); } catch {}
		}
		return user;
	}

	async test(){
		return await this.database.getFirstRow('auth', [], {}, { users: { userId: 'id' } });
	}
}

export default AuthService;
