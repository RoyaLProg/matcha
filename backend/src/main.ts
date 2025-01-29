import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import * as bodyParser from 'body-parser';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.use(cookieParser());
	app.use(bodyParser.json({ limit: '50mb' }));
	app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }))
	app.enableCors({
		origin: 'http://localhost:5173',
		credentials: true,
		methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
		allowedHeaders: 'Content-Type, Authorization',
	});
	app.useGlobalPipes(new ValidationPipe());
	app.setGlobalPrefix("api");
	await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
