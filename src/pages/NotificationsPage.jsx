import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useNotifications from '../hooks/useNotifications';

function getNotificationIcon(type) {
  switch(type) {
    case 'comment': return '💬';
    case 'deadline': return '⏰';
    case 'project': return '📁';
    default: return '🔔';
  }
}

function NotificationsPage({ user }) {
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

  const [markAllLoading, setMarkAllLoading] = useState(false);

  const handleNotificationClick = async (notification) => {
    // 알림을 읽음 처리
    await markAsRead(notification.notification_id);

    // channel과 type에 따라 페이지 이동
    if (notification.channel === 'task') {
      navigate(`/tasks/${notification.type}`);
    } else if (notification.channel === 'project') {
      navigate(`/projects/${notification.type}`);
    }
  };

  const handleMarkAllAsRead = async () => {
    setMarkAllLoading(true);
    try {
      // 읽지 않은 알림들을 모두 읽음 처리
      const unreadNotifications = notifications.filter(n => !n.is_read);
      await Promise.all(unreadNotifications.map(n => markAsRead(n.notification_id)));
      refresh();
    } catch (error) {
      console.error('모든 알림 읽음 처리 실패:', error);
    } finally {
      setMarkAllLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">알림</h1>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-500">
            읽지 않은 알림: {unreadCount}개
          </span>
          <button
            onClick={handleMarkAllAsRead}
            disabled={markAllLoading || unreadCount === 0}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {markAllLoading ? '처리중...' : '모두 읽음'}
          </button>
          <button
            onClick={refresh}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            새로고침
          </button>
        </div>
      </div>

      {/* 필터 탭 */}
      <div className="flex space-x-4 mb-6 border-b">
        {[
          { key: 'all', label: '전체', icon: '🔔' },
          { key: 'comment', label: '댓글', icon: '💬' },
          { key: 'deadline', label: '마감일', icon: '⏰' },
          { key: 'project', label: '프로젝트', icon: '📁' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 font-medium ${
              filter === tab.key 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* 알림 목록 */}
      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🔔</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">알림이 없습니다</h3>
            <p className="text-gray-500">새로운 알림이 있으면 여기에 표시됩니다.</p>
          </div>
        ) : (
          notifications.map(notification => (
            <div
              key={notification.notification_id}
              className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                !notification.is_read 
                  ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' 
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex items-start space-x-3">
                <div className="text-2xl">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <p className={`text-sm ${!notification.is_read ? 'font-semibold' : 'font-medium'}`}>
                      {notification.message}
                    </p>
                    {!notification.is_read && (
                      <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full ml-2 mt-1"></span>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    <span>{notification.channel}</span>
                    <span>•</span>
                    <span>{new Date(notification.created_at).toLocaleString('ko-KR')}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 더보기 버튼 */}
      {notifications.length > 0 && (
        <div className="text-center mt-8">
          <button
            onClick={loadMore}
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded hover:bg-gray-300"
          >
            더 많은 알림 보기
          </button>
        </div>
      )}
    </div>
  );
}

export default NotificationsPage;