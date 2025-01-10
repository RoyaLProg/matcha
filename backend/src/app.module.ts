import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SocketsService } from './sockets.service';
import { AppGateway } from './app.gateway';
import UserController from './user/user.controller';
import UserService from './user/user.service';
import AuthController from './auth/auth.controller';
import AuthService from './auth/auth.service';
import Users from './entities/users.entity';
import { MailerModule } from '@nestjs-modules/mailer';
import Auth from './entities/auth.entity';
import Chat from './entities/chat.entity';
import Message from './entities/message.entity';
import History from './entities/history.entity';
import { Action } from './entities/action.entity';
import { JwtModule } from '@nestjs/jwt';

@Module({
	imports: [
		TypeOrmModule.forRoot({
		 	type: 'postgres' as any,
			host: 'database',
			port: 5432,
			username: process.env.POSTGRES_USER,
			password: process.env.POSTGRES_PASSWORD,
			database: process.env.POSTGRES_DB,
			entities: [Users, Chat, Message, Auth, History, Action],
			synchronize: true,
		}),
		TypeOrmModule.forFeature([Users, Chat, Message, Auth, History, Action]),
		MailerModule.forRoot({
			transport: `smtps://${process.env.EMAIL_USER}:${process.env.EMAIL_PASSWORD}@smtp.gmail.com`,
			defaults: {
				from: '"matcha noreply" <matcha.noreply@matcha.com>',
			},
		JwtModule
	],
  controllers: [UserController, AuthController],
  providers: [SocketsService,
			  UserService,
			  AppGateway,
			  AuthService]
})
export class AppModule {}
