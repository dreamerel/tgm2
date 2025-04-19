require('dotenv').config();
const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');

const authRouter = require('./routes/auth');
const telegramRouter = require('./routes/telegram');

const app = express();

// Настройка CORS с расширенными опциями
app.use(cors({
  origin: ['https://tgm2.vercel.app', 'http://localhost:3000'], // Разрешаем запросы только с указанных доменов
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true // Разрешаем передачу учетных данных
}));

// Добавляем middleware для предварительных запросов OPTIONS
app.options('*', cors());

// Добавляем дополнительные заголовки для CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});
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
