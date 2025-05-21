import React, { useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

import TopBar from "./components/TopBar";
import Sidebar from "./components/Sidebar";
import ProjectHeader from "./components/ProjectHeader";

import SummaryPage from "./pages/SummaryPage";
import LogPage from "./pages/LogPage";
import BoardPage from "./pages/BoardPage";
import CalendarPage from "./pages/CalendarPage";
import AllTasksPage from "./pages/AllTasksPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('isLoggedIn') === 'true';
  });
  const [user, setUser] = useState(() => {
    const email = localStorage.getItem('userEmail');
    return email ? { email } : null;
  });

  const location = useLocation();
  const isAuthPage = location.pathname === "/login" || location.pathname === "/signup";

  // 이메일/비밀번호 로그인용
  const handleLogin = (email, password) => {
    setUser({ email });
    setIsLoggedIn(true);
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userEmail', email);
  };

  // 구글 로그인 성공 시
  const handleGoogleLogin = (email) => {
    setUser({ email });
    setIsLoggedIn(true);
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userEmail', email);
  };

  const handleLogout = () => {
    setUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
  };

  return (
    <div className="h-screen flex flex-col">
      {!isAuthPage && <TopBar user={user} onLogout={handleLogout} />}
      <div className="flex flex-1 overflow-hidden">
        {!isAuthPage && <Sidebar />}
        <main className="flex-1 overflow-y-auto bg-gray-100">
          {!isAuthPage && <ProjectHeader />}
          <Routes>
            <Route 
              path="/login" 
              element={!isLoggedIn ? <LoginPage onLogin={handleLogin} onGoogleLoginSuccess={handleGoogleLogin} /> : <Navigate to="/board" />} 
            />
            <Route 
              path="/signup" 
              element={!isLoggedIn ? <SignupPage /> : <Navigate to="/board" />} 
            />
            <Route 
              path="/board" 
              element={isLoggedIn ? <BoardPage userEmail={user?.email} onLogout={handleLogout} /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/" 
              element={<Navigate to={isLoggedIn ? "/board" : "/login"} />} 
            />
            <Route path="/log" element={<LogPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/all-tasks" element={<AllTasksPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;

      
