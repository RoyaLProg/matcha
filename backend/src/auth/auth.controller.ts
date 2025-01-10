import { Controller, Get, Post, Body, Patch, Param, Delete, Res, BadRequestException, NotFoundException, UnauthorizedException, ForbiddenException, HttpException, HttpStatus } from '@nestjs/common';
import Users from 'src/entities/users.entity';
import AuthService from './auth.service';
import { UserGender, UserSexualOrientation } from 'src/entities/users.entity';
import { sha256 } from 'js-sha256';
import { MailerService } from '@nestjs-modules/mailer';
import UserService from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { tokenType } from 'src/entities/auth.entity';
import { hash } from 'crypto';

@Controller("auth")
export class AuthController {

	constructor(
		private readonly authService: AuthService,
		private readonly mailService: MailerService,
		private readonly userService: UserService,
		private readonly jwtService: JwtService
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
				html: message,
				subject: "Matcha The Latte - Email Verification"
			});
		} catch (e) {
			console.log(e);
			throw new BadRequestException('could not send email');
		}

		return result;
	}

	@Delete('verify/:token')
	async verify(@Param('token') token: string) {
		if (! token.length)
			throw new BadRequestException('token is empty');

		const Authtoken = await this.authService.getToken(token);
		if (Authtoken === null)
			throw new BadRequestException('token is invalid');
		if (Authtoken.type !== tokenType.CREATE)
			throw new BadRequestException('token is invalid');
		let user = Authtoken.user;
		if (user.isValidated === true)
			throw new BadRequestException('user is already validated');


		user.isValidated = true;
		this.authService.updateUser(user);

		await this.authService.deleteToken(token);

		return 'email has been verified';
	}

	@Post('login')
	async login(@Body() body, @Res({passthrough: true}) res: Response) {
			const hash = sha256.create();
			const password = hash.update(body.password).hex();
			const user: Users | null = await this.authService.getLogin(body.username, password);
			if (user === null)
				throw new UnauthorizedException('username or password incorrect');
			if (!user.isValidated)
				throw new UnauthorizedException('you need to verify your email first');
			const payload: Omit<Users, 'password'> = user;
			const jwt: string = this.jwtService.sign(JSON.stringify(payload), {secret: process.env.JWT_SECRET});
			let eat = new Date();
			eat.setMonth(eat.getMonth() + 2);
			res.cookie("Auth", jwt, {sameSite: 'lax', httpOnly: true, expires: eat, path: '/'});
	}

	@Post('forgot')
	async forgot(@Body() body) {

		if (!body.username)
			throw new BadRequestException('no username was provided');

		const user = await this.userService.findOneByUsername(body.username);

		if (user !== null) {
			try {
				const token = await this.authService.create_token(user, tokenType.PASS_RESET);
				const message = `
									Ho no !
									You forgot your password ? do not worry !
									Here is a one time <a href="http://localhost:5173/forgot/${token.token}">link</a> to reset your password !
								`;
				await this.mailService.sendMail({
					to: user.email,
					html: message,
					subject: "Matcha The Latte - Password Reset"
				});
			} catch (e) {
				console.log(e);
			}
		}

		return 'If user exist, recovery email has been sent';
	}

	@Patch('forgot/:token')
	async changePassword(@Param('token') token: string, @Body() body) {
		if (! token.length)
			throw new BadRequestException('token is empty');

		const Authtoken = await this.authService.getToken(token);
		if (Authtoken === null)
			throw new BadRequestException('token is invalid');
		if (Authtoken.type !== tokenType.PASS_RESET)
			throw new BadRequestException('token is invalid');
		if (!this.checkPassword(body.password))
			throw new BadRequestException('password does not comply with requirements');

		let user = Authtoken.user;

		const hash = sha256.create();
		user.password = hash.update(body.password).hex();
		this.authService.updateUser(user);

		await this.authService.deleteToken(token);
		return 'password has been updated';
	}
}

export default AuthController;
