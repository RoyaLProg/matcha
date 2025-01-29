import { Module } from '@nestjs/common';
import { SocketsService } from './sockets.service';
import { AppGateway } from './app.gateway';
import UserController from './user/user.controller';
import UserService from './user/user.service';
import AuthController from './auth/auth.controller';
import AuthService from './auth/auth.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { JwtModule } from '@nestjs/jwt';
import { Database } from './database/Database';
import SettingsService from './user/settings.service';
import UploadController from './upload/upload.controller';
import { UploadService } from './upload/upload.service';
import ActionController from './action/action.controller';
import ActionService from './action/action.service';
import MatchService from './action/match.service';
import ChatService from './chat/chat.service';

@Module({
	imports: [
		MailerModule.forRoot({
			transport: `smtps://${process.env.EMAIL_USER}:${process.env.EMAIL_PASSWORD}@smtp.gmail.com`,
			defaults: {
				from: '"matcha noreply" <matcha.noreply@matcha.com>',
			},
		}),
		JwtModule
	],
  controllers: [UserController, AuthController, UploadController, ActionController],
  providers: [SocketsService,
			  UserService,
			  AuthService,
			  SettingsService,
			  UploadService,
			  ActionService,
			  MatchService,
			  ChatService,
			  AppGateway,
			  AuthService,
			  Database]
})
export class AppModule {}
