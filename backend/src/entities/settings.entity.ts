import { Column, Entity, PrimaryGeneratedColumn, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import Users from './users.entity';
import Picture from './picture.entity';
import TagsEntity from './tags.entity';

export enum UserGender {
	Man = 'man',
	Woman = 'woman',
	Other = 'other',
	Undefined = 'undefined',
}

export enum UserSexualOrientation {
	Heterosexual = 'heterosexual',
	Bisexual = 'bisexual',
	Homosexual = 'homosexual',
	Undefined = 'undefined',
}

@Entity()
class Settings {
	@PrimaryGeneratedColumn()
	id: number;

	@OneToOne(() => Users, (user) => user.settings, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'userId' })
	user: Users;

	// Localisation
	@Column({ type: 'varchar', length: 255, default: '' })
	country: string;

	@Column({ type: 'varchar', length: 255, default: '' })
	city: string;

	@Column({ type: 'float', nullable: true })
	latitude?: number;

	@Column({ type: 'float', nullable: true })
	longitude?: number;

	@Column({ type: 'float', default: 50 })
	maxDistance: number;

	@Column({ type: 'boolean', default: false })
	geoloc: boolean;

	// Préférences d'âge
	@Column({ type: 'int', default: 18 })
	minAgePreference: number;

	@Column({ type: 'int', default: 100 })
	maxAgePreference: number;

	// Informations utilisateur
	@Column({ type: 'varchar', default: '' })
	biography: string;

	@Column({ type: 'enum', enum: UserGender })
	gender: UserGender;

	@Column({ type: 'enum', enum: UserSexualOrientation })
	sexualOrientation: UserSexualOrientation;

	// Relations
	@OneToMany(() => Picture, (picture) => picture.settings, { cascade: true })
	pictures: Picture[];

	@OneToMany(() => TagsEntity, (tag) => tag.settings, { cascade: true })
	tags: TagsEntity[];
}

export default Settings;
