import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
	imports: [TypeOrmModule.forRoot({
		type: 'postgres' as any,
		host: 'localhost',
		port: 5432,
		username: process.env.POSTGRES_USER,
		password: process.env.POSTGRES_PASSWORD,
		database: process.env.POSTGRES_DB,
		entities: [__dirname + '/**/*.entity{.ts,.js}'],
		synchronize: true,
	})],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
