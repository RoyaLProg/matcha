import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import Users from "./users.entity";

@Entity()
class Auth {
	@PrimaryGeneratedColumn()
	id: number;

	@ManyToOne(() => Users, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'userId' })
	user: Users;

	@Column({ type: 'text' })
	token: string;

	@Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
	createdAt: Date;
}

export default Auth;
