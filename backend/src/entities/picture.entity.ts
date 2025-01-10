import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import Users from "./users.entity";

@Entity()
class Picture {
	@PrimaryGeneratedColumn()
	id?: number;

	@Column({ type: 'varchar', length: 255 })
	url: string;

	@ManyToOne(() => Users, (user) => user.pictures, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'userId' })
	user: Users;

	@Column({type: 'boolean', default: false})
	isProfile?: boolean;
}

export default Picture;