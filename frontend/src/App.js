import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import MainLayout from './pages/MainLayout';

function getToken() {
  return localStorage.getItem('token');
}

function App() {
  // Считаем авторизацию ПРИ КАЖДОМ РЕНДЕРЕ
  const isAuth = !!getToken();

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/*" element={isAuth ? <MainLayout /> : <Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
