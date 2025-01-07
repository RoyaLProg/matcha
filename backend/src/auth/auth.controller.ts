import { Controller, Get, Post, Body, BadRequestException } from '@nestjs/common';
import Users from 'src/entitys/users.entity';
import AuthService from './auth.service';
import { UserGender, UserSexualOrientation } from 'src/entitys/users.entity';
import { sha256 } from 'js-sha256';

@Controller("auth")
export class AuthController {
	
	constructor(
		private readonly authService: AuthService,
	) {}

	@Get('')
	async test () : Promise<string> {
		return "test"
	}

	checkPassword(value: string) {
		const i1 = new RegExp(/[_\-\*@!]/).test(value);
		const i2 = new RegExp(/[0-9]/).test(value);
		const i3 = new RegExp(/[a-z]/).test(value);	
		const i4 = new RegExp(/[A-Z]/).test(value);	

		return (i1 && i2 && i3 && i4);
	}

	@Post('register')
	async register(@Body() body) : Promise<Users> {
		const user: Users = {
			fistName: body.firstName,
			lastName: body.lastName,
			username: body.username,
			password: body.password,
			birthDate: body.birthDate,
			email: body.email,
			sexualOrientation: UserSexualOrientation.Undefined,
			gender: UserGender.Undefined,
			isValidated: false,
		}

		if (! new RegExp(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/).test(user.email) )
			throw new BadRequestException('not a valid email');
		if (! this.checkPassword(user.password))
			throw new BadRequestException('password is too weak');
		const hash = sha256.create();
		user.password = hash.update(user.password).hex();
		let result: Users;
		try {
			result =  await this.authService.addUser(user);
		} catch (e) {
			throw new BadRequestException('email or user already exist');
		}

		return result;
	}
}

export default AuthController;
