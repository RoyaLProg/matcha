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
import ChatController from './chat/chat.controller';
import { join } from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';
import ChatGateway from './chat/chat.gateway';


@Module({
	imports: [
		MailerModule.forRoot({
			transport: `smtps://${process.env.EMAIL_USER}:${process.env.EMAIL_PASSWORD}@smtp.gmail.com`,
			defaults: {
				from: '"matcha noreply" <matcha.noreply@matcha.com>',
			},
		}),
		JwtModule,
		ServeStaticModule.forRoot({
			rootPath: join(__dirname, '..', 'uploads'), // 📂 Dossier à servir
			serveRoot: '/upload', // 🔗 URL accessible
		  }),
	],
  controllers: [UserController, AuthController, UploadController, ActionController, ChatController],
  providers: [SocketsService,
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
			  Database]
})
export class AppModule {}
