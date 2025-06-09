import React, { useState, useRef, useEffect } from "react";
import logo from "./planora.png";
import { useLocation, useNavigate } from "react-router-dom";
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
         <div className="relative" ref={alertRef}>
          <button
            className="bg-yellow-100 text-white px-4 py-2 rounded relative"
            onClick={() => {
              setShowAlerts(prev => !prev);
              if (!showAlerts) refresh();
            }}
          >
            🔔
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                {unreadCount}
              </span>
            )}
          </button>

          {showAlerts && (
            <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded shadow z-50">
              <div className="p-3">
                <h4 className="font-semibold text-sm mb-2">알림</h4>

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
                        key={alert.id}
                        className={`border-b pb-1 px-1 cursor-pointer ${!alert.is_read ? 'bg-blue-50' : ''}`}
                        onClick={() => markAsRead(alert.id)}
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
        <button className="bg-yellow-100 text-white px-4 py-2 rounded">⚙️</button>

        {/* 사용자 정보 및 로그아웃 버튼 */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">{user?.name ? `${user.name}님` : user?.email}</span>
          <button 
            onClick={onLogout}
            className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
          >
            로그아웃
          </button>
        </div>
      </div>
    </header>
  );
}

export default TopBar;
