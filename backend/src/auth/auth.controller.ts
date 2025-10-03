import { Controller, Get, Post, Body, Patch, Param, Delete, Res, BadRequestException, NotFoundException, UnauthorizedException, UseGuards, Request } from '@nestjs/common';
import Users from 'src/interface/users.interface';
import AuthService from './auth.service';
import { Response } from 'express';
import MailService from 'src/mail/mail.service';
import UserService from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import { TokenType } from 'src/interface/auth.interface';
import AuthGuard from './auth.guard';
import { TwoFactorService } from './twoFactor.service';
import { Database } from 'src/database/Database';


@Controller("auth")
export class AuthController {

	constructor(
		private readonly authService: AuthService,
    private readonly mailService: MailService,
		private readonly userService: UserService,
		private readonly jwtService: JwtService,
		private readonly twoFactorService: TwoFactorService,
		private readonly database: Database
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

		const i1 = new RegExp(/[^A-Za-z0-9_\s]/).test(value);
		const i2 = new RegExp(/[0-9]/).test(value);
		const i3 = new RegExp(/[a-z]/).test(value);
		const i4 = new RegExp(/[A-Z]/).test(value);

		if (!i1)
			return ('password must contain at least one special character');
		if (!i2)
			return ('password must contain at least a number');
		if (!i3)
			return ('password must contain at least a lowercase charater');
		if (!i4)
			return ('password must contain at least a uppercase charater');

		const weakWords = [
			'password','qwerty','letmein','welcome','dragon','football','monkey','iloveyou','admin','login','princess','solo','starwars','sunshine','flower','shadow','superman','baseball','master','hello','freedom','whatever','qazwsx','trustno1','passw0rd','default','matcha'
		];
		const lower = value.toLowerCase();
		for (const w of weakWords) {
			if (lower === w || lower.includes(w))
				return ('password is too common');
		}
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

	checkbirthday(value: string): string | null {
		if (!value || !value.length)
			return 'you must provide your birthday'

		let x = new Date(new Date().getTime() - new Date(value).getTime()).getTime() / (31556952000);

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
		x = this.checkbirthday(user.birthday);
		if (x)
			error['birthday'] = x;
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
			birthday: new Date(body.birthday).toISOString().slice(0,10),
			email: body.email,
			isValidated: false,
		}

		const errors = this.checkRegister(user);
		if (errors)
			throw new BadRequestException(errors);

		user.password = await this.authService.hashPassword(user.password);
		let result: Users;

		try {
			result =  await this.authService.addUser(user);
		} catch (e) {
			throw new BadRequestException({other: 'email or user already exist'});
		}
        try {
            const token = await this.authService.create_token(result);
            const confirmUrl = `${process.env.URL}/confirm-email?token=${token.token}`;
            await this.mailService.sendEmailConfirmation(user.email, user.firstName, confirmUrl);
        } catch (e) {
            throw new BadRequestException({other: 'could not send email'});
        }

		return res.status(201).send({ message: 'account has been created, please confirm you email !' });
	}

  @Delete('verify/:token')
  async verify(@Param('token') token: string, @Res() res: Response) {
		if (! token.length)
			throw new BadRequestException('token is empty');

		const Authtoken = await this.authService.getToken(token) as any;
		if (!Authtoken)
			throw new BadRequestException('token is invalid');
		if (Authtoken['type'] !== TokenType.CREATE)
			throw new BadRequestException('token is invalid');
		const createdAt = new Date(Authtoken['createdAt'] ?? 0).getTime();
		if (!createdAt || Date.now() - createdAt > 60 * 60 * 1000)
			throw new BadRequestException('token expired');
		let user = Authtoken['users'];
		if (user.isValidated === true)
			throw new BadRequestException('user is already validated');

		user.birthday = new Date(user.birthday).toISOString().slice(0,10);
		user.isValidated = true;
		user.lastconnection = new Date().toISOString();
		this.authService.updateUser(user);
		await this.authService.deleteToken(token);
		return res.status(200).send({ message: 'email has been verified' });
	}

  @Post('login')
  async login(@Body() body, @Res({passthrough: true}) res: Response) {
			if (this.checkUsername(body.username))
				throw new UnauthorizedException('username or password incorrect');
			const user: Users | null = await this.authService.getLogin(body.username, body.password);
			if (!user)
				throw new UnauthorizedException('username or password incorrect');
			if (!user.isValidated)
				throw new UnauthorizedException('you need to verify your email first');

			// Check if 2FA is enabled
			const twoFactorEnabled = await this.twoFactorService.isTwoFactorEnabled(user.id!);
			if (twoFactorEnabled) {
				// Don't log in yet, require 2FA verification
				return res.status(200).send({
					message: 'Two-factor authentication required',
					requiresTwoFactor: true,
					username: body.username
				});
			}

			// Normal login without 2FA
			const payload = { id: user.id };
    const jwt: string = this.jwtService.sign(payload, {secret: process.env.JWT_SECRET, expiresIn: '7d'});
			const maxAge = 7 * 24 * 60 * 60 * 1000;
            res.cookie("Auth", jwt, {sameSite: 'lax', httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge, path: '/'});
            res.status(200).send({ message: 'Login successful!' });
  }

  @Post('2fa/verify-login')
  async verifyLogin(@Body() body, @Res({passthrough: true}) res: Response) {
    const { username, password, token, isBackupCode } = body;

    if (!username || !password || !token) {
      throw new BadRequestException('Missing required fields');
    }

    // First verify the user credentials again
    if (this.checkUsername(username))
      throw new UnauthorizedException('Invalid credentials');

    const user: Users | null = await this.authService.getLogin(username, password);
    if (!user)
      throw new UnauthorizedException('Invalid credentials');

    if (!user.isValidated)
      throw new UnauthorizedException('You need to verify your email first');

    // Verify 2FA is enabled
    const twoFactorEnabled = await this.twoFactorService.isTwoFactorEnabled(user.id!);
    if (!twoFactorEnabled) {
      throw new UnauthorizedException('Two-factor authentication is not enabled');
    }

    let isValidToken = false;

    if (isBackupCode) {
      // Verify backup code
      isValidToken = await this.twoFactorService.verifyBackupCode(user.id!, token);
      if (!isValidToken) {
        throw new UnauthorizedException('Invalid or expired backup code');
      }
    } else {
      // Verify TOTP token
      const secret = await this.twoFactorService.getUserSecret(user.id!);
      if (!secret) {
        throw new UnauthorizedException('Two-factor authentication is not properly configured');
      }

      isValidToken = this.twoFactorService.verifyToken(secret, token);
      if (!isValidToken) {
        throw new UnauthorizedException('Invalid authenticator code');
      }
    }

    // Login successful, create JWT
    const payload = { id: user.id };
    const jwt: string = this.jwtService.sign(payload, {secret: process.env.JWT_SECRET, expiresIn: '7d'});
    const maxAge = 7 * 24 * 60 * 60 * 1000;
    res.cookie("Auth", jwt, {sameSite: 'lax', httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge, path: '/'});
    res.status(200).send({ message: 'Login successful!' });
  }

	@Post('logout')
	async logout(@Res({ passthrough: true }) res: Response) {
		res.cookie('Auth', '', { sameSite: 'lax', httpOnly: true, secure: process.env.NODE_ENV === 'production', expires: new Date(0), path: '/' });
		return { message: 'Logged out' };
	}


	@Post('forgot')
	async forgot(@Body() body, @Res() res: Response) {
		if (!body.username)
			throw new BadRequestException('no username was provided');
		let user;
		try {
			user = await this.userService.findOneByUsername(body.username);
		} catch {
			throw new NotFoundException('user not found');
		}
		if (!user)
			throw new NotFoundException('user not found');
        if (user !== null) {
            try {
                const token = await this.authService.create_token(user, TokenType.PASS_RESET);
                const resetUrl = `${process.env.URL}/reset-password/${token.token}`;
                await this.mailService.sendPasswordReset(user.email, user.firstName, resetUrl);
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
		const createdAt = new Date((Authtoken as any)['createdAt'] ?? 0).getTime();
		if (!createdAt || Date.now() - createdAt > 60 * 60 * 1000)
			throw new BadRequestException('token expired');
		const passErr = this.checkPassword(body.password);
		if (passErr)
			throw new BadRequestException(passErr || 'password does not comply with requirements');

		let user = Authtoken['users'];
		user.birthday = new Date(user.birthday).toISOString().slice(0,10);

		user.password = await this.authService.hashPassword(body.password);
		this.authService.updateUser(user);

		await this.authService.deleteToken(token);
		return res.status(200).send({ message: 'password was successfully updated' });
	}

	@Patch('change-password')
	@UseGuards(AuthGuard)
	async changePasswordAuth(@Body() body, @Request() req, @Res() res: Response) {
		const { currentPassword, newPassword } = body;

		if (!currentPassword || !newPassword) {
			throw new BadRequestException('Current password and new password are required');
		}

		const user = await this.userService.findOne(req.user.id);
		if (!user) {
			throw new NotFoundException('User not found');
		}

		// Verify current password
		const passwordVerification = await this.authService.verifyPassword(currentPassword, user.password);
		if (!passwordVerification.valid) {
			throw new UnauthorizedException('Current password is incorrect');
		}

		// Validate new password
		const passErr = this.checkPassword(newPassword);
		if (passErr) {
			throw new BadRequestException(passErr);
		}

		// Update password
		user.password = await this.authService.hashPassword(newPassword);
		await this.authService.updateUser(user);

		return res.status(200).send({ message: 'Password has been updated successfully' });
	}

	@Get('2fa/setup')
	@UseGuards(AuthGuard)
	async setup2FA(@Request() req, @Res() res: Response) {
		try {
			const user = await this.userService.findOne(req.user.id);
			if (!user) {
				throw new NotFoundException('User not found');
			}

			// Check if 2FA is already enabled
			if (await this.twoFactorService.isTwoFactorEnabled(req.user.id)) {
				throw new BadRequestException('Two-factor authentication is already enabled');
			}

			// Generate secret and QR code
			const { secret, qrCodeUrl, manualEntryKey } = this.twoFactorService.generateSecret(user.username);
			const qrCodeDataUrl = await this.twoFactorService.generateQRCode(qrCodeUrl);

			// Store the secret temporarily (not enabled yet)
			await this.database.updateRows('users', { twoFactorSecret: secret }, { id: req.user.id });

			return res.status(200).json({
				qrCode: qrCodeDataUrl,
				manualEntryKey,
				secret
			});
		} catch (error) {
			throw new BadRequestException(error.message || 'Failed to setup 2FA');
		}
	}

	@Post('2fa/verify-setup')
	@UseGuards(AuthGuard)
	async verifyAndEnable2FA(@Request() req, @Body() body, @Res() res: Response) {
		try {
			const { token } = body;
			if (!token) {
				throw new BadRequestException('Token is required');
			}

			const secret = await this.twoFactorService.getUserSecret(req.user.id);
			if (!secret) {
				throw new BadRequestException('No 2FA setup found. Please setup 2FA first.');
			}

			// Verify the token
			const isValid = this.twoFactorService.verifyToken(secret, token);
			if (!isValid) {
				throw new BadRequestException('Invalid token');
			}

			// Enable 2FA and generate backup codes
			const backupCodes = await this.twoFactorService.enableTwoFactor(req.user.id, secret);

			return res.status(200).json({
				message: 'Two-factor authentication enabled successfully',
				backupCodes
			});
		} catch (error) {
			throw new BadRequestException(error.message || 'Failed to verify 2FA setup');
		}
	}

	@Delete('2fa/disable')
	@UseGuards(AuthGuard)
	async disable2FA(@Request() req, @Body() body, @Res() res: Response) {
		try {
			const { token } = body;
			if (!token) {
				throw new BadRequestException('Token is required to disable 2FA');
			}

			const secret = await this.twoFactorService.getUserSecret(req.user.id);
			if (!secret || !(await this.twoFactorService.isTwoFactorEnabled(req.user.id))) {
				throw new BadRequestException('Two-factor authentication is not enabled');
			}

			// Verify the token before disabling
			const isValid = this.twoFactorService.verifyToken(secret, token);
			if (!isValid) {
				throw new BadRequestException('Invalid token');
			}

			// Disable 2FA
			await this.twoFactorService.disableTwoFactor(req.user.id);

			return res.status(200).json({ message: 'Two-factor authentication disabled successfully' });
		} catch (error) {
			throw new BadRequestException(error.message || 'Failed to disable 2FA');
		}
	}

	@Post('2fa/verify')
	async verify2FA(@Body() body, @Res() res: Response) {
		try {
			const { username, token } = body;
			if (!username || !token) {
				throw new BadRequestException('Username and token are required');
			}

			const user = await this.userService.findOneByUsername(username);
			if (!user) {
				throw new UnauthorizedException('Invalid credentials');
			}

			const secret = await this.twoFactorService.getUserSecret(user.id!);
			if (!secret || !(await this.twoFactorService.isTwoFactorEnabled(user.id!))) {
				throw new BadRequestException('Two-factor authentication is not enabled for this user');
			}

			// Try to verify as TOTP token first
			let isValid = this.twoFactorService.verifyToken(secret, token);

			// If TOTP fails, try as backup code
			if (!isValid) {
				isValid = await this.twoFactorService.verifyBackupCode(user.id!, token);
			}

			if (!isValid) {
				throw new UnauthorizedException('Invalid token or backup code');
			}

			// Generate JWT token for successful 2FA verification
			const payload = { id: user.id };
			const jwt: string = this.jwtService.sign(payload, {secret: process.env.JWT_SECRET, expiresIn: '7d'});
			const maxAge = 7 * 24 * 60 * 60 * 1000;
			res.cookie("Auth", jwt, {sameSite: 'lax', httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge, path: '/'});

			return res.status(200).json({ message: '2FA verification successful' });
		} catch (error) {
			throw new BadRequestException(error.message || 'Failed to verify 2FA token');
		}
	}

	@Get('2fa/status')
	@UseGuards(AuthGuard)
	async get2FAStatus(@Request() req, @Res() res: Response) {
		try {
			const enabled = await this.twoFactorService.isTwoFactorEnabled(req.user.id);
			let backupCodesCount = 0;
			if (enabled) {
				const backupCodes = await this.twoFactorService.getBackupCodes(req.user.id);
				backupCodesCount = backupCodes.length;
			}
			return res.status(200).json({ enabled, backupCodesCount });
		} catch (error) {
			throw new BadRequestException('Failed to get 2FA status');
		}
	}

	@Get('2fa/backup-codes')
	@UseGuards(AuthGuard)
	async getBackupCodes(@Request() req, @Res() res: Response) {
		try {
			if (!(await this.twoFactorService.isTwoFactorEnabled(req.user.id))) {
				throw new BadRequestException('Two-factor authentication is not enabled');
			}

			const backupCodes = await this.twoFactorService.getBackupCodes(req.user.id);
			return res.status(200).json({ backupCodes });
		} catch (error) {
			throw new BadRequestException(error.message || 'Failed to get backup codes');
		}
	}

	@Post('2fa/regenerate-backup-codes')
	@UseGuards(AuthGuard)
	async regenerateBackupCodes(@Request() req, @Body() body, @Res() res: Response) {
		try {
			const { token } = body;
			if (!token) {
				throw new BadRequestException('2FA token is required to regenerate backup codes');
			}

			if (!(await this.twoFactorService.isTwoFactorEnabled(req.user.id))) {
				throw new BadRequestException('Two-factor authentication is not enabled');
			}

			const secret = await this.twoFactorService.getUserSecret(req.user.id);
			if (!secret) {
				throw new BadRequestException('2FA secret not found');
			}

			// Verify current 2FA token
			const isValid = this.twoFactorService.verifyToken(secret, token);
			if (!isValid) {
				throw new BadRequestException('Invalid 2FA token');
			}

			const newBackupCodes = await this.twoFactorService.regenerateBackupCodes(req.user.id);
			return res.status(200).json({
				message: 'Backup codes regenerated successfully',
				backupCodes: newBackupCodes
			});
		} catch (error) {
			throw new BadRequestException(error.message || 'Failed to regenerate backup codes');
		}
	}

	@Get('test')
	@UseGuards(AuthGuard)
	async test2() {
		return 'i am guarded';
	}
}

export default AuthController;
