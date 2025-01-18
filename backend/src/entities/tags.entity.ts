import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import Settings from './settings.entity';

export enum TagCategory {
	Interests = 'interests',
	Sports = 'sports',
	Lifestyle = 'lifestyle',
	Gastronomy = 'gastronomy',
	Culture = 'culture',
	Technology = 'technology',
	Personality = 'personality',
}

export enum Tags {
	// Interests
	Cinema = 'cinema',
	SeriesTV = 'series_tv',
	Netflix = 'netflix',
	YouTube = 'youtube',
	Books = 'books',
	Podcasts = 'podcasts',
	Music = 'music',
	VideoGames = 'video_games',
	Travel = 'travel',
	Photography = 'photography',

	// Sports
	Football = 'football',
	Basketball = 'basketball',
	Swimming = 'swimming',
	Tennis = 'tennis',
	Yoga = 'yoga',
	Running = 'running',
	Cycling = 'cycling',
	Hiking = 'hiking',
	Climbing = 'climbing',

	// Lifestyle
	DIY = 'diy',
	Meditation = 'meditation',
	Gardening = 'gardening',
	Volunteering = 'volunteering',
	Gaming = 'gaming',
	Writing = 'writing',

	// Gastronomy
	Vegetarian = 'vegetarian',
	Vegan = 'vegan',
	StreetFood = 'street_food',
	Sushi = 'sushi',
	Pastry = 'pastry',
	Wine = 'wine',
	Barbecue = 'barbecue',

	// Culture
	SciFi = 'sci_fi',
	Fantasy = 'fantasy',
	Documentaries = 'documentaries',
	Anime = 'anime',
	History = 'history',
	Mythology = 'mythology',

	// Technology
	Startups = 'startups',
	Cryptocurrencies = 'cryptocurrencies',
	AI = 'ai',
	Robotics = 'robotics',
	Programming = 'programming',

	// Personality
	Adventurous = 'adventurous',
	Introvert = 'introvert',
	Extrovert = 'extrovert',
	Minimalist = 'minimalist',
	Ambitious = 'ambitious',
	Creative = 'creative',
}

@Entity()
class TagsEntity {
	@PrimaryGeneratedColumn()
	id?: number;

	@Column({ type: 'enum', enum: TagCategory })
	category: TagCategory;

	@Column({ type: 'enum', enum: Tags })
	tag: Tags;

	@ManyToOne(() => Settings, (settings) => settings.tags, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'settingsId' })
	settings: Settings;
}

export default TagsEntity;
