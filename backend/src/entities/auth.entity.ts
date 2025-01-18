import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import Users from "./users.entity";

export enum TokenType {
	PASS_RESET = 'password',
	CREATE = 'create',
}

@Entity()
class Auth {
	@PrimaryGeneratedColumn()
	id?: number;

	@ManyToOne(() => Users, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'userId' })
	user: Users;

	@Column({ type: 'text' })
	token: string;

	@Column({ type: 'enum', enum: TokenType, default: TokenType.CREATE })
	type: TokenType;

	@Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
	createdAt?: Date;
}

export default Auth;
