import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Request } from "express";
import { Observable } from "rxjs";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export default class AuthGuard implements CanActivate {
	constructor(
		private readonly jwtService: JwtService,
	){}

	validateRequest(request: Request): boolean {
		const jwt = request.cookies['Auth'];
		//console.log(jwt);
		try {
			this.jwtService.verify(jwt, {secret: process.env.JWT_SECRET});
		} catch (e) {
			console.log(e);
			return false;
		}
		return true
	}
	
	canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
		const request = context.switchToHttp().getRequest();
		return this.validateRequest(request);
	}
}
