#!/bin/bash

# Установка Node.js зависимостей
cd backend
npm install

# Установка Python зависимостей
cd ..
pip install -r requirements.txt

# Возвращаемся в корневую директорию
cd ..
