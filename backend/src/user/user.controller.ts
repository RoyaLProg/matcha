import { Controller, Get, Body, Param, Delete, Patch, HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import Users from 'src/interface/users.interface';
import UserService from './user.service';
import AuthGuard from 'src/auth/auth.guard';
import UserGuard from './user.guard';

@Controller('Users')
class UserController {
	constructor(private readonly userService: UserService) { }

	@Get()
	getAllUsers() : Promise<Users[]>{
		try {
			return this.userService.findAll();
		} catch (error) {
			throw new HttpException(
				'Failed to retrieve Users',
				HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	@Get(':id')
	async getUser(@Param('id') id: number) : Promise<Users> {
		try {
			const user = await this.userService.findOne(id);
			delete user.settings
			delete user.password
			delete user.email
			return user;
		} catch (error) {
			if (error.message === 'User not found') {
				throw new HttpException(error.message, HttpStatus.NOT_FOUND);
		}
			throw new HttpException(
				'Failed to retrieve user',
				HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	@Patch(':id')
	@UseGuards(AuthGuard, UserGuard)
	updateUser(@Param('id') id: number, @Body() data: Partial<Users>) : Promise<Users> {
		try {
			return this.userService.update(id, data);
		} catch (error) {
			if (error.message === 'User not found') {
 				throw new HttpException(error.message, HttpStatus.NOT_FOUND);
			}
			throw new HttpException(
				'Failed to update user',
				HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	@Delete(':id')
	@UseGuards(AuthGuard, UserGuard)
	deleteUser(@Param('id') id: number) : Promise<void> {
		try {
			return this.userService.remove(id);
		} catch (error) {
			if (error.message === 'User not found') {
				throw new HttpException(error.message, HttpStatus.NOT_FOUND);
			}
			throw new HttpException(
				'Failed to delete user',
				HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}
}

export default UserController;
