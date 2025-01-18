import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from "typeorm";
import Users from "./users.entity";

export enum ActionStatus {
	Like = 'like',
	Dislike = 'dislike',
}

@Entity()
class Action {
	@PrimaryGeneratedColumn()
	id: number;

	@ManyToOne(() => Users, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'userId' })
	user: Users;

	@ManyToOne(() => Users, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'targetUserId' })
	targetUser: Users;

	@Column({ type: 'enum', enum: ActionStatus })
	status: ActionStatus;
}

export default Action;
