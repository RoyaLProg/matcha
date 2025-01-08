import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import Users from "./users.entity";
import message from "./message.entity";
import Message from "./message.entity";

@Entity()
class Chat {

	@PrimaryGeneratedColumn()
	id: number;

	@ManyToOne(() => Users, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'userId' })
	user: Users;

	@ManyToOne(() => Users, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'targetUserId' })
	targetUser: Users;

	@OneToMany(() => Message, (message) => message.chat, { cascade: true })
	messages: Message[];

	@Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
	createdAt: Date;
}

export default Chat;
