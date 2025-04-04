import { Logger } from '@nestjs/common';
import {
	WebSocketGateway,
	OnGatewayConnection,
	WebSocketServer,
	OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';
import { SocketsService } from './sockets.service';
import Users, { UserStatus } from './interface/users.interface';
import { Database } from './database/Database';
import * as cookie from 'cookie';

@WebSocketGateway({
	cors: {
	  origin: '*', // Permet toutes les origines (évite les blocages CORS)
	  methods: ["GET", "POST"], // Autorise ces méthodes
	  allowedHeaders: ["Authorization", "Content-Type"], // Autorise les headers
	  credentials: true, // Si tu envoies des cookies/tokens
	},
  })

export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
	constructor(
		private database: Database,
		private socketService: SocketsService
	)
	{ }

	@WebSocketServer() server : Server;
	private logger = new Logger('AppGateway');

	handleConnection(socket: Socket) {
		const request = socket.handshake;
		const cookies = cookie.parse(request.headers.cookie || '');
		const token = cookies['Auth'];
		if (token) {
			jwt.verify(token, process.env.JWT_SECRET, (err, decoded: jwt.JwtPayload) => {
				if (err) {
					this.logger.error('Unauthorized connection');
					socket.disconnect();
				} else {
					if (this. saveUserIdSocket(decoded.id, socket))
						this.logger.log(`Client connected: ${socket.id}`);
				}
			});
		} else {
			this.logger.error('Unauthorized connection');
			socket.disconnect();
		}
		this.server.emit('message', 'Hello World!');
	}

	async handleDisconnect(socket: Socket) {
		this.logger.log(`Client disconnected: ${socket.id}`);
		const user = this.socketService.removeSocket(socket);
		if (user) {
			const userId = parseInt(user.userId);
			const foundUser = await this.database.getFirstRow('users', [], { id: userId });
			if (foundUser) {
				await this.database.updateRows( 'users', { status: UserStatus.Offline, "lastconnection": new Date().toISOString() }, { id: userId } );
			}
		}
	}

	async saveUserIdSocket(userId: string, socket: Socket) {
		if (userId && userId !== 'undefined') {
			this.socketService.addSocket(socket, userId);
			const foundUser = await this.database.getFirstRow('users', [], { id: parseInt(userId) });
			if (foundUser) {
				await this.database.updateRows( 'users', { status: UserStatus.Online }, { id: parseInt(userId) } );
			}
			return true;
		}
		return false;
	}
}
