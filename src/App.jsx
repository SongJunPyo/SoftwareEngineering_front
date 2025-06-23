// src/App.jsx

import React, { useState, useContext, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';

import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import NotificationToast from './components/NotificationToast';

import TaskDetailPage from './pages/TaskDetailPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import EmailVerificationPage from './pages/EmailVerificationPage';
import KakaoCallbackPage from './pages/KakaoCallbackPage';
import MainPage from './pages/MainPage';
import BoardPage from './pages/BoardPage';
import NaverCallbackPage from './pages/NaverCallbackPage';
import UserSettingsPage from './pages/UserSettingsPage';
import NotificationsPage from './pages/NotificationsPage';
import InviteAcceptPage from './pages/InviteAcceptPage';
import { OrgProjectProvider, OrgProjectContext } from './context/OrgProjectContext';
import { WebSocketProvider } from './websocket/WebSocketContext';
import { setApiClientToken } from './api/api';

function App() {
  return (
    <OrgProjectProvider>
      <WebSocketProvider>
        <AppRoutes />
      </WebSocketProvider>
    </OrgProjectProvider>
  );
}

function AppRoutes() {
  // 로그인 상태 확인
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
  const [latestNotification, setLatestNotification] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { fetchOrganizations } = useContext(OrgProjectContext);

  // 새 알림 처리
  const handleNewNotification = useCallback((notification) => {
    console.log('🎯 App.jsx - 새 알림 수신:', notification);
    setLatestNotification(notification);
  }, []);

  // 로그아웃 함수
  const handleLogout = () => {
    setUser(null);
    setIsLoggedIn(false);
    
    const keysToRemove = [
      'isLoggedIn', 'userEmail', 'userName', 'access_token', 
      'refresh_token', 'userId', 'google_oauth_state'
    ];
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    
    // API 클라이언트에서 토큰 제거
    setApiClientToken(null);
    
    // 구글 OAuth 세션 정리 (선택)
    try {
      if (window.google && window.google.accounts) {
        window.google.accounts.id.disableAutoSelect();
      }
    } catch (_) {}
    // 로그인 페이지로 이동
    window.location.href = '/login';
  };

  // 페이지 이동마다 인증 상태 점검
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const email = localStorage.getItem('userEmail');
    const name = localStorage.getItem('userName');
    
    // 로그인된 상태라면 조직/프로젝트 불러오기
    if (token && email) {
      setUser({ email, name });
      setIsLoggedIn(true);
      fetchOrganizations();
    } else {
      // 로그인 필요 페이지가 아니면 무시
      if (
        location.pathname !== '/login' &&
        location.pathname !== '/signup' && 
        !location.pathname.startsWith('/oauth/')
      ) {
        handleLogout();
      }
    }
  }, [location.pathname]);

  // 아이디/패스워드 로그인 후 호출
  const handleLogin = (email, password, name) => {
    setUser({ email, name });
    setIsLoggedIn(true);
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userEmail', email);
    if (name) localStorage.setItem('userName', name);
    fetchOrganizations();
    navigate('/main', { replace: true });
  };

  // 구글 로그인 성공 시 호출
  const handleGoogleLogin = (email, name) => {
    setUser({ email, name });
    setIsLoggedIn(true);
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userEmail', email);
    if (name) localStorage.setItem('userName', name);
    fetchOrganizations();
    navigate('/main', { replace: true });
  };

  return (
    <>
      <NotificationToast user={user} newNotification={latestNotification} />
      <Routes>
      {/* 1) 로그인/회원가입 */}
      <Route 
        path="/login" 
        element={
          !isLoggedIn 
          ? <LoginPage onLogin={handleLogin} onGoogleLoginSuccess={handleGoogleLogin} /> 
          : <Navigate to="/main" replace />
        } 
      />
      <Route 
        path="/signup" 
        element={
          !isLoggedIn 
          ? <SignupPage /> 
          : <Navigate to="/login" replace />
        } 
      />
      <Route 
        path="/verify-email" 
        element={<EmailVerificationPage />} 
      />

      {/* 2) 메인 페이지 */}
      <Route 
        path="/main" 
        element={
          isLoggedIn 
          ? (
            <div className="min-h-screen bg-white">
              <TopBar 
                user={user} 
                onLogout={handleLogout} 
                onToggleSidebar={() => setSidebarOpen(prev => !prev)}
                onNewNotification={handleNewNotification}
              />
              <main>
                <MainPage />
              </main>
            </div>
          ) 
          : <Navigate to="/login" replace />
        } 
      />
      <Route 
        path="/" 
        element={<Navigate to={isLoggedIn ? "/main" : "/login"} replace />} 
      />

      {/* Board Page (칸반 보드) */}
      <Route
        path="/board"
        element={
          isLoggedIn ? (
            <div className="h-screen flex flex-col">
              <TopBar
                user={user}
                onLogout={handleLogout}
                onToggleSidebar={() => setSidebarOpen(prev => !prev)}
                onNewNotification={handleNewNotification}
              />
              <div className="flex flex-1 overflow-hidden">
                {sidebarOpen && <Sidebar />}
                <main className="flex-1 overflow-hidden bg-gray-100">
                  <BoardPage />
                </main>
              </div>
            </div>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Task Detail (설명 편집 포함) */}
      <Route
        path="/main/:taskId"
        element={
          isLoggedIn ? (
            <div className="h-screen flex flex-col">
              <TopBar
                  user={user}
                  onLogout={handleLogout}
                  onToggleSidebar={() => setSidebarOpen(prev => !prev)}
                  onNewNotification={handleNewNotification}
              />
              <div className="flex flex-1 overflow-hidden">
                {sidebarOpen && <Sidebar />}
                <main className="flex-1 overflow-y-auto bg-gray-100">
                  <TaskDetailPage />
                </main>
              </div>
            </div>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      {/* ────────────────────────────────────────────────────────── */}

      {/* 6) OAuth Callback */}
      <Route 
        path="/oauth/kakao/callback" 
        element={<KakaoCallbackPage />} 
      />
      <Route 
        path="/oauth/naver/callback" 
        element={<NaverCallbackPage />} 
      />

      {/* 7) 사용자 설정 페이지 */}
      <Route
        path="/settings"
        element={
          isLoggedIn ? (
            <div className="min-h-screen bg-white">
              <TopBar 
                user={user} 
                onLogout={handleLogout} 
                onToggleSidebar={() => setSidebarOpen(prev => !prev)}
                onNewNotification={handleNewNotification}
              />
              <main className="p-6 bg-gray-100">
                <UserSettingsPage />
              </main>
            </div>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/notifications"
        element={isLoggedIn ? (
          <div className="min-h-screen bg-white">
            <TopBar user={user} onLogout={handleLogout} onToggleSidebar={() => setSidebarOpen(prev => !prev)} onNewNotification={handleNewNotification} />
            <main className="bg-gray-100">
              <NotificationsPage user={user} />
            </main>
          </div>
        ) : <Navigate to="/login" replace />}
      />
      <Route
        path="/invite/:invitationId"
        element={<InviteAcceptPage />}
      />
      </Routes>
    </>
  );
}

export default App;
