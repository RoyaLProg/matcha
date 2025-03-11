import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Request } from "express";
import { Observable } from "rxjs";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export default class UserGuard implements CanActivate {
	constructor(
		private readonly jwtService: JwtService,
	){}

	validateRequest(request: Request): boolean {
		const jwt = request.cookies['auth'];
		
		try {
			const jwtDecoded = this.jwtService.verify(jwt, {secret: process.env.JWT_SECRET});
			const path = request.originalUrl.split('/');
			const id = Number(path[path.length - 1]);

			if (!id)
				return true;

			if (id !== jwtDecoded['id'])
				return false;
		} catch (e) {
			return false;
		}
		return true
	}
	
	canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
		const request = context.switchToHttp().getRequest();
		return this.validateRequest(request);
	}
}
