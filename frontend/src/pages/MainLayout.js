import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AddAccountModal from '../components/AddAccountModal';

function MainLayout() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Получение API URL из переменных окружения
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
  
  // Функция для получения токена
  const getToken = () => localStorage.getItem('token');

  // Загрузка аккаунтов
  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/telegram/accounts`, {
        headers: {
          Authorization: `Bearer ${getToken()}`
        }
      });
      
      if (response.data.ok) {
        setAccounts(response.data.accounts);
      }
    } catch (err) {
      console.error('Ошибка при загрузке аккаунтов:', err);
      setError('Не удалось загрузить аккаунты');
    } finally {
      setLoading(false);
    }
  };

  // Загрузка аккаунтов при монтировании компонента
  useEffect(() => {
    fetchAccounts();
  }, []);

  // Обработчик выхода из системы
  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.replace('/login');
  };

  // При закрытии AddAccountModal обновляем список аккаунтов
  const handleCloseModal = () => {
    setShowAddModal(false);
    fetchAccounts();
  };

  return (
    <div className="tg-wrapper">
      <aside className="tg-sidebar">
        <button className="tg-add-account-btn" onClick={() => setShowAddModal(true)}>+</button>
        <div className="tg-search">
          <input type="text" placeholder="Поиск" />
        </div>
        <div className="tg-tabs">
          <button className="tg-tab tg-tab-active">Все чаты</button>
          <button className="tg-tab">Рассылки</button>
          <button className="tg-tab">Авто</button>
        </div>
        <div className="tg-accounts-list">
          {loading ? (
            <div className="tg-no-accounts">Загрузка...</div>
          ) : error ? (
            <div className="tg-no-accounts">{error}</div>
          ) : accounts.length === 0 ? (
            <div className="tg-no-accounts">Нет аккаунтов</div>
          ) : (
            accounts.map(acc => (
              <div key={acc.id} className="tg-account-item">
                <span>{acc.phone}</span>
              </div>
            ))
          )}
        </div>
        <div className="tg-bottom-bar">
          <button className="tg-bottom-btn tg-bottom-btn-active">Чаты</button>
          <button className="tg-bottom-btn">Рассылка</button>
          <button className="tg-bottom-btn">Настройки</button>
          <button className="tg-bottom-btn" onClick={handleLogout}>Выйти</button>
        </div>
        <AddAccountModal open={showAddModal} onClose={handleCloseModal} />
      </aside>
      <main className="tg-main">
        <div className="tg-empty-chat">
          <div className="tg-telegram-circle">
            <svg width="70" height="70" viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="35" cy="35" r="35" fill="#32A8E2"/>
              <path d="M50 24L30.5 43.5L20 33" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2>Выберите чат</h2>
          <p>Нажмите на чат слева, чтобы начать общение</p>
        </div>
      </main>
    </div>
  );
}

export default MainLayout;
