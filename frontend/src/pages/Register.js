import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

function Register() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Проверка совпадения паролей
    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }
    
    setLoading(true);
    
    try {
      // Используем API_URL из .env или по умолчанию localhost
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
      await axios.post(`${API_URL}/api/auth/register`, { login, password });
      
      // После успешной регистрации перенаправляем на страницу входа
      navigate('/login');
    } catch (err) {
      if (err.response) {
        setError(err.response.data?.detail || 'Ошибка регистрации');
      } else if (err.request) {
        setError('Нет ответа от сервера. Проверьте соединение с backend.');
      } else {
        setError('Ошибка: ' + err.message);
      }
      console.error('Ошибка регистрации:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Регистрация</h2>
        <input
          type="text"
          placeholder="Логин"
          value={login}
          onChange={e => setLogin(e.target.value)}
          required
          disabled={loading}
        />
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          disabled={loading}
        />
        <input
          type="password"
          placeholder="Подтвердите пароль"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          required
          disabled={loading}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Загрузка...' : 'Зарегистрироваться'}
        </button>
        <div className="auth-link">
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </div>
        {error && <div className="auth-error">{error}</div>}
      </form>
    </div>
  );
}

export default Register;
