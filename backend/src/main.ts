import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import * as bodyParser from 'body-parser';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.use(cookieParser());
	app.use(bodyParser.json({ limit: '50mb' }));
	app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }))

	app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
		res.setHeader('X-Content-Type-Options', 'nosniff');
		res.setHeader('X-Frame-Options', 'DENY');
		res.setHeader('Referrer-Policy', 'no-referrer');
		res.setHeader('X-XSS-Protection', '0');
		const csp = [
			"default-src 'self'",
			"script-src 'self' 'unsafe-inline'",
			"style-src 'self' 'unsafe-inline'",
			"img-src 'self' data:",
			"connect-src 'self'",
			"media-src 'self'",
			"font-src 'self' data:",
			"object-src 'none'",
			"base-uri 'self'",
			"frame-ancestors 'none'",
		].join('; ');
		res.setHeader('Content-Security-Policy', csp);
		next();
	});
	app.enableCors({
		origin: `${process.env.URL}`,
		credentials: true,
		methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
		allowedHeaders: 'Content-Type, Authorization',
	});
	app.useGlobalPipes(new ValidationPipe());
	app.setGlobalPrefix("api");
	await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
