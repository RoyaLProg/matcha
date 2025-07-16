
import bcrypt
import random
from faker import Faker
import psycopg2
import os

DB_NAME = os.getenv("POSTGRES_DB")
DB_USER = os.getenv("POSTGRES_USER")
DB_PASSWORD = os.getenv("POSTGRES_PASSWORD")

# Configuration de la connexion à PostgreSQL
conn = psycopg2.connect(
    dbname=DB_NAME,
    user=DB_USER,
    password=DB_PASSWORD,
    host="database",
    port="5432"
)
cursor = conn.cursor()

fake = Faker("fr_FR")

# Listes pour les valeurs ENUM
genders = ['man', 'woman', 'other']
sexual_orientations = ['heterosexual', 'bisexual', 'homosexual']
tags_enum = [
    'cinema', 'series_tv', 'netflix', 'youtube', 'books', 'podcasts', 'music', 'video_games',
    'travel', 'photography', 'football', 'basketball', 'swimming', 'tennis', 'yoga', 'running',
    'cycling', 'hiking', 'climbing', 'diy', 'meditation', 'gardening', 'volunteering', 'gaming',
    'writing', 'vegetarian', 'vegan', 'street_food', 'sushi', 'pastry', 'wine', 'barbecue',
    'sci_fi', 'fantasy', 'documentaries', 'anime', 'history', 'mythology', 'startups',
    'cryptocurrencies', 'ai', 'robotics', 'programming', 'adventurous', 'introvert', 'extrovert',
    'minimalist', 'ambitious', 'creative'
]

def hash_password(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def create_unique_username():
    while True:
        username = fake.user_name()[:50]
        cursor.execute("SELECT 1 FROM Users WHERE username = %s", (username,))
        if not cursor.fetchone():
            return username

def create_user():
    password = fake.password(length=12)
    hashed_password = hash_password(password)
    gender = random.choice(genders)
    first_name = fake.first_name_male() if gender == 'man' else (
        fake.first_name_female() if gender == 'woman' else fake.first_name())
    last_name = fake.last_name()
    email = fake.email()[:255]
    birth_date = fake.date_of_birth(minimum_age=18, maximum_age=30)
    username = create_unique_username() + str(random.randint(0, 1000))

    cursor.execute("""
        INSERT INTO Users ("firstName", "lastName", email, "birthDate", username, password, "isValidated")
        VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id;
    """, (first_name, last_name, email, birth_date, username, hashed_password, True))

    user_id = cursor.fetchone()[0]
    return user_id, gender

def create_settings(user_id, gender):
    country = "France"
    city = fake.city()
    latitude = round(random.uniform(41.0, 51.5), 6)
    longitude = round(random.uniform(-5.0, 9.0), 6)
    max_distance = random.randint(100, 1000000000)
    biography = fake.text(max_nb_chars=200)
    sexual_orientation = random.choice(sexual_orientations)

    cursor.execute("""
        INSERT INTO settings ("userId", country, city, latitude, longitude, "maxDistance", biography, gender, "sexualOrientation")
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s);
    """, (user_id, country, city, latitude, longitude, max_distance, biography, gender, sexual_orientation))

def create_picture(user_id, gender):
    if gender == "man":
        image_url = f"https://randomuser.me/api/portraits/men/{random.randint(0, 99)}.jpg"
    elif gender == "woman":
        image_url = f"https://randomuser.me/api/portraits/women/{random.randint(0, 99)}.jpg"
    else:
        image_url = "https://randomuser.me/api/portraits/lego/1.jpg"

    cursor.execute("""
        INSERT INTO Pictures ("userId", url, "isProfilePicture")
        VALUES (%s, %s, %s);
    """, (user_id, image_url, True))

def generate_fake_data(count=500):
    for _ in range(count):
        user_id, gender = create_user()
        create_settings(user_id, gender)
        create_picture(user_id, gender)

    conn.commit()
    print(f"{count} utilisateurs générés avec succès.")

if __name__ == "__main__":
    generate_fake_data(500)
    cursor.close()
    conn.close()
