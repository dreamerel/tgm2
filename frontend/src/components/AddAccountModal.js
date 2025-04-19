import React, { useState, useEffect } from 'react';
import axios from 'axios';

function AddAccountModal({ open, onClose }) {
  // Состояния для формы
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [apiId, setApiId] = useState('');
  const [apiHash, setApiHash] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [needPassword, setNeedPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [phoneCodeHash, setPhoneCodeHash] = useState('');
  
  // Состояние для отладки
  const [debug, setDebug] = useState({});

  // Сброс формы
  const reset = () => {
    setStep(1);
    setPhone('');
    setApiId('');
    setApiHash('');
    setCode('');
    setPassword('');
    setError('');
    setNeedPassword(false);
    setLoading(false);
    setPhoneCodeHash('');
    setDebug({});
  };

  // Создаем клиент axios с настроенными заголовками
  const apiClient = axios.create({
    baseURL: '',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    withCredentials: true
  });

  // Обработчик отправки кода
  const handleSendCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setDebug({...debug, action: 'send_code', params: { phone, api_id: apiId, api_hash: apiHash }});
    
    try {
      console.log('Отправка запроса на /api/telegram/send_code с данными:', { phone, api_id: apiId, api_hash: apiHash });
      
      const res = await apiClient.post('/api/telegram/send_code', { 
        phone, 
        api_id: apiId, 
        api_hash: apiHash 
      });
      
      console.log('Ответ от сервера:', res.data);
      setDebug({...debug, response: res.data});
      
      if (res.data && res.data.ok) {
        setPhoneCodeHash(res.data.phone_code_hash);
        setStep(2);
      } else {
        setError(res.data?.message || 'Ошибка отправки кода');
      }
    } catch (err) {
      console.error('Ошибка при отправке кода:', err);
      setDebug({...debug, error: err.toString(), response: err.response?.data});
      
      if (err.response) {
        setError(`Ошибка ${err.response.status}: ${err.response.data?.message || 'Ошибка сервера'}`);
      } else if (err.request) {
        setError('Нет ответа от сервера. Проверьте соединение.');
      } else {
        setError(`Ошибка: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Обработчик проверки кода
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setDebug({...debug, action: 'sign_in', params: { phone, code, phone_code_hash: phoneCodeHash }});
    
    try {
      console.log('Отправка запроса на /api/telegram/sign_in с данными:', { 
        phone, code, api_id: apiId, api_hash: apiHash, phone_code_hash: phoneCodeHash 
      });
      
      const res = await apiClient.post('/api/telegram/sign_in', { 
        phone, 
        code, 
        api_id: apiId, 
        api_hash: apiHash,
        phone_code_hash: phoneCodeHash
      });
      
      console.log('Ответ от сервера:', res.data);
      setDebug({...debug, response: res.data});
      
      if (res.data && res.data.needPassword) {
        setNeedPassword(true);
        setStep(3);
      } else if (res.data && res.data.ok) {
        // Успешное добавление аккаунта
        window.location.reload(); // Перезагружаем страницу для обновления списка аккаунтов
      } else {
        setError(res.data?.message || 'Ошибка подтверждения');
      }
    } catch (err) {
      console.error('Ошибка при проверке кода:', err);
      setDebug({...debug, error: err.toString(), response: err.response?.data});
      
      if (err.response) {
        setError(`Ошибка ${err.response.status}: ${err.response.data?.message || 'Ошибка сервера'}`);
      } else if (err.request) {
        setError('Нет ответа от сервера. Проверьте соединение.');
      } else {
        setError(`Ошибка: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Обработчик ввода пароля (если требуется)
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setDebug({...debug, action: 'password_submit', params: { phone, code, password }});
    
    try {
      console.log('Отправка запроса на /api/telegram/sign_in с паролем');
      
      const res = await apiClient.post('/api/telegram/sign_in', { 
        phone, 
        code, 
        password,
        api_id: apiId, 
        api_hash: apiHash,
        phone_code_hash: phoneCodeHash
      });
      
      console.log('Ответ от сервера:', res.data);
      setDebug({...debug, response: res.data});
      
      if (res.data && res.data.ok) {
        // Успешное добавление аккаунта
        window.location.reload(); // Перезагружаем страницу для обновления списка аккаунтов
      } else {
        setError(res.data?.message || 'Ошибка добавления аккаунта');
      }
    } catch (err) {
      console.error('Ошибка при отправке пароля:', err);
      setDebug({...debug, error: err.toString(), response: err.response?.data});
      
      if (err.response) {
        setError(`Ошибка ${err.response.status}: ${err.response.data?.message || 'Ошибка сервера'}`);
      } else if (err.request) {
        setError('Нет ответа от сервера. Проверьте соединение.');
      } else {
        setError(`Ошибка: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Обработчик закрытия модального окна
  const handleClose = () => {
    onClose();
    reset();
  };

  // Если модальное окно закрыто, не рендерим ничего
  if (!open) return null;

  return (
    <div className="tg-modal-overlay">
      <div className="tg-modal">
        <h3>Добавить Telegram-аккаунт</h3>
        
        {/* Отладочная информация */}
        <div style={{background:'#eee',color:'#333',padding:8,fontSize:12,marginBottom:12,border:'1px solid #ccc',maxHeight:150,overflow:'auto'}}>
          <b>DEBUG:</b>
          <div><b>Шаг:</b> {step}</div>
          <div><b>Телефон:</b> {phone}</div>
          <div><b>API ID:</b> {apiId}</div>
          <div><b>API Hash:</b> {apiHash ? '[СКРЫТО]' : 'не указан'}</div>
          <div><b>Код:</b> {code}</div>
          <div><b>Ошибка:</b> {error || '-'}</div>
          <div><b>Детали:</b> <pre style={{whiteSpace:'pre-wrap',wordBreak:'break-all'}}>{JSON.stringify(debug, null, 2)}</pre></div>
        </div>
        
        {/* Шаг 1: Ввод телефона и API-данных */}
        {step === 1 && (
          <form onSubmit={handleSendCode}>
            <input
              type="text"
              placeholder="Номер телефона (с кодом страны)"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              required
              disabled={loading}
            />
            <input
              type="text"
              placeholder="API ID (из my.telegram.org)"
              value={apiId}
              onChange={e => setApiId(e.target.value)}
              required
              disabled={loading}
            />
            <input
              type="text"
              placeholder="API Hash (из my.telegram.org)"
              value={apiHash}
              onChange={e => setApiHash(e.target.value)}
              required
              disabled={loading}
            />
            <div className="tg-modal-actions">
              <button type="submit" disabled={loading}>
                {loading ? 'Отправка...' : 'Отправить код'}
              </button>
              <button type="button" onClick={handleClose} disabled={loading}>
                Отмена
              </button>
            </div>
            {error && <div className="auth-error">{error}</div>}
          </form>
        )}
        
        {/* Шаг 2: Ввод кода подтверждения */}
        {step === 2 && (
          <form onSubmit={handleVerifyCode}>
            <input
              type="text"
              placeholder="Код подтверждения из Telegram"
              value={code}
              onChange={e => setCode(e.target.value)}
              required
              disabled={loading}
              autoFocus
            />
            <div className="tg-modal-actions">
              <button type="submit" disabled={loading}>
                {loading ? 'Проверка...' : 'Подтвердить'}
              </button>
              <button 
                type="button" 
                onClick={() => setStep(1)} 
                disabled={loading}
              >
                Назад
              </button>
            </div>
            {error && <div className="auth-error">{error}</div>}
          </form>
        )}
        
        {/* Шаг 3: Ввод пароля (если требуется) */}
        {step === 3 && needPassword && (
          <form onSubmit={handlePasswordSubmit}>
            <input
              type="password"
              placeholder="Пароль от двухфакторной аутентификации"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              disabled={loading}
              autoFocus
            />
            <div className="tg-modal-actions">
              <button type="submit" disabled={loading}>
                {loading ? 'Отправка...' : 'Завершить'}
              </button>
              <button 
                type="button" 
                onClick={() => setStep(2)} 
                disabled={loading}
              >
                Назад
              </button>
            </div>
            {error && <div className="auth-error">{error}</div>}
          </form>
        )}
      </div>
    </div>
  );
}

export default AddAccountModal;
