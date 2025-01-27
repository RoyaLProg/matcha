import { Controller, Get, Post, Body, Patch, Param, Delete, Res, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import Users from 'src/entities/users.interface';
import AuthService from './auth.service';
import { sha256 } from 'js-sha256';
import { MailerService } from '@nestjs-modules/mailer';
import UserService from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { TokenType } from 'src/entities/auth.interface';
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
	async register(@Body() body,@Res() res: Response) {
		const user: Users = {
			firstName: body.firstName,
			lastName: body.lastName,
			username: body.username,
			password: body.password,
			birthDate: new Date(body.birthDate).toISOString().slice(0,10),
			email: body.email,
			// sexualOrientation: UserSexualOrientation.Undefined,
			// gender: UserGender.Undefined,
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
			const myUser = await this.userService.findOneByUsername(user.username);
			const token = await this.authService.create_token(myUser);
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

		return res.status(201).send({ message: 'Acound created, please verify your email' });
	}

	@Delete('verify/:token')
	async verify(@Param('token') token: string, @Res() res: Response) {
		if (! token.length)
			throw new BadRequestException('token is empty');

		const Authtoken = await this.authService.getToken(token) as Object;
		if (Authtoken === null)
			throw new BadRequestException('token is invalid');
		if (Authtoken['type'] !== TokenType.CREATE)
			throw new BadRequestException('token is invalid');
		let user = Authtoken['users'];
		if (user.isValidated === true)
			throw new BadRequestException('user is already validated');

		user.birthDate = new Date(user.birthDate).toISOString().slice(0,10);
		user.isValidated = true;
		this.authService.updateUser(user);
		await this.authService.deleteToken(token);
		return res.status(200).send({ message: 'email has been verified' });
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
			res.cookie("Auth", jwt, {sameSite: 'lax', httpOnly: false, expires: eat, path: '/'});
			return res.status(200).send({ message: 'Login successful!' });
	}

	@Post('forgot')
	async forgot(@Body() body, @Res() res: Response) {
		if (!body.username)
			throw new BadRequestException('no username was provided');
		const user = await this.userService.findOneByUsername(body.username);
		if (!user)
			throw new NotFoundException('user not found');
		if (user !== null) {
			try {
				const token = await this.authService.create_token(user, TokenType.PASS_RESET);
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
		return res.status(200).send({ message: 'if the user exists, an email has been sent' });
	}

	@Patch('forgot/:token')
	async changePassword(@Param('token') token: string, @Body() body, @Res() res: Response) {
		if (! token.length)
			throw new BadRequestException('token is empty');

		const Authtoken = await this.authService.getToken(token);
		if (Authtoken === null)
			throw new BadRequestException('token is invalid');
		if (Authtoken.type !== TokenType.PASS_RESET)
			throw new BadRequestException('token is invalid');
		if (!this.checkPassword(body.password))
			throw new BadRequestException('password does not comply with requirements');

		let user = Authtoken['users'];

		const hash = sha256.create();
		user.password = hash.update(body.password).hex();
		this.authService.updateUser(user);

		await this.authService.deleteToken(token);
		return res.status(200).send({ message: 'password has been updated' });
	}

	@Get('test')
	async test2() {
		return await this.authService.test();
	}
}

export default AuthController;
