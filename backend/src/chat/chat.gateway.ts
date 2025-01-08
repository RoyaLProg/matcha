import { Logger } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SocketsService } from 'src/sockets.service';

@WebSocketGateway()
class ChatGateway {
	@WebSocketServer()
	server: Server;
	private logger: Logger = new Logger('ChatGateway');

	constructor(private socketsService: SocketsService) {}


	@SubscribeMessage(`JoinRoom`)
	handleJoinRoom(client: Socket, room: string) {
		client.rooms.forEach((room) => {
			client.leave(room);
		});
		client.join(room);
		this.logger.log(`Client ${client.id} joining room ${room}`);
	}

	emitMessage(chatId: number, message: any): void {
		const room = `chat_${chatId}`;
		this.server.to(room).emit('receiveMessage', message);
		this.logger.log(`Message émis à la room ${room}: ${JSON.stringify(message)}`);
	  }

	@SubscribeMessage(`LeaveRoom`)
	handleLeaveRoom(client: Socket, room: string) {
		if (client.rooms.has(room)) {
			client.leave(room);
			this.logger.log(`Client ${client.id} leaving room ${room}`);
		} else {
			this.logger.error(`Client ${client.id} is not in room ${room}`);
		}
	}
}

export default ChatGateway;