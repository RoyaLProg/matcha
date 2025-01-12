import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.use(cookieParser());
	app.enableCors({
        origin: 'http://localhost:5173', // Remplacez par le domaine du frontend
        credentials: true, // Autoriser les cookies
    });
	app.setGlobalPrefix("api");
	await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
