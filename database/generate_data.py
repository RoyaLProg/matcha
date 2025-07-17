
import bcrypt
import random
from faker import Faker
import psycopg2
import os

DB_NAME = os.getenv("POSTGRES_DB")
DB_USER = os.getenv("POSTGRES_USER")
DB_PASSWORD = os.getenv("POSTGRES_PASSWORD")

# Connexion PostgreSQL
conn = psycopg2.connect(
    dbname=DB_NAME,
    user=DB_USER,
    password=DB_PASSWORD,
    host="database",
    port="5432"
)
cursor = conn.cursor()
fake = Faker("fr_FR")

# Enums
genders = ['man', 'woman', 'other']
orientations = ['heterosexual', 'bisexual', 'homosexual']
tags_enum = [
    'artist', 'gamer', 'traveler', 'foodie', 'fitness', 'music',
    'photography', 'books', 'movies', 'nature', 'yoga', 'cooking',
    'dancing', 'hiking', 'tech', 'fashion', 'sports', 'wine',
    'coffee', 'cats', 'dogs', 'beach', 'mountains', 'adventure'
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
    birth_date = fake.date_of_birth(minimum_age=18, maximum_age=35)
    username = create_unique_username() + str(random.randint(0, 999))

    cursor.execute("""
        INSERT INTO Users ("firstName", "lastName", email, birthday, username, password, "isValidated", "profilePicture")
        VALUES (%s, %s, %s, %s, %s, %s, %s, '')
        RETURNING id;
    """, (first_name, last_name, email, birth_date, username, hashed_password, True))

    user_id = cursor.fetchone()[0]
    return user_id, gender

def create_settings(user_id, gender):
    lat = round(random.uniform(41.0, 51.5), 6)
    lon = round(random.uniform(-5.0, 9.0), 6)
    bio = fake.text(max_nb_chars=180)
    orientation = random.choice(orientations)

    cursor.execute("""
        INSERT INTO settings ("userId", latitude, longitude, biography, gender, "sexualOrientation")
        VALUES (%s, %s, %s, %s, %s, %s)
        RETURNING id;
    """, (user_id, lat, lon, bio, gender, orientation))

    return cursor.fetchone()[0]

def create_picture(settings_id, gender):
    if gender == "man":
        image_url = f"https://randomuser.me/api/portraits/men/{random.randint(0, 99)}.jpg"
    elif gender == "woman":
        image_url = f"https://randomuser.me/api/portraits/women/{random.randint(0, 99)}.jpg"
    else:
        image_url = "https://randomuser.me/api/portraits/lego/1.jpg"

    cursor.execute("""
        INSERT INTO picture ("settingsId", url, "isProfile")
        VALUES (%s, %s, TRUE);
    """, (settings_id, image_url))

    cursor.execute("""
        UPDATE Users
        SET "profilePicture" = %s
        WHERE id = (SELECT "userId" FROM settings WHERE id = %s)
    """, (image_url, settings_id))

def create_tags(settings_id, tag_count=3):
    selected_tags = random.sample(tags_enum, tag_count)
    for tag in selected_tags:
        cursor.execute("""
            INSERT INTO tags_entity ("settingsId", tag)
            VALUES (%s, %s)
        """, (settings_id, tag))

def generate_users(count=500):
    for _ in range(count):
        user_id, gender = create_user()
        settings_id = create_settings(user_id, gender)
        create_picture(settings_id, gender)
        create_tags(settings_id)

    conn.commit()
    print(f"{count} utilisateurs générés avec succès.")

if __name__ == "__main__":
    generate_users()
    cursor.close()
    conn.close()