from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta
from pydantic import BaseModel
from typing import Optional, List
import os
import sqlite3
import telethon
from telethon import TelegramClient
from telethon.errors import SessionPasswordNeededError, PhoneCodeInvalidError
import asyncio
import json
from dotenv import load_dotenv

# Загрузка переменных окружения
load_dotenv()

# Настройки JWT
SECRET_KEY = os.getenv("JWT_SECRET", "your-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 дней

# Инициализация FastAPI
app = FastAPI()

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Разрешить все источники
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Инициализация базы данных
conn = sqlite3.connect('tg_manager.db')
c = conn.cursor()

# Создание таблиц, если они не существуют
c.execute('''
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    login TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
)
''')

c.execute('''
CREATE TABLE IF NOT EXISTS telegram_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    phone TEXT NOT NULL,
    api_id TEXT NOT NULL,
    api_hash TEXT NOT NULL,
    session TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
)
''')

conn.commit()
conn.close()

# Модели данных
class User(BaseModel):
    login: str
    password: str

class Token(BaseModel):
    token: str
    login: str

class TokenData(BaseModel):
    user_id: Optional[int] = None
    login: Optional[str] = None

class TelegramAccount(BaseModel):
    phone: str
    api_id: str
    api_hash: str

class TelegramAccountResponse(BaseModel):
    id: int
    phone: str
    api_id: str
    api_hash: str
    created_at: str

class TelegramCodeRequest(BaseModel):
    phone: str
    api_id: str
    api_hash: str

class TelegramSignInRequest(BaseModel):
    phone: str
    api_id: str
    api_hash: str
    code: str
    phone_code_hash: Optional[str] = None
    password: Optional[str] = None

# Настройка безопасности
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Функции для работы с JWT
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        login: str = payload.get("login")
        if user_id is None or login is None:
            raise credentials_exception
        token_data = TokenData(user_id=user_id, login=login)
    except JWTError:
        raise credentials_exception
    
    conn = sqlite3.connect('tg_manager.db')
    c = conn.cursor()
    c.execute("SELECT id, login FROM users WHERE id = ?", (token_data.user_id,))
    user = c.fetchone()
    conn.close()
    
    if user is None:
        raise credentials_exception
    return {"id": user[0], "login": user[1]}

# Маршруты API
@app.post("/api/auth/register", status_code=status.HTTP_201_CREATED)
async def register(user: User):
    conn = sqlite3.connect('tg_manager.db')
    c = conn.cursor()
    
    # Проверка существования пользователя
    c.execute("SELECT id FROM users WHERE login = ?", (user.login,))
    if c.fetchone():
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Login already exists"
        )
    
    # Хеширование пароля и создание пользователя
    hashed_password = pwd_context.hash(user.password)
    c.execute("INSERT INTO users (login, password) VALUES (?, ?)", (user.login, hashed_password))
    conn.commit()
    conn.close()
    
    return {"message": "User registered successfully"}

@app.post("/api/auth/login", response_model=Token)
async def login(form_data: User):
    conn = sqlite3.connect('tg_manager.db')
    c = conn.cursor()
    
    # Поиск пользователя
    c.execute("SELECT id, login, password FROM users WHERE login = ?", (form_data.login,))
    user = c.fetchone()
    conn.close()
    
    if not user or not pwd_context.verify(form_data.password, user[2]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid login or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Создание JWT токена
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user[0]), "login": user[1]}, expires_delta=access_token_expires
    )
    
    return {"token": access_token, "login": user[1]}

@app.get("/api/telegram/accounts", response_model=List[dict])
async def get_accounts(current_user: dict = Depends(get_current_user)):
    conn = sqlite3.connect('tg_manager.db')
    c = conn.cursor()
    
    c.execute("""
        SELECT id, phone, api_id, api_hash, created_at 
        FROM telegram_accounts 
        WHERE user_id = ?
    """, (current_user["id"],))
    
    accounts = []
    for row in c.fetchall():
        accounts.append({
            "id": row[0],
            "phone": row[1],
            "api_id": row[2],
            "api_hash": row[3],
            "created_at": row[4]
        })
    
    conn.close()
    return {"ok": True, "accounts": accounts}

@app.post("/api/telegram/send_code")
async def send_code(data: TelegramCodeRequest):
    try:
        # Создаем клиент Telegram
        client = TelegramClient(f"sessions/{data.phone}", data.api_id, data.api_hash)
        await client.connect()
        
        if not await client.is_user_authorized():
            # Отправляем код
            result = await client.send_code_request(data.phone)
            await client.disconnect()
            
            return {
                "ok": True,
                "phone_code_hash": result.phone_code_hash
            }
        else:
            await client.disconnect()
            return {"ok": True, "message": "Already authorized"}
    
    except Exception as e:
        return {"ok": False, "message": str(e)}

@app.post("/api/telegram/sign_in")
async def sign_in(data: TelegramSignInRequest, current_user: dict = Depends(get_current_user)):
    try:
        # Создаем клиент Telegram
        client = TelegramClient(f"sessions/{data.phone}", data.api_id, data.api_hash)
        await client.connect()
        
        if not await client.is_user_authorized():
            try:
                # Пытаемся войти с кодом
                await client.sign_in(data.phone, data.code, phone_code_hash=data.phone_code_hash)
            except SessionPasswordNeededError:
                # Если требуется пароль двухфакторной аутентификации
                if not data.password:
                    await client.disconnect()
                    return {"ok": False, "needPassword": True}
                
                # Пытаемся войти с паролем
                await client.sign_in(password=data.password)
        
        # Сохраняем сессию
        session_data = client.session.save()
        await client.disconnect()
        
        # Сохраняем аккаунт в базу данных
        conn = sqlite3.connect('tg_manager.db')
        c = conn.cursor()
        
        # Проверяем, существует ли уже такой аккаунт
        c.execute("SELECT id FROM telegram_accounts WHERE user_id = ? AND phone = ?", 
                 (current_user["id"], data.phone))
        account = c.fetchone()
        
        if account:
            # Обновляем существующий аккаунт
            c.execute("""
                UPDATE telegram_accounts 
                SET api_id = ?, api_hash = ?, session = ?
                WHERE id = ?
            """, (data.api_id, data.api_hash, session_data, account[0]))
        else:
            # Создаем новый аккаунт
            c.execute("""
                INSERT INTO telegram_accounts (user_id, phone, api_id, api_hash, session)
                VALUES (?, ?, ?, ?, ?)
            """, (current_user["id"], data.phone, data.api_id, data.api_hash, session_data))
        
        conn.commit()
        conn.close()
        
        return {"ok": True}
    
    except PhoneCodeInvalidError:
        return {"ok": False, "message": "Invalid code"}
    except Exception as e:
        return {"ok": False, "message": str(e)}

# Запуск сервера
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
