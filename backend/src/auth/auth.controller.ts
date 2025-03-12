import { Controller, Get, Post, Body, Patch, Param, Delete, Res, BadRequestException, NotFoundException, UnauthorizedException, UseGuards } from '@nestjs/common';
import Users from 'src/interface/users.interface';
import AuthService from './auth.service';
import { sha256 } from 'js-sha256';
import { MailerService } from '@nestjs-modules/mailer';
import UserService from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { TokenType } from 'src/interface/auth.interface';
import AuthGuard from './auth.guard';

type MyOmit<T, K extends PropertyKey> =
    { [P in keyof T as Exclude<P, K>]: T[P] }

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
		if (! value || !value.length)
			return 'you must provide a password';
		if (value.length < 8 || value.length > 255)
			return ('password must be between 8 and 255 charaters long');

		const i1 = new RegExp(/[_\-\*@!]/).test(value);
		const i2 = new RegExp(/[0-9]/).test(value);
		const i3 = new RegExp(/[a-z]/).test(value);
		const i4 = new RegExp(/[A-Z]/).test(value);

		if (!i1)
			return ('password must contain at least a special charater (_-*@!)');
		if (!i2)
			return ('password must contain at least a number');
		if (!i3)
			return ('password must contain at least a lowercase charater');
		if (!i4)
			return ('password must contain at least a uppercase charater');
		return null;
	}

	checkUsername(value: string) {
		if (! value || !value.length )
			return 'you must provided a username';
		if (! new RegExp(/^[A-Za-z0-9_-]+$/i).test(value))
			return ('username contains illegal charaters');
		if (value.length < 5 || value.length > 16)
			return ('username must be between 5 and 16 charaters long')
		return null;
	}

	checkEmail(value: string) {
		if (!value || !value.length)
			return ('you must provide an email');
		if (! new RegExp(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/).test(value) )
			return ('not a valid email');
		if (value.length > 255)
			return ('email is too long');
		return null;
	}

	checkBirthDate(value: string): string | null {
		if (!value || !value.length)
			return 'you must provide your birthday'

		let x = new Date(new Date().getTime() - new Date(value).getTime()).getTime() / (31556952000); // time in a year

		if( x < 18)
			return 'you must be at least 18 years old to register'
		if ( x > 80)
			return `really ? You are telling me you are ${Math.floor(x)} years old?`
		return null;
	}

	checkFirstName(value: string) {
		if (!value || !value.length)
			return ('you must provide a firstName');
		if (! new RegExp(/[a-zA-Z\-]|[space]/i).test(value))
			return ('first name contain illegal charaters');
		if (value.length > 255)
			return ('first name is too long');
		return null;
	}

	checkLastName(value: string) {
		if (!value || !value.length)
			return ('you must provide a lastName');
		if (! new RegExp(/[a-zA-Z\-]|[space]/i).test(value))
			return ('last name contain illegal charaters');
		if (value.length > 255)
			return ('last name is too long');
		return null;
	}

	checkRegister(user: Users) {
		let error: Object = {};
		let x = this.checkPassword(user.password);
		if (x)
			error['password'] = x;
		x = this.checkUsername(user.username);
		if (x)
			error['username'] = x;
		x = this.checkEmail(user.email);
		if (x)
			error['email'] = x;
		x = this.checkBirthDate(user.birthDate);
		if (x)
			error['birthDate'] = x;
		x = this.checkLastName(user.lastName);
		if (x)
			error['lastName'] = x;
		x = this.checkFirstName(user.firstName);
		if (x)
			error['firstName'] = x;
		if (Object.keys(error).length === 0)
			return null;
		return error;
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
			isValidated: false,
		}

		const errors = this.checkRegister(user);
		if (errors)
			throw new BadRequestException(errors);

		const hash = sha256.create();
		user.password = hash.update(user.password).hex();
		let result: Users;

		try {
			result =  await this.authService.addUser(user);
		} catch (e) {
			throw new BadRequestException({other: 'email or user already exist'});
		}
		try {
			const token = await this.authService.create_token(result);
			const message = `Welcome to Matcha the latte

							Can you please click this <a href="http://localhost:5173/verify/${token.token}">link</a> to confirm your email`;
			await this.mailService.sendMail({
				to: user.email,
				html: message,
				subject: "Matcha The Latte - Email Verification"
			});
		} catch (e) {
			throw new BadRequestException({other: 'could not send email'});
		}

		return res.status(201).send({ message: 'account has been created, please confirm you email !' });
	}

	@Delete('verify/:token')
	async verify(@Param('token') token: string, @Res() res: Response) {
		if (! token.length)
			throw new BadRequestException('token is empty');

		const Authtoken = await this.authService.getToken(token) as Object;
		if (!Authtoken)
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
			if (this.checkUsername(body.username))
				throw new UnauthorizedException('username or password incorrect');
			const user: Users | null = await this.authService.getLogin(body.username, password);
			if (!user)
				throw new UnauthorizedException('username or password incorrect');
			if (!user.isValidated)
				throw new UnauthorizedException('you need to verify your email first');
			const payload = { id: user.id };
			const jwt: string = this.jwtService.sign(payload, {secret: process.env.JWT_SECRET});
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
			}
		}
		return res.status(200).send({ message: 'if the user exists, an email has been sent' });
	}

	@Patch('forgot/:token')
	async changePassword(@Param('token') token: string, @Body() body, @Res() res: Response) {
		if (! token.length)
			throw new BadRequestException('token is empty');

		const Authtoken = await this.authService.getToken(token);
		if (!Authtoken)
			throw new BadRequestException('token is invalid');
		if (Authtoken.type !== TokenType.PASS_RESET)
			throw new BadRequestException('token is invalid');
		if (!this.checkPassword(body.password))
			throw new BadRequestException('password does not comply with requirements');

		let user = Authtoken['users'];
		user.birthDate = new Date(user.birthDate).toISOString().slice(0,10);

		const hash = sha256.create();
		user.password = hash.update(body.password).hex();
		this.authService.updateUser(user);

		await this.authService.deleteToken(token);
		return res.status(200).send({ message: 'password has been updated' });
	}

	@Get('test')
	@UseGuards(AuthGuard)
	async test2() {
		return 'i am guarded';
	}
}

export default AuthController;
