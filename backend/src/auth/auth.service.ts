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
		return await this.UsersRepository.save(user);
	}

	async getLogin(username: string, password: string): Promise<Omit<Users, 'password'> | undefined> {
		const user = await this.dataSources.getRepository(Users).findOne({ where: { username: username }});
		if (!user)
			throw new Error('user not found');
		if (user.password !== password)
			throw new Error('password not correct');
		if (!user.isValidated)
			throw new Error('user not validated');
		if (user.biography === "")
			return undefined;
		const { password: _, ...userWithoutPassword } = user;
		return userWithoutPassword;
	}
}

export default AuthService;
