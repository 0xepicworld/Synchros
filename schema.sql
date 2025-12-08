-- Enable foreign keys (SQLite requires this)
PRAGMA foreign_keys = ON;

-- -----------------------------
-- USERS TABLE
-- -----------------------------
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    hash TEXT NOT NULL
);

-- -----------------------------
-- MANIFESTATIONS (JOURNAL) - TABLE
-- -----------------------------
CREATE TABLE IF NOT EXISTS manifestations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    entry_text TEXT NOT NULL,
    category TEXT,
    emotion TEXT,
    keywords TEXT,
    status TEXT DEFAULT 'active',           -- 'active', 'manifested', 'abandoned'
    outcome_text TEXT,                      -- reflection when it manifests
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,                -- when it actually manifested
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- -----------------------------
-- SYNCHRONICITIES - TABLE
-- -----------------------------
CREATE TABLE IF NOT EXISTS synchronicities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT,
    manifestation_id INTEGER, -- Link back to the parent manifestation (optional)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (manifestation_id) REFERENCES manifestations(id) ON DELETE SET NULL
);

-- ---------------------------------------------
-- VIZUALIZATION - TABLE
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS visualization (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    image_url TEXT,
    x_position REAL DEFAULT 0,
    y_position REAL DEFAULT 0,
    scale REAL DEFAULT 1,
    rotation REAL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
);
