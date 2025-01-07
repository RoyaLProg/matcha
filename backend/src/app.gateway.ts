import { Logger } from '@nestjs/common';
import {
	WebSocketGateway,
	OnGatewayConnection,
	WebSocketServer,
	OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { DataSource } from 'typeorm';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { SocketsService } from './sockets.service';
import { Users, UserStatus } from './entities/users.entity';

@WebSocketGateway()
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
	constructor(
		private dataSources: DataSource,
		private SocketService: SocketsService
	)
	{ }

	@WebSocketServer() server : Server;
	private logger = new Logger('AppGateway');

	handleConnection(socket: Socket) {
		const request = socket.handshake;
		const token = request.headers.authorization;
		if (token) {
			jwt.verify(token, process.env.JWT_SECRET, (err, decoded: JwtPayload) => {
				if (err) {
					this.logger.error('Unauthorized connection');
					socket.disconnect();
				} else {

					if (this. saveUserIdSocket(decoded.sub, socket)) {
						this.logger.log(`Client connected: ${socket.id}`);
					}
				}
			});
		} else {
			this.logger.error('Unauthorized connection');
			socket.disconnect();
		}
		this.server.emit('message', 'Hello World!');
	}

	handleDisconnect(socket: Socket) {
		this.logger.log(`Client disconnected: ${socket.id}`);
		const user = this.SocketService.removeSocket(socket);
		if (user) {
			this.dataSources.manager.findOneBy(Users, {
				id: parseInt(user.userId),
			}).then((user) => {
				if (user) {
					user.status = UserStatus.Offline;
					this.dataSources.manager.save(user);
				}
			});
		}
	}

	async saveUserIdSocket(userId: string, socket: Socket) {
		if (userId && userId !== 'undefined') {
			this.SocketService.addSocket(socket, userId);
			let user = await this.dataSources.manager.findOneBy(Users, {
				id: parseInt(userId),
			});
			if (user) {
				user.status = UserStatus.Online;
				await this.dataSources.manager.save(user);
			}
			return true
		}
		return false;
	}
}