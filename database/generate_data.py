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

fake = Faker()

# Listes pour les valeurs ENUM
genders = ['man', 'woman', 'other']
sexual_orientations = ['heterosexual', 'bisexual', 'homosexual' ]
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
    """Génère un username unique"""
    while True:
        username = fake.user_name()[:50]  # Limiter à 50 caractères
        cursor.execute("SELECT 1 FROM Users WHERE username = %s", (username,))
        if not cursor.fetchone():
            return username

def create_user():
    password = fake.password(length=12)
    hashed_password = hash_password(password)
    first_name = fake.first_name()
    last_name = fake.last_name()
    email = fake.email()[:255]  # Limiter à 255 caractères
    birth_date = fake.date_of_birth(minimum_age=18, maximum_age=30)
    username = create_unique_username()+str(random.randint(0, 1000))

    cursor.execute("""
        INSERT INTO Users ("firstName", "lastName", email, "birthDate", username, password, "isValidated")
        VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id;
    """, (first_name, last_name, email, birth_date, username, hashed_password, True))
    return cursor.fetchone()[0]

def create_settings(user_id):
    country = "France"
    city = fake.city()
    latitude = round(random.uniform(41.0, 51.5), 6)
    longitude = round(random.uniform(-5.0, 9.0), 6)
    max_distance = random.randint(100, 1000000000)
    biography = fake.text(max_nb_chars=200)
    gender = random.choice(genders)
    sexual_orientation = random.choice(sexual_orientations)

    cursor.execute("""
        INSERT INTO settings ("userId", country, city, latitude, longitude, "maxDistance", biography, gender, "sexualOrientation")
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id;
    """, (user_id, country, city, latitude, longitude, max_distance, biography, gender, sexual_orientation))
    return cursor.fetchone()[0]

def create_pictures(settings_id):
    for i in range(random.randint(2, 5)):  # Entre 2 et 5 images
        is_profile = (i == 0)  # La première image est la photo de profil
        url = fake.image_url()
        cursor.execute("""
            INSERT INTO picture ("settingsId", url, "isProfile")
            VALUES (%s, %s, %s);
        """, (settings_id, url, is_profile))

def create_tags(settings_id):
    selected_tags = random.sample(tags_enum, k=random.randint(7, 10))  # Entre 7 et 10 tags
    for tag in selected_tags:
        category = random.choice(['interests', 'sports', 'lifestyle', 'gastronomy', 'culture', 'technology', 'personality'])
        cursor.execute("""
            INSERT INTO tags_entity ("settingsId", category, tag)
            VALUES (%s, %s, %s);
        """, (settings_id, category, tag))

def generate_fake_data(num_users):
    for _ in range(num_users):
        try:
            user_id = create_user()
            settings_id = create_settings(user_id)
            create_pictures(settings_id)
            create_tags(settings_id)
            print(f"User {user_id} created.")
        except Exception as e:
            print(f"Erreur lors de la création d'un utilisateur : {e}")
            conn.rollback()  # Annule la transaction si une erreur survient
        else:
            conn.commit()  # Valide la transaction si tout est correct

try:
    generate_fake_data(200)
except Exception as e:
    print(f"Erreur générale : {e}")
finally:
    cursor.close()
    conn.close()