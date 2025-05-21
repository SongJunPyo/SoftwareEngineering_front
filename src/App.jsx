import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import BoardPage from './pages/BoardPage';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('isLoggedIn') === 'true';
  });
  const [userEmail, setUserEmail] = useState(localStorage.getItem('userEmail') || '');

  const handleLogin = (email, password) => {
    setIsLoggedIn(true);
    setUserEmail(email);
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userEmail', email);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserEmail('');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
  };

  return (
    <Routes>
      <Route 
        path="/login" 
        element={!isLoggedIn ? <LoginPage onLogin={handleLogin} /> : <Navigate to="/board" />} 
      />
      <Route 
        path="/signup" 
        element={!isLoggedIn ? <SignupPage /> : <Navigate to="/board" />} 
      />
      <Route 
        path="/board" 
        element={isLoggedIn ? <BoardPage userEmail={userEmail} onLogout={handleLogout} /> : <Navigate to="/login" />} 
      />
      <Route 
        path="/" 
        element={<Navigate to={isLoggedIn ? "/board" : "/login"} />} 
      />
    </Routes>
  );
}

export default App; 