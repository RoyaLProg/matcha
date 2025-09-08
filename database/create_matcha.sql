DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'matcha') THEN
        CREATE DATABASE matcha;
    END IF;
END $$;

\c matcha;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status_enum') THEN
        CREATE TYPE user_status_enum AS ENUM ('offline', 'online');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_gender_enum') THEN
        CREATE TYPE user_gender_enum AS ENUM ('man', 'woman', 'other', 'undefined');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_sexual_orientation_enum') THEN
        CREATE TYPE user_sexual_orientation_enum AS ENUM ('heterosexual', 'bisexual', 'homosexual', 'undefined');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'token_type_enum') THEN
        CREATE TYPE token_type_enum AS ENUM ('password', 'create');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'message_type_enum') THEN
        CREATE TYPE message_type_enum AS ENUM ('text', 'audio', 'video');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'action_status_enum') THEN
        CREATE TYPE action_status_enum AS ENUM ('like', 'dislike');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tags_enum') THEN
        CREATE TYPE tags_enum AS ENUM (
          'artist', 'gamer', 'traveler', 'foodie', 'fitness', 'music',
          'photography', 'books', 'movies', 'nature', 'yoga', 'cooking',
          'dancing', 'hiking', 'tech', 'fashion', 'sports', 'wine',
          'coffee', 'cats', 'dogs', 'beach', 'mountains', 'adventure'
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_status_enum') THEN
        CREATE TYPE report_status_enum AS ENUM ('ongoing', 'resolved', 'rejected');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_type_enum') THEN
        CREATE TYPE report_type_enum AS ENUM ('offensive', 'bully', 'fake');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS Users (
    id SERIAL PRIMARY KEY,
    "firstName" VARCHAR(255) NOT NULL,
    "lastName" VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    "birthday" DATE NOT NULL,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(500) NOT NULL,
    status user_status_enum DEFAULT 'offline',
    "lastconnection" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "blockedIds" INT[] DEFAULT array[]::int[],
    "isValidated" BOOLEAN DEFAULT FALSE,
    "profilePicture" VARCHAR(255) DEFAULT ''
);


CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    "userId" INT UNIQUE NOT NULL,
    latitude FLOAT NULL,
    longitude FLOAT NULL,
    "maxDistance" FLOAT DEFAULT 50,
    geoloc BOOLEAN DEFAULT FALSE,
    "minAgePreference" INT DEFAULT 18,
    "maxAgePreference" INT DEFAULT 100,
	"maxFameRating" INT DEFAULT 10,
    biography VARCHAR(255) DEFAULT '',
    gender user_gender_enum,
    "sexualOrientation" user_sexual_orientation_enum,
    CONSTRAINT fk_user FOREIGN KEY ("userId") REFERENCES Users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS picture (
    id SERIAL PRIMARY KEY,
    "settingsId" INT NOT NULL,
    url VARCHAR(255) NOT NULL,
    "isProfile" BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_settings FOREIGN KEY ("settingsId") REFERENCES settings (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tags_entity (
    id SERIAL PRIMARY KEY,
    "settingsId" INT NOT NULL,
    tag tags_enum NOT NULL,
    CONSTRAINT fk_settings_tags FOREIGN KEY ("settingsId") REFERENCES settings (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS chat (
    id SERIAL PRIMARY KEY,
    "userId" INT NOT NULL,
    "targetUserId" INT NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_chat FOREIGN KEY ("userId") REFERENCES Users (id) ON DELETE CASCADE,
    CONSTRAINT fk_target_user FOREIGN KEY ("targetUserId") REFERENCES Users (id) ON DELETE CASCADE
);

-- Ensure uniqueness of pairs (userId, targetUserId) regardless of order
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'chat_unique_pair_idx'
    ) THEN
        CREATE UNIQUE INDEX chat_unique_pair_idx
        ON chat (LEAST("userId","targetUserId"), GREATEST("userId","targetUserId"));
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS message (
    id SERIAL PRIMARY KEY,
    "chatId" INT NOT NULL,
    "userId" INT NOT NULL,
    type message_type_enum DEFAULT 'text',
    content TEXT,
    "fileUrl" VARCHAR(255),
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_chat FOREIGN KEY ("chatId") REFERENCES chat (id) ON DELETE CASCADE,
    CONSTRAINT fk_user_message FOREIGN KEY ("userId") REFERENCES Users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS history (
    id SERIAL PRIMARY KEY,
    "userId" INT NOT NULL,
	"fromId" INT NOT NULL,
    message TEXT NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "isReaded" BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_user_history FOREIGN KEY ("userId") REFERENCES Users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS auth (
    id SERIAL PRIMARY KEY,
    "userId" INT UNIQUE NOT NULL,
    token TEXT NOT NULL,
    type token_type_enum DEFAULT 'create',
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_auth FOREIGN KEY ("userId") REFERENCES Users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS action (
    id SERIAL PRIMARY KEY,
    "userId" INT NOT NULL,
    "targetUserId" INT NOT NULL,
    status action_status_enum NOT NULL,
    CONSTRAINT fk_user_action FOREIGN KEY ("userId") REFERENCES Users (id) ON DELETE CASCADE,
    CONSTRAINT fk_target_user_action FOREIGN KEY ("targetUserId") REFERENCES Users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS report (
    id SERIAL PRIMARY KEY,
    "userId" INT NOT NULL,
    "from" INT NOT NULL,
	"moreInfo" VARCHAR,
    status report_status_enum DEFAULT 'ongoing',
	type report_type_enum NOT NULL,
    CONSTRAINT fk_user_report FOREIGN KEY ("userId") REFERENCES Users (id) ON DELETE CASCADE,
    CONSTRAINT fk_from_report FOREIGN KEY ("from") REFERENCES Users (id) ON DELETE CASCADE
);

-- Events
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_name = 'event'
    ) THEN
        CREATE TABLE event (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT DEFAULT '',
            date DATE NULL,
            time VARCHAR(16) NULL,
            location VARCHAR(255) DEFAULT '',
            "organizerId" INT NOT NULL,
            "maxAttendees" INT DEFAULT 2,
            "isPrivate" BOOLEAN DEFAULT FALSE,
            "attendeeIds" INT[] DEFAULT array[]::INT[],
            "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_organizer_event FOREIGN KEY ("organizerId") REFERENCES Users (id) ON DELETE CASCADE
        );
    END IF;
END $$;
