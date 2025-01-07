import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

enum UserGender {
	Man = 'man',
	Women = 'woman',
	Other = 'other'
}

enum UserSexualOrientation {
	Heterosexual = 'heterosexual',
	bisexual = 'bisexual',
	homosexual = 'homosexual'
}

enum UserStatus {
	Online = 'online',
	Offline = 'offline'
}

@Entity()
class Users {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: 'varchar', length: 255 })
	fistName: string;

	@Column({ type: 'varchar', length: 255 })
	lastName: string;

	@Column({ type: 'varchar', length: 255 })
	email: string;

	@Column({ type: 'date' })
	birthDate: Date;

	@Column({ type: 'varchar', length: 255 })
	username: string;

	@Column({ type: 'varchar', length: 500 })
	password: string;

	@Column({ type: 'enum', enum: UserStatus, default: UserStatus.Offline })
	status: UserStatus;

	@Column({ type: 'varchar' })
	biography: string;

	@Column("text", { array: true })
	pictures: string[];

	@Column("text", { array: true })
	tags: string[];

	@Column({ type: 'enum', enum: UserGender })
	gender: UserGender;

	@Column({ type: 'enum', enum: UserSexualOrientation })
	sexualOrientation: UserSexualOrientation;

	@Column({ type: 'varchar', length: 255 })
	city: string;

	@Column({ type: 'varchar', length: 255 })
	country: string;

	@Column({ type: 'boolean', default: false })
	isValidated: boolean;
}

export { Users, UserGender, UserSexualOrientation, UserStatus };