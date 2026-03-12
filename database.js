const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.VERCEL
    ? '/tmp/users.db'
    : path.resolve(__dirname, 'users.db');

// Connect to SQLite database
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to the SQLite database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');

        // Initialize tables if they don't exist
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            balance_inr REAL DEFAULT 0.0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) {
                console.error('Error creating users table:', err.message);
            } else {
                console.log('Users table ready.');
                // Add new columns for profile if they don't exist
                db.run(`ALTER TABLE users ADD COLUMN profile_details TEXT DEFAULT '{}'`, () => { });
                db.run(`ALTER TABLE users ADD COLUMN search_history TEXT DEFAULT '[]'`, () => { });
            }
        });
    }
});

module.exports = db;
