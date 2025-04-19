const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');
const db = new Database('tg_manager.db');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
    try {
        const { login, password } = req.body;
        if (!login || !password) {
            return res.status(400).json({ message: 'Login and password are required' });
        }
        const candidate = db.prepare('SELECT * FROM users WHERE login = ?').get(login);
        if (candidate) {
            return res.status(400).json({ message: 'Login already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        db.prepare('INSERT INTO users (login, password) VALUES (?, ?)').run(login, hashedPassword);
        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Login
router.post('/login', async (req, res) => {
    // ВРЕМЕННО: выводим всех пользователей для отладки
    const allUsers = db.prepare('SELECT * FROM users').all();
    console.log('ВСЕ ПОЛЬЗОВАТЕЛИ:', allUsers);
    try {
        const { login, password } = req.body;
        const user = db.prepare('SELECT * FROM users WHERE login = ?').get(login);
        if (!user) {
            return res.status(400).json({ message: 'Invalid login or password' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid login or password' });
        }
        const token = jwt.sign(
            { userId: user.id, login: user.login },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        res.json({ token, login: user.login });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
