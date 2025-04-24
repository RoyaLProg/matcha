import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import Settings from './settings.interface';

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
	Fantasy = 'fantasy',
	Documentaries = 'documentaries',
	Anime = 'anime',
	History = 'history',
	Mythology = 'mythology',

	// Technology
	Startups = 'startups',
	Cryptocurrencies = 'cryptocurrencies',
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

interface Tag {
	id?: number;
	category: TagCategory;
	tag: Tags;
	settings?: Settings;
}

export default Tag;
