import React, { useState } from 'react';
import axios from 'axios';

function AddAccountModal({ open, onClose }) {
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

  // Получение API URL из переменных окружения
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
  
  // Функция для получения токена
  const getToken = () => localStorage.getItem('token');

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
  };

  const handleSendCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/telegram/send_code`, 
        { phone, api_id: apiId, api_hash: apiHash },
        {
          headers: {
            Authorization: `Bearer ${getToken()}`
          }
        }
      );
      
      if (res.data && res.data.ok) {
        setPhoneCodeHash(res.data.phone_code_hash);
        setStep(2);
      } else {
        setError(res.data?.message || 'Ошибка отправки кода');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка отправки запроса');
      console.error('Ошибка при отправке кода:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post(
        `${API_URL}/api/telegram/sign_in`,
        { 
          phone, 
          api_id: apiId, 
          api_hash: apiHash, 
          code, 
          phone_code_hash: phoneCodeHash, 
          password 
        },
        {
          headers: {
            Authorization: `Bearer ${getToken()}`
          }
        }
      );
      
      if (res.data && res.data.needPassword) {
        setNeedPassword(true);
        setStep(3);
      } else if (res.data && res.data.ok) {
        onClose();
        reset();
      } else {
        setError(res.data?.message || 'Ошибка подтверждения');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка запроса');
      console.error('Ошибка при верификации кода:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post(
        `${API_URL}/api/telegram/sign_in`, 
        { 
          phone, 
          code, 
          password, 
          api_id: apiId, 
          api_hash: apiHash 
        },
        {
          headers: {
            Authorization: `Bearer ${getToken()}`
          }
        }
      );
      
      if (res.data && res.data.ok) {
        onClose();
        reset();
      } else {
        setError(res.data?.message || 'Ошибка добавления аккаунта');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка запроса');
      console.error('Ошибка при добавлении аккаунта:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    reset();
  };

  if (!open) return null;

  return (
    <div className="tg-modal-overlay">
      <div className="tg-modal">
        <h3>Добавить Telegram-аккаунт</h3>
        {step === 1 && (
          <form onSubmit={handleSendCode}>
            <input
              type="text"
              placeholder="Номер телефона"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              required
              disabled={loading}
            />
            <input
              type="text"
              placeholder="API ID"
              value={apiId}
              onChange={e => setApiId(e.target.value)}
              required
              disabled={loading}
            />
            <input
              type="text"
              placeholder="API Hash"
              value={apiHash}
              onChange={e => setApiHash(e.target.value)}
              required
              disabled={loading}
            />
            <div className="tg-modal-actions">
              <button type="submit" disabled={loading}>
                {loading ? 'Загрузка...' : 'Далее'}
              </button>
              <button type="button" onClick={handleClose} disabled={loading}>Отмена</button>
            </div>
            {error && <div className="auth-error">{error}</div>}
          </form>
        )}
        {step === 2 && (
          <form onSubmit={handleVerifyCode}>
            <input
              type="text"
              placeholder="Код подтверждения"
              value={code}
              onChange={e => setCode(e.target.value)}
              required
              disabled={loading}
            />
            <div className="tg-modal-actions">
              <button type="submit" disabled={loading}>
                {loading ? 'Загрузка...' : 'Далее'}
              </button>
              <button type="button" onClick={() => setStep(1)} disabled={loading}>Назад</button>
            </div>
            {error && <div className="auth-error">{error}</div>}
          </form>
        )}
        {step === 3 && needPassword && (
          <form onSubmit={handleFinish}>
            <input
              type="password"
              placeholder="Пароль (двухфакторная аутентификация)"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              disabled={loading}
            />
            <div className="tg-modal-actions">
              <button type="submit" disabled={loading}>
                {loading ? 'Загрузка...' : 'Завершить'}
              </button>
              <button type="button" onClick={() => setStep(2)} disabled={loading}>Назад</button>
            </div>
            {error && <div className="auth-error">{error}</div>}
          </form>
        )}
      </div>
    </div>
  );
}

export default AddAccountModal;
