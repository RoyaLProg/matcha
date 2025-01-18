import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import Users from "./users.entity";
import Chat from "./chat.entity";

export enum MessageType {
	Text = 'text',
	Audio = 'audio',
	Video = 'video',
}

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

	@Column({ type: 'enum', enum: MessageType, default: MessageType.Text })
	type?: MessageType;

	@Column({ type: 'text', nullable: true })
	content: string | null;

	@Column({ type: 'varchar', length: 255, nullable: true })
	fileUrl: string | null;

	@Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
	createdAt?: Date;
}

export default Message;
