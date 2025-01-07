import { Controller, Get, Body, Param, Delete, Patch, HttpException, HttpStatus } from '@nestjs/common';
import { Users } from 'src/entities/users.entity';
import UserService from './user.service';

@Controller('users')
class UserController {
	constructor(private readonly userService: UserService) { }

	@Get()
	getAllUsers() : Promise<Users[]>{
		try {
			return this.userService.findAll();
		} catch (error) {
			throw new HttpException(
				'Failed to retrieve users',
				HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	@Get(':id')
	getUser(@Param('id') id: number) : Promise<Users> {
		try {
			return this.userService.findOne(id);
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