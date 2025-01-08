import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import Users from "./users.entity";
import Chat from "./chat.entity";

@Entity()
class Message {
	@PrimaryGeneratedColumn()
	id: number;

	@ManyToOne(() => Chat, (chat) => chat.messages, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'chatId' })
	chat: Chat;

	@ManyToOne(() => Users, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'userId' })
	sender: Users;

	@Column({ type: 'text' })
	message: string;

	@Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
	createdAt: Date;
}

export default Message;