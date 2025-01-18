import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import Settings from "./settings.entity";

export enum UserStatus {
	Offline = 'offline',
	Online = 'online'
}

@Entity()
class Users {
	@PrimaryGeneratedColumn()
	id?: number;

	@Column({ type: 'varchar', length: 255 })
	fistName: string;

	@Column({ type: 'varchar', length: 255 })
	lastName: string;

	@Column({ type: 'varchar', length: 255, unique: true})
	email: string;

	@Column({ type: 'date' })
	birthDate: Date;

	@Column({ type: 'varchar', length: 255, unique: true })
	username: string;

	@Column({ type: 'varchar', length: 500 })
	password: string;

	@Column({ type: 'enum', enum: UserStatus, default: UserStatus.Offline })
	status?: UserStatus;

	@Column({ type: 'boolean', default: false })
	isValidated: boolean;

	@OneToOne(() => Settings, (settings) => settings.user, { cascade: true })
	settings?: Settings;
}

export default Users;
