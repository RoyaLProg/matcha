import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SocketsService } from './sockets.service';
import { AppGateway } from './app.gateway';
import UserController from './user/user.controller';
import UserService from './user/user.service';
import AuthController from './auth/auth.controller';
import AuthService from './auth/auth.service';
import Users from './entities/users.entity';

@Module({
	imports: [TypeOrmModule.forRoot({
		type: 'postgres' as any,
		host: 'database',
		port: 5432,
		username: process.env.POSTGRES_USER,
		password: process.env.POSTGRES_PASSWORD,
		database: process.env.POSTGRES_DB,
		entities: [Users],
		synchronize: true,
	}),
	TypeOrmModule.forFeature([Users])
	],
  controllers: [UserController, AuthController],
  providers: [SocketsService,
			  UserService,
			  AppGateway,
			  AuthService]
})
export class AppModule {}
