import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import Settings from './settings.entity';

@Entity()
class Picture {
	@PrimaryGeneratedColumn()
	id?: number;

	@Column({ type: 'varchar', length: 255 })
	url: string;

	@ManyToOne(() => Settings, (settings) => settings.pictures, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'settingsId' })
	settings: Settings;

	@Column({ type: 'boolean', default: false })
	isProfile?: boolean;
}

export default Picture;
