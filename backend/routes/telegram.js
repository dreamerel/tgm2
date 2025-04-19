const express = require('express');
const { spawn } = require('child_process');
const router = express.Router();

// POST /api/telegram/send_code
router.post('/send_code', async (req, res) => {
    try {
        const { phone, api_id, api_hash } = req.body;
        if (!phone || !api_id || !api_hash) {
            return res.status(400).json({ message: 'phone, api_id, api_hash required' });
        }
        const args = ['telegram_worker.py', 'send_code', phone, api_id, api_hash];
        const py = spawn('python', args, { cwd: process.cwd() });
        let result = '';
        let error = '';
        py.stdout.on('data', data => { result += data.toString(); });
        py.stderr.on('data', data => { error += data.toString(); });
        py.on('close', code => {
            // ЛОГИРОВАНИЕ ДЛЯ ДИАГНОСТИКИ
            console.log('PYTHON WORKER STDOUT:', result);
            console.log('PYTHON WORKER STDERR:', error);
            if (error) return res.status(500).json({ message: 'Worker error', error });
            try {
                const json = JSON.parse(result);
                res.json(json);
            } catch (e) {
                res.status(500).json({ message: 'Invalid worker response', raw: result });
            }
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// POST /api/telegram/sign_in
router.post('/sign_in', async (req, res) => {
    console.log('BODY /sign_in:', req.body);
    try {
        const { phone, code, password } = req.body;
        if (!phone || !code) {
            return res.status(400).json({ message: 'phone и code обязательны' });
        }
        // Собираем аргументы для worker
        const args = password
            ? ['telegram_worker.py', 'sign_in', phone, code, password]
            : ['telegram_worker.py', 'sign_in', phone, code];
        const py = spawn('python', args, { cwd: process.cwd() });


        let result = '';
        let error = '';
        py.stdout.on('data', data => { result += data.toString(); });
        py.stderr.on('data', data => { error += data.toString(); });
        py.on('close', code => {
            // ЛОГИРОВАНИЕ ДЛЯ ДИАГНОСТИКИ
            console.log('PYTHON WORKER STDOUT:', result);
            console.log('PYTHON WORKER STDERR:', error);
            if (error) return res.status(500).json({ message: 'Worker error', error });
            try {
                const json = JSON.parse(result);
                res.json(json);
            } catch (e) {
                res.status(500).json({ message: 'Invalid worker response', raw: result });
            }
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

module.exports = router;
