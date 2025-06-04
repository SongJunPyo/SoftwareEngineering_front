import React, { useState, useContext, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';

import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import ProjectHeader from './components/ProjectHeader';

import SummaryPage from './pages/SummaryPage';
import LogPage from './pages/LogPage';
import BoardPage from './pages/BoardPage';
import CalendarPage from './pages/CalendarPage';
import AllTasksPage from './pages/AllTasksPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import KakaoCallbackPage from './pages/KakaoCallbackPage';
import MainPage from './pages/MainPage';
import NaverCallbackPage from './pages/NaverCallbackPage';
import UserSettingsPage from './pages/UserSettingsPage';
import { OrgProjectProvider, OrgProjectContext } from './context/OrgProjectContext';

function App() {
  return (
    <OrgProjectProvider>
      <AppRoutes />
    </OrgProjectProvider>
  );
}

function AppRoutes() {
  // JWT 토큰 확인하여 초기 로그인 상태 설정
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const token = localStorage.getItem('access_token');
    const isLoggedInFlag = localStorage.getItem('isLoggedIn') === 'true';
    return token && isLoggedInFlag;
  });
  
  const [user, setUser] = useState(() => {
    const email = localStorage.getItem('userEmail');
    const name = localStorage.getItem('userName');
    return email ? { email, name } : null;
  });
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthPage = location.pathname === "/login" || location.pathname === "/signup";
  const { fetchOrganizations } = useContext(OrgProjectContext);

  // 컴포넌트 마운트 시 토큰 검증
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const email = localStorage.getItem('userEmail');
    const name = localStorage.getItem('userName');
    
    if (token && email) {
      setUser({ email, name });
      setIsLoggedIn(true);
      fetchOrganizations();
    } else {
      // 토큰이 없거나 유효하지 않으면 로그아웃 처리
      handleLogout();
    }
  }, []);

  // 이메일/비밀번호 로그인용
  const handleLogin = (email, password, name) => {
    setUser({ email, name });
    setIsLoggedIn(true);
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userEmail', email);
    if (name) localStorage.setItem('userName', name);
    fetchOrganizations();
    navigate('/main', { replace: true });
  };

  // 구글 로그인 성공 시
  const handleGoogleLogin = (email, name) => {
    setUser({ email, name });
    setIsLoggedIn(true);
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userEmail', email);
    if (name) localStorage.setItem('userName', name);
    fetchOrganizations();
    navigate('/main', { replace: true });
  };

  const handleLogout = () => {
    setUser(null);
    setIsLoggedIn(false);
    // 모든 인증 관련 데이터 삭제
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/login');
  };

  return (
    <OrgProjectProvider>
      <Routes>
        <Route 
          path="/login" 
          element={!isLoggedIn ? <LoginPage onLogin={handleLogin} onGoogleLoginSuccess={handleGoogleLogin} /> : <Navigate to="/main" replace />} 
        />
        <Route 
          path="/signup" 
          element={!isLoggedIn ? <SignupPage /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/main" 
          element={isLoggedIn ? (
            <div className="min-h-screen bg-white">
              <TopBar user={user} onLogout={handleLogout} onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
              <main>
                <MainPage />
              </main>
            </div>
          ) : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/" 
          element={<Navigate to={isLoggedIn ? "/main" : "/login"} replace />} 
        />
        {/* 워크스페이스 레이아웃 */}
        <Route 
          path="/workspace/board" 
          element={isLoggedIn ? (
            <div className="h-screen flex flex-col">
              <TopBar user={user} onLogout={handleLogout} onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
              <div className="flex flex-1 overflow-hidden">
                {sidebarOpen && <Sidebar />}
                <main className="flex-1 overflow-y-auto bg-gray-100">
                  <ProjectHeader />
                  <BoardPage userEmail={user?.email} onLogout={handleLogout} />
                </main>
              </div>
            </div>
          ) : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/workspace/log" 
          element={isLoggedIn ? (
            <div className="h-screen flex flex-col">
              <TopBar user={user} onLogout={handleLogout} onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
              <div className="flex flex-1 overflow-hidden">
                {sidebarOpen && <Sidebar />}
                <main className="flex-1 overflow-y-auto bg-gray-100">
                  <ProjectHeader />
                  <LogPage />
                </main>
              </div>
            </div>
          ) : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/workspace/calendar" 
          element={isLoggedIn ? (
            <div className="h-screen flex flex-col">
              <TopBar user={user} onLogout={handleLogout} onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
              <div className="flex flex-1 overflow-hidden">
                {sidebarOpen && <Sidebar />}
                <main className="flex-1 overflow-y-auto bg-gray-100">
                  <ProjectHeader />
                  <CalendarPage />
                </main>
              </div>
            </div>
          ) : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/workspace" 
          element={isLoggedIn ? <Navigate to="/workspace/board" replace /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/oauth/kakao/callback" 
          element={<KakaoCallbackPage />} 
        />
        <Route 
          path="/oauth/naver/callback" 
          element={<NaverCallbackPage />} 
        />
        <Route
          path="/settings"
          element={isLoggedIn ? (
            <div className="min-h-screen bg-white">
              <TopBar user={user} onLogout={handleLogout} onToggleSidebar={() => setSidebarOpen(prev => !prev)} />
              <main className="p-6 bg-gray-100">
                <UserSettingsPage />
              </main>
            </div>
          ) : <Navigate to="/login" replace />}
        />
      </Routes>
    </OrgProjectProvider>
  );
}

export default App;