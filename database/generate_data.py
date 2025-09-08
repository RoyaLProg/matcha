
import bcrypt
import random
import time
from faker import Faker
import psycopg2
from psycopg2 import sql
import os

DB_NAME = os.getenv("POSTGRES_DB")
DB_USER = os.getenv("POSTGRES_USER")
DB_PASSWORD = os.getenv("POSTGRES_PASSWORD")

fake = Faker("fr_FR")


def wait_for_db(max_retries: int = 120, delay_seconds: float = 1.0):
    """Wait for PostgreSQL to be ready and return a connection + cursor.

    - Retries connection creation until success or max_retries.
    - After connecting, waits until core tables exist (created by init SQL).
    """
    last_err = None
    conn = None
    for _ in range(max_retries):
        try:
            conn = psycopg2.connect(
                dbname=DB_NAME,
                user=DB_USER,
                password=DB_PASSWORD,
                host="database",
                port="5432",
            )
            conn.autocommit = False
            cursor = conn.cursor()
            break
        except Exception as e:
            last_err = e
            time.sleep(delay_seconds)
    else:
        raise RuntimeError(f"Unable to connect to database after {max_retries} retries: {last_err}")

    # Ensure required tables exist (init script may still be running)
    required_tables = {"users", "settings", "picture", "tags_entity"}
    for _ in range(max_retries):
        try:
            cursor.execute(
                """
                SELECT LOWER(table_name)
                FROM information_schema.tables
                WHERE table_schema = 'public'
                """
            )
            present = {row[0] for row in cursor.fetchall()}
            if required_tables.issubset(present):
                return conn, cursor
        except Exception:
            pass
        time.sleep(delay_seconds)

    cursor.close()
    conn.close()
    raise RuntimeError("Database connected but required tables not found in time.")


conn, cursor = wait_for_db()

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
    """Generate a username and ensure it is unique in DB.

    Appends a small random suffix and validates against the Users table.
    """
    while True:
        base = fake.user_name()[:40]
        # Keep username reasonably short and ASCII-like from faker
        candidate = f"{base}{random.randint(0, 9999):04d}"
        candidate = candidate[:50]
        cursor.execute("SELECT 1 FROM Users WHERE username = %s", (candidate,))
        if not cursor.fetchone():
            return candidate


def create_unique_email():
    """Generate an email and ensure it is unique in DB."""
    while True:
        email = fake.email()[:255]
        cursor.execute("SELECT 1 FROM Users WHERE email = %s", (email,))
        if not cursor.fetchone():
            return email

def create_user():
    password = fake.password(length=12)
    hashed_password = hash_password(password)
    gender = random.choice(genders)
    first_name = fake.first_name_male() if gender == 'man' else (
        fake.first_name_female() if gender == 'woman' else fake.first_name())
    last_name = fake.last_name()
    email = create_unique_email()
    birth_date = fake.date_of_birth(minimum_age=18, maximum_age=35)
    username = create_unique_username()

    cursor.execute(
        """
        INSERT INTO Users ("firstName", "lastName", email, birthday, username, password, "isValidated", "profilePicture")
        VALUES (%s, %s, %s, %s, %s, %s, %s, '')
        RETURNING id;
        """,
        (first_name, last_name, email, birth_date, username, hashed_password, True),
    )

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
    success = 0
    for _ in range(count):
        try:
            user_id, gender = create_user()
            settings_id = create_settings(user_id, gender)
            create_picture(settings_id, gender)
            create_tags(settings_id)
            conn.commit()
            success += 1
        except Exception as e:
            # Rollback this iteration and continue; don't abort whole run
            conn.rollback()
            print(f"[WARN] Skipping one user due to error: {e}")

    print(f"{success}/{count} utilisateurs générés avec succès.")

if __name__ == "__main__":
    generate_users()
    cursor.close()
    conn.close()
