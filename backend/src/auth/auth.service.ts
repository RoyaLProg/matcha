import { Injectable } from '@nestjs/common';

@Injectable()
class AuthService {
  getHello(): string {
	return 'Hello World!';
  }
}

export default AuthService;