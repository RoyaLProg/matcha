import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SocketsService } from './sockets.service';
import { AppGateway } from './app.gateway';
import UserController from './user/user.controller';
import UserService from './user/user.service';

@Module({
	imports: [TypeOrmModule.forRoot({
		type: 'postgres' as any,
		host: 'database',
		port: 5432,
		username: process.env.POSTGRES_USER,
		password: process.env.POSTGRES_PASSWORD,
		database: process.env.POSTGRES_DB,
		entities: [__dirname + '/**/*.entity{.ts,.js}'],
		synchronize: true,
	})],
  controllers: [UserController],
  providers: [SocketsService,
			  UserService,
			  AppGateway],
})
export class AppModule {}
