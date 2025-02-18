export const TagCategory = {
	Interests: "Interests",
	Sports: "Sports",
	Lifestyle: "Lifestyle",
	Gastronomy: "Gastronomy",
	Culture: "Culture",
	Technology: "Technology",
	Personality: "Personality",
} as const;

export const Tags: Record<keyof typeof TagCategory, string[]> = {
	[TagCategory.Interests]: [
		"Cinema",
		"Series TV",
		"Netflix",
		"Youtube",
		"Books",
		"Podcasts",
		"Music",
		"Video Games",
		"Travel",
		"Photography",
	],
	[TagCategory.Sports]: [
		"Football",
		"Basketball",
		"Swimming",
		"Tennis",
		"Yoga",
		"Running",
		"Cycling",
		"Hiking",
		"Climbing",
	],
	[TagCategory.Lifestyle]: [
		"DIY",
		"Meditation",
		"Gardening",
		"Volunteering",
		"Gaming",
		"Writing",
	],
	[TagCategory.Gastronomy]: [
		"Vegetarian",
		"Vegan",
		"Street Food",
		"Sushi",
		"Pastry",
		"Wine",
		"Barbecue",
	],
	[TagCategory.Culture]: [
		"Fantasy",
		"Documentaries",
		"Anime",
		"History",
		"Mythology",
	],
	[TagCategory.Technology]: [
		"Startups",
		"Cryptocurrencies",
		"AI",
		"Robotics",
		"Programming",
	],
	[TagCategory.Personality]: [
		"Adventurous",
		"Introvert",
		"Extrovert",
		"Minimalist",
		"Ambitious",
		"Creative",
	],
};

export default function getTags() {
	return Tags;
}
