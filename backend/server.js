require('dotenv').config();
const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');

const authRouter = require('./routes/auth');
const telegramRouter = require('./routes/telegram');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/telegram', telegramRouter);

const PORT = process.env.PORT || 5000;

// Инициализация SQLite
const db = new Database('tg_manager.db');

db.prepare(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    login TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
)`).run();

db.prepare(`CREATE TABLE IF NOT EXISTS telegram_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    phone TEXT NOT NULL,
    api_id TEXT NOT NULL,
    api_hash TEXT NOT NULL,
    session TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
)`).run();

console.log('SQLite DB initialized');
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
