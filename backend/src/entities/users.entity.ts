import { BeforeInsert, BeforeUpdate, Column, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import TagsEntity from "./tags.entity";
import Picture from "./picture.entity";

export enum UserGender {
	Man = 'man',
	Women = 'woman',
	Other = 'other',
	Undefined = 'undefined'
}

export enum UserSexualOrientation {
	Heterosexual = 'heterosexual',
	Bisexual = 'bisexual',
	Homosexual = 'homosexual',
	Undefined = 'undefined'
}

export enum UserStatus {
	Offline = "offline",
	Online = "online"
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

	@Column({ type: 'varchar', default: "" })
	biography?: string;

	@OneToMany(() => Picture, (picture) => picture.user, { cascade: true })
	pictures?: Picture[];

	@ManyToMany(() => TagsEntity)
	@JoinTable()
	tags?: TagsEntity[];

	@Column({ type: 'enum', enum: UserGender })
	gender: UserGender;

	@Column({ type: 'enum', enum: UserSexualOrientation })
	sexualOrientation: UserSexualOrientation;

	@Column({ type: 'varchar', length: 255, default: "" })
	city?: string;

	@Column({ type: 'varchar', length: 255, default: "" })
	country?: string;

	@Column({ type: 'boolean', default: false })
	isValidated: boolean;

}

export default Users;
