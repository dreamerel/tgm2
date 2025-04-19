import React, { useState } from 'react';
import AddAccountModal from '../components/AddAccountModal';

function MainLayout() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [accounts, setAccounts] = useState([]);

  // Загрузка аккаунтов
  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/telegram/accounts');
      const data = await res.json();
      if (data.ok) setAccounts(data.accounts);
    } catch (e) {
      setAccounts([]);
    }
  };

  React.useEffect(() => {
    fetchAccounts();
  }, []);

  // При закрытии AddAccountModal обновлять список
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
          {accounts.length === 0 ? (
            <div className="tg-no-accounts">Нет аккаунтов</div>
          ) : (
            accounts.map(acc => (
              <div key={acc.id || acc.phone} className="tg-account-item">
                <span>{acc.phone}</span>
              </div>
            ))
          )}
        </div>
        <div className="tg-bottom-bar">
          <button className="tg-bottom-btn tg-bottom-btn-active">Чаты</button>
          <button className="tg-bottom-btn">Рассылка</button>
          <button className="tg-bottom-btn">Настройки</button>
          <button className="tg-bottom-btn" onClick={() => {
            localStorage.removeItem('token');
            sessionStorage.removeItem('token');
            window.location.replace('/login');
          }}>Выйти</button>
        </div>
        <AddAccountModal open={showAddModal} onClose={() => setShowAddModal(false)} />
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
