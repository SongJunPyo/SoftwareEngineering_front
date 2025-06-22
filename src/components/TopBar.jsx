import React, { useState, useRef, useEffect } from "react";
import logo from "./planora.png";
import { useLocation, useNavigate } from "react-router-dom";
import { AlertButton, SettingsButton } from "./Button";
import useNotifications from '../hooks/useNotifications';

function getNotificationIcon(type) {
  switch(type) {
    case 'comment': return '💬';
    case 'deadline': return '⏰';
    case 'project': return '📁';
    default: return '🔔';
  }
}

function TopBar({ user, onLogout }) {
  const [showAlerts, setShowAlerts] = useState(false);
  const alertRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const {
     notifications,
     unreadCount,
     markAsRead,
     refresh,
     loadMore,
     filter,
     setFilter
   } = useNotifications(user);

  // 바깥 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClickOutside(event) {
      if (alertRef.current && !alertRef.current.contains(event.target)) {
        setShowAlerts(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // 로그아웃 핸들러 - localStorage 직접 조작 제거
  const handleLogout = () => {
    if (typeof onLogout === 'function') {
      onLogout();
    }
  };

  return (
    <header className="bg-white px-6 py-4 flex justify-between items-center relative">
      {/* 로고 이미지 */}
      <img
        src={logo}
        alt="Planora Logo"
        className="h-8 cursor-pointer"
        onClick={() => {
          if (user && user.email) {
            navigate('/main', { replace: true });
          } else {
            navigate('/login', { replace: true });
          }
        }}
      />

      {/* 우측 버튼들 */}
      <div className="flex items-center space-x-4 relative">
        {/* 알림 버튼 + 드롭다운 */}
        <div className="relative" ref={alertRef}>
          <AlertButton onClick={() => setShowAlerts((prev) => !prev)} />

          {showAlerts && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded shadow z-50">
              <div className="p-3">
                <h4 className="font-semibold text-sm mb-2">알림</h4>
                {/* <ul className="text-sm space-y-1 max-h-40 overflow-y-auto">
                  {dummyAlerts.slice(0, 5).map((alert, idx) => (
                    <li key={idx} className="border-b pb-1">{alert}</li>
                  ))}
                </ul>
                <div className="text-right mt-2">
                  <span className="text-blue-600 underline text-sm cursor-pointer">
                    전체보기
                  </span>
                </div> */}
                                {/* 필터 버튼 */}
                <div className="flex justify-between mb-2 text-sm">
                  {['all', 'comment', 'deadline', 'project'].map(t => (
                    <button
                      key={t}
                      onClick={() => setFilter(t)}
                      className={`px-2 py-1 rounded ${filter === t ? 'bg-blue-200' : 'bg-gray-100'}`}
                    >
                      {getNotificationIcon(t)} {t}
                    </button>
                  ))}
                </div>

                {/* 알림 목록 */}
                <ul className="text-sm space-y-1 max-h-52 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <li className="text-gray-500 text-center py-2">새 알림이 없습니다</li>
                  ) : (
                    notifications.slice(0, 10).map(alert => (
                      <li
                        key={alert.notification_id}
                        className={`border-b pb-1 px-1 cursor-pointer ${!alert.is_read ? 'bg-blue-50' : ''}`}
                        onClick={async () => {
                          await markAsRead(alert.notification_id);
                          if (alert.channel === 'invitation' && alert.related_id) {
                            navigate(`/invite/${alert.related_id}`);
                          } else if (alert.channel === 'task' && alert.related_id) {
                            navigate(`/main/${alert.related_id}`);
                          } else if (alert.channel === 'project' && alert.related_id) {
                            navigate(`/projects/${alert.related_id}`);
                          }
                        }}
                      >
                        <div className="flex justify-between">
                          <span>{getNotificationIcon(alert.type)} {alert.message}</span>
                          {!alert.is_read && <span className="text-xs text-blue-500 ml-2">●</span>}
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(alert.created_at).toLocaleString()}
                        </div>
                      </li>
                    ))
                  )}
                </ul>

                {/* 더보기 */}
                <div className="text-right mt-2">
                  <button
                    onClick={loadMore}
                    className="text-blue-600 underline text-sm"
                  >
                    더보기
                  </button>
                </div>

                <div className="text-right mt-2">
                  <span
                    className="text-blue-600 underline text-sm cursor-pointer"
                    onClick={() => navigate('/notifications')}
                  >
                    전체보기
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 설정 버튼 */}
        <SettingsButton />


        {/* 사용자 정보 및 로그아웃 버튼 */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">{user?.name ? `${user.name}님` : user?.email}</span>
          {/* <button 
            onClick={handleLogout}
            className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
          >
            로그아웃
          </button> */}
                    <button
            onClick={handleLogout}
            className="
              group flex items-center justify-start w-11 h-11 bg-red-600 
              rounded-full cursor-pointer relative overflow-hidden 
              transition-all duration-200 shadow-lg hover:w-32 
              hover:rounded-lg active:translate-x-1 active:translate-y-1
            "
          >
            <div className="flex items-center justify-center w-full transition-all duration-300 group-hover:justify-start group-hover:px-3">
              <svg
                className="w-4 h-4"
                viewBox="0 0 512 512"
                fill="white"
              >
                <path d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM160 96L96 96c-17.7 0-32 14.3-32 32l0 256c0 17.7 14.3 32 32 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c-53 0-96-43-96-96L0 128C0 75 43 32 96 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32z" />
              </svg>
            </div>
            <div className="
              absolute right-5 transform translate-x-full opacity-0 
              text-white text-lg font-semibold transition-all duration-300 
              group-hover:translate-x-0 group-hover:opacity-100
            ">
              Logout
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}

export default TopBar;
