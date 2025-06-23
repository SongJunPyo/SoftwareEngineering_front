import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationAPI } from '../api/api';
import { useNotificationRealtime } from '../websocket';

function NotificationBell({ user, className = "" }) {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const bellRef = useRef(null);
  
  const userId = user?.user_id || user?.id;

  // 읽지 않은 알림 개수 조회
  const fetchUnreadCount = async () => {
    try {
      const res = await notificationAPI.getUnreadCount();
      setUnreadCount(res.data.unread_count);
    } catch (error) {
      console.error('읽지 않은 알림 개수 조회 실패:', error);
    }
  };

  // 최근 알림 목록 조회 (드롭다운용)
  const fetchRecentNotifications = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      const res = await notificationAPI.list({ page: 1, per_page: 5 });
      setRecentNotifications(res.data.items || res.data);
    } catch (error) {
      console.error('최근 알림 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 실시간 알림 수신
  useNotificationRealtime(userId, (update) => {
    switch (update.type) {
      case 'new':
        setUnreadCount(prev => prev + 1);
        setRecentNotifications(prev => [update.notification, ...prev.slice(0, 4)]);
        
        // 벨 애니메이션
        if (bellRef.current) {
          bellRef.current.classList.add('animate-bounce');
          setTimeout(() => {
            if (bellRef.current) {
              bellRef.current.classList.remove('animate-bounce');
            }
          }, 1000);
        }
        break;
      case 'read':
        setUnreadCount(prev => Math.max(prev - 1, 0));
        break;
    }
  });

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    if (userId) {
      fetchUnreadCount();
    }
  }, [userId]);

  // 드롭다운 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBellClick = () => {
    if (!showDropdown) {
      fetchRecentNotifications();
    }
    setShowDropdown(!showDropdown);
  };

  const handleNotificationClick = async (notification) => {
    setShowDropdown(false);
    
    // 읽지 않은 알림이면 읽음 처리
    if (!notification.is_read) {
      try {
        await notificationAPI.markAsRead(notification.notification_id);
        setUnreadCount(prev => Math.max(prev - 1, 0));
        setRecentNotifications(prev => 
          prev.map(n => 
            n.notification_id === notification.notification_id 
              ? { ...n, is_read: true } 
              : n
          )
        );
      } catch (error) {
        console.error('알림 읽음 처리 실패:', error);
      }
    }

    // 페이지 이동
    if (notification.related_id) {
      switch (notification.type) {
        case 'task_assigned':
        case 'task_updated':
        case 'task_completed':
        case 'task_deadline':
          navigate(`/workspace/board?task=${notification.related_id}`);
          break;
        case 'comment_created':
        case 'comment_mention':
          navigate(`/workspace/board?task=${notification.related_id}#comments`);
          break;
        case 'project_invited':
        case 'project_member_added':
        case 'project_updated':
          navigate(`/workspace/board?project=${notification.related_id}`);
          break;
        default:
          navigate('/notifications');
      }
    } else {
      navigate('/notifications');
    }
  };

  const getNotificationIcon = (type) => {
    const iconMap = {
      'task_assigned': '📋',
      'task_updated': '🔄',
      'task_completed': '✅',
      'task_deadline': '⏰',
      'comment_created': '💬',
      'comment_mention': '👤',
      'project_invited': '🎯',
      'project_member_added': '👥',
      'project_updated': '📁',
    };
    return iconMap[type] || '🔔';
  };

  const truncateMessage = (message, maxLength = 50) => {
    return message.length > maxLength ? message.substring(0, maxLength) + '...' : message;
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* 알림 벨 */}
      <button
        ref={bellRef}
        onClick={handleBellClick}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg transition-colors"
        title={`읽지 않은 알림 ${unreadCount}개`}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        
        {/* 알림 개수 배지 */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* 드롭다운 */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">알림</h3>
              <button
                onClick={() => {
                  setShowDropdown(false);
                  navigate('/notifications');
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                모두 보기
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">로딩 중...</p>
              </div>
            ) : recentNotifications.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-gray-500">새로운 알림이 없습니다.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {recentNotifications.map((notification) => (
                  <div
                    key={notification.notification_id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 cursor-pointer transition-colors ${
                      !notification.is_read 
                        ? 'bg-blue-50 hover:bg-blue-100' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!notification.is_read ? 'font-semibold' : 'font-medium'}`}>
                          {truncateMessage(notification.message)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(notification.created_at).toLocaleString('ko-KR')}
                        </p>
                      </div>
                      {!notification.is_read && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full mt-1"></span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {recentNotifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setShowDropdown(false);
                  navigate('/notifications');
                }}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                모든 알림 보기
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;