import { Controller, Get, Post, Body, BadRequestException, NotFoundException, UnauthorizedException, ForbiddenException, HttpException, HttpStatus } from '@nestjs/common';
import { Controller, Get, Post, Body, Patch, Param, Delete, Res, BadRequestException, NotFoundException, UnauthorizedException, ForbiddenException, HttpException, HttpStatus } from '@nestjs/common';
import Users from 'src/entities/users.entity';
import AuthService from './auth.service';
import { UserGender, UserSexualOrientation } from 'src/entities/users.entity';
import { sha256 } from 'js-sha256';
import { MailerService } from '@nestjs-modules/mailer';
import UserService from 'src/user/user.service';

@Controller("auth")
export class AuthController {

	constructor(
		private readonly authService: AuthService,
		private readonly mailService: MailerService,
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
		try {
			const token = await this.authService.create_token(user);
			const message = `Welcome to Matcha the latte
	
							Can you please click this <a href="http://localhost:5173/verify/${token.token}">link</a> to confirm your email`;
			await this.mailService.sendMail({
				to: user.email,
				text: message,
				subject: "Matcha The Latte - Email Verification"
			});
		} catch (e) {
			console.log(e);
			throw new BadRequestException('could not send email');
		}
		return result;
	}

	@Post('login')
	async login(@Body() body) : Promise<Omit<Users, 'password'> | undefined> {
		try {
			const hash = sha256.create();
			return await this.authService.getLogin(body.username, hash.update(body.password).hex());
		} catch (error) {
			if (error.message === 'user not found') {
				throw new NotFoundException('User not found');
			} else if (error.message === 'password not correct') {
				throw new UnauthorizedException('Password not correct');
			} else if (error.message === 'user not validated') {
				throw new ForbiddenException('User not validated');
			}
			throw new HttpException(
				'Failed to retrieve user',
				HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}
}

export default AuthController;
