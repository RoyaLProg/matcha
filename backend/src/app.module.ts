import { Module } from '@nestjs/common';
import { SocketsService } from './sockets.service';
import { AppGateway } from './app.gateway';
import UserController from './user/user.controller';
import UserService from './user/user.service';
import AuthController from './auth/auth.controller';
import AuthService from './auth/auth.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';
import { JwtModule } from '@nestjs/jwt';
import { Database } from './database/Database';
import SettingsService from './user/settings.service';
import UploadController from './upload/upload.controller';
import { UploadService } from './upload/upload.service';
import ActionController from './action/action.controller';
import ActionService from './action/action.service';
import MatchService from './action/match.service';
import ChatService from './chat/chat.service';
import ChatController from './chat/chat.controller';
import ChatGateway from './chat/chat.gateway';
import HistoryService from './history/history.service';
import HistoryController from './history/history.controller';
import ReportController from './report/report.controller';
import ReportService from './report/report.service';
import EventController from './event/event.controller';
import EventService from './event/event.service';
import MailService from './mail/mail.service';
import { TwoFactorService } from './auth/twoFactor.service';

@Module({
	imports: [
		MailerModule.forRoot((() => {
			if (process.env.SMTP_HOST) {
				return {
					transport: {
						host: process.env.SMTP_HOST,
						port: Number(process.env.SMTP_PORT) || 1025,
						secure: false,
					},
					defaults: {
						from: '"matcha noreply" <noreply@matcha.local>',
					},
					template: {
						dir: join(process.cwd(), 'src', 'mail', 'templates'),
						adapter: new HandlebarsAdapter(),
						options: { strict: true },
					},
				};
			}
			return {
				transport: `smtps://${process.env.EMAIL_USER}:${process.env.EMAIL_PASSWORD}@smtp.gmail.com`,
				defaults: {
					from: '"matcha noreply" <matcha.noreply@matcha.com>',
				},
				template: {
					dir: join(process.cwd(), 'src', 'mail', 'templates'),
					adapter: new HandlebarsAdapter(),
					options: { strict: true },
				},
			};
		})()),
		JwtModule,
	],
  controllers: [
		UserController,
		AuthController,
		UploadController,
		ActionController,
		ChatController,
		HistoryController,
		ReportController,
		EventController
	],
  providers: [
		SocketsService,
		UserService,
		AuthService,
		SettingsService,
		UploadService,
		ActionService,
		MatchService,
		ChatService,
		ChatGateway,
		AppGateway,
		AuthService,
		Database,
		HistoryService,
		ReportService,
		EventService,
		MailService,
		TwoFactorService
	],

})
export class AppModule {}
