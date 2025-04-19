# Telegram Manager

Приложение для управления аккаунтами Telegram с веб-интерфейсом.

## Структура проекта

Проект состоит из двух частей:
- **Backend**: Python FastAPI приложение, работающее с Telegram API через библиотеку Telethon
- **Frontend**: React приложение для взаимодействия с пользователем

## Настройка и запуск

### Backend

1. Перейдите в директорию backend:
```
cd backend
```

2. Установите зависимости:
```
pip install -r requirements.txt
```

3. Создайте файл .env с секретным ключом:
```
JWT_SECRET=your-secret-key-change-this-in-production
```

4. Запустите сервер:
```
uvicorn main:app --reload
```

### Frontend

1. Перейдите в директорию frontend:
```
cd frontend
```

2. Установите зависимости:
```
npm install
```

3. Создайте файл .env с URL бэкенда:
```
REACT_APP_API_URL=http://localhost:8000
```

4. Запустите приложение:
```
npm start
```

## Деплой

### Backend (Render)

1. Создайте новый Web Service на Render
2. Подключите репозиторий GitHub
3. Укажите директорию backend как корневую
4. Добавьте переменную окружения JWT_SECRET
5. Используйте команду запуска: `uvicorn main:app --host=0.0.0.0 --port=$PORT`

### Frontend (Vercel)

1. Создайте новый проект на Vercel
2. Подключите репозиторий GitHub
3. Укажите директорию frontend как корневую
4. Добавьте переменную окружения REACT_APP_API_URL с URL вашего бэкенда на Render

## Использование

1. Зарегистрируйтесь или войдите в приложение
2. Добавьте аккаунт Telegram, указав номер телефона, API ID и API Hash
3. Подтвердите вход с помощью кода из Telegram
4. Управляйте своими аккаунтами Telegram через веб-интерфейс
