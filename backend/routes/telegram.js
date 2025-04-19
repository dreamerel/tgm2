const express = require('express');
const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Функция для проверки наличия Python и определения правильной команды
function getPythonCommand() {
    return new Promise((resolve, reject) => {
        // Сначала проверяем python3
        execFile('python3', ['--version'], (error) => {
            if (!error) {
                resolve('python3');
            } else {
                // Если python3 не найден, проверяем python
                execFile('python', ['--version'], (error2) => {
                    if (!error2) {
                        resolve('python');
                    } else {
                        reject(new Error('Python не установлен или не доступен'));
                    }
                });
            }
        });
    });
}

// Функция для запуска Python-скрипта
async function runPythonScript(scriptName, args) {
    try {
        const pythonCommand = await getPythonCommand();
        console.log(`Используем команду Python: ${pythonCommand}`);
        
        // Полный путь к скрипту
        const scriptPath = path.join(process.cwd(), scriptName);
        console.log(`Путь к скрипту: ${scriptPath}`);
        
        // Проверяем, существует ли файл
        if (!fs.existsSync(scriptPath)) {
            throw new Error(`Скрипт не найден: ${scriptPath}`);
        }
        
        return new Promise((resolve, reject) => {
            execFile(pythonCommand, [scriptPath, ...args], (error, stdout, stderr) => {
                if (error) {
                    console.error(`Ошибка выполнения скрипта: ${error.message}`);
                    console.error(`STDERR: ${stderr}`);
                    reject(error);
                    return;
                }
                
                if (stderr) {
                    console.warn(`STDERR (предупреждение): ${stderr}`);
                }
                
                console.log(`STDOUT: ${stdout}`);
                resolve(stdout);
            });
        });
    } catch (error) {
        console.error(`Ошибка при запуске Python-скрипта: ${error.message}`);
        throw error;
    }
}

// POST /api/telegram/send_code
router.post('/send_code', async (req, res) => {
    try {
        const { phone, api_id, api_hash } = req.body;
        if (!phone || !api_id || !api_hash) {
            return res.status(400).json({ message: 'phone, api_id, api_hash required' });
        }
        
        console.log('Запуск скрипта для отправки кода:', { phone, api_id, api_hash });
        
        const result = await runPythonScript('telegram_worker.py', ['send_code', phone, api_id, api_hash]);
        
        try {
            const json = JSON.parse(result);
            res.json(json);
        } catch (e) {
            console.error('Ошибка при разборе JSON:', e.message);
            res.status(500).json({ message: 'Invalid worker response', raw: result });
        }
    } catch (err) {
        console.error('Ошибка сервера:', err.message);
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
        
        console.log('Запуск скрипта для входа:', { phone, code, password: password ? '[СКРЫТО]' : undefined });
        
        // Собираем аргументы для worker
        const args = password
            ? ['sign_in', phone, code, password]
            : ['sign_in', phone, code];
        
        const result = await runPythonScript('telegram_worker.py', args);
        
        try {
            const json = JSON.parse(result);
            res.json(json);
        } catch (e) {
            console.error('Ошибка при разборе JSON:', e.message);
            res.status(500).json({ message: 'Invalid worker response', raw: result });
        }
    } catch (err) {
        console.error('Ошибка сервера:', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

module.exports = router;
