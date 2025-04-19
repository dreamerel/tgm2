import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

function Login() {
  const [remember, setRemember] = useState(false);
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();



  // Для отладки
  const [debug, setDebug] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    let debugInfo = { before: {
      localStorageToken: localStorage.getItem('token'),
      sessionStorageToken: sessionStorage.getItem('token')
    } };
    try {
      const res = await axios.post('/api/auth/login', { login, password });
      debugInfo.response = res.data;
      // ВСЕГДА используем localStorage для токена
      localStorage.setItem('token', res.data.token);
      debugInfo.after = {
        localStorageToken: localStorage.getItem('token'),
        sessionStorageToken: sessionStorage.getItem('token')
      };
      setDebug(debugInfo);
      window.location.replace('/');
    } catch (err) {
      if (err.response) {
        setError(err.response.data?.message || 'Ошибка входа');
        debugInfo.error = err.response.data;
      } else if (err.request) {
        setError('Нет ответа от сервера. Проверьте соединение с backend.');
        debugInfo.error = 'Нет ответа от сервера';
      } else {
        setError('Ошибка: ' + err.message);
        debugInfo.error = err.message;
      }
      debugInfo.exception = err;
      debugInfo.after = {
        localStorageToken: localStorage.getItem('token'),
        sessionStorageToken: sessionStorage.getItem('token')
      };
      setDebug(debugInfo);
      console.error('Ошибка входа:', err);
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        {/* Отладочный блок */}
        <div style={{background:'#eee',color:'#333',padding:8,fontSize:13,marginBottom:8,border:'1px solid #ccc'}}>
          <b>DEBUG:</b>
          <div><b>localStorage token:</b> {localStorage.getItem('token') || 'null'}</div>
          <div><b>sessionStorage token:</b> {sessionStorage.getItem('token') || 'null'}</div>
          <div><b>login:</b> {login}</div>
          <div><b>password:</b> {password}</div>
          <div><b>error:</b> {error || '-'}</div>
          <div><b>debug:</b> <pre style={{whiteSpace:'pre-wrap',wordBreak:'break-all'}}>{JSON.stringify(debug, null, 2)}</pre></div>
        </div>
        <h2>Вход</h2>
        <input
          type="text"
          placeholder="Логин"
          value={login}
          onChange={e => setLogin(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
          <input
            type="checkbox"
            id="remember"
            checked={remember}
            onChange={e => setRemember(e.target.checked)}
            style={{ marginRight: 6 }}
          />
          <label htmlFor="remember" style={{ fontSize: 15, color: '#666' }}>
            Запомнить меня
          </label>
        </div>
        <button type="submit">Войти</button>
        <div className="auth-link">
          Нет аккаунта? <Link to="/register">Регистрация</Link>
        </div>
        {error && <div className="auth-error">{error}</div>}
      </form>
    </div>
  );
}

export default Login;
