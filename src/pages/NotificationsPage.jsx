import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useNotifications from '../hooks/useNotifications';

function getNotificationIcon(type) {
  const iconMap = {
    // Task 관련
    'task_assigned': '📋',
    'task_updated': '🔄',
    'task_completed': '✅',
    'task_deadline': '⏰',
    'task_priority_changed': '⭐',
    'task_status_changed': '🔀',
    'task_due_date_changed': '📅',
    'task_overdue': '🚨',
    
    // Comment 관련
    'comment_created': '💬',
    'comment_mention': '👤',
    
    // Project 관련
    'project_invited': '🎯',
    'project_member_added': '👥',
    'project_updated': '📁',
    'project_deleted': '🗑️',
    'project_member_role_changed': '👑',
    
    // Invitation 관련
    'invitation_accepted': '✅',
    'invitation_declined': '❌',
    
    // Workspace 관련
    'workspace_created': '🏢',
    'workspace_updated': '🔧',
    'workspace_deleted': '🗑️',
    'workspace_shared': '🤝',
    
    // Deadline 관련
    'deadline_approaching': '⏰',
    'deadline_1day': '🔴',
    'deadline_3days': '🟡',
    'deadline_7days': '🟢',
    
    // System 관련
    'system': '⚙️',
    'welcome_message': '👋',
    'account_verification': '✅',
    
    // 기존 호환성
    'comment': '💬',
    'deadline': '⏰',
    'project': '📁'
  };
  
  return iconMap[type] || '🔔';
}

function getNotificationColor(type, isRead) {
  const colorMap = {
    // Task 관련
    'task_assigned': isRead ? 'border-blue-200 bg-blue-50' : 'border-blue-300 bg-blue-100',
    'task_completed': isRead ? 'border-green-200 bg-green-50' : 'border-green-300 bg-green-100',
    'task_deadline': isRead ? 'border-red-200 bg-red-50' : 'border-red-300 bg-red-100',
    'task_priority_changed': isRead ? 'border-orange-200 bg-orange-50' : 'border-orange-300 bg-orange-100',
    'task_status_changed': isRead ? 'border-indigo-200 bg-indigo-50' : 'border-indigo-300 bg-indigo-100',
    'task_due_date_changed': isRead ? 'border-pink-200 bg-pink-50' : 'border-pink-300 bg-pink-100',
    'task_overdue': isRead ? 'border-red-200 bg-red-50' : 'border-red-400 bg-red-100',
    
    // Comment 관련
    'comment_mention': isRead ? 'border-purple-200 bg-purple-50' : 'border-purple-300 bg-purple-100',
    'comment_created': isRead ? 'border-blue-200 bg-blue-50' : 'border-blue-300 bg-blue-100',
    
    // Project 관련
    'project_invited': isRead ? 'border-yellow-200 bg-yellow-50' : 'border-yellow-300 bg-yellow-100',
    'project_updated': isRead ? 'border-blue-200 bg-blue-50' : 'border-blue-300 bg-blue-100',
    'project_deleted': isRead ? 'border-red-200 bg-red-50' : 'border-red-300 bg-red-100',
    'project_member_role_changed': isRead ? 'border-purple-200 bg-purple-50' : 'border-purple-300 bg-purple-100',
    
    // Invitation 관련
    'invitation_accepted': isRead ? 'border-green-200 bg-green-50' : 'border-green-300 bg-green-100',
    'invitation_declined': isRead ? 'border-red-200 bg-red-50' : 'border-red-300 bg-red-100',
    
    // Workspace 관련
    'workspace_created': isRead ? 'border-cyan-200 bg-cyan-50' : 'border-cyan-300 bg-cyan-100',
    'workspace_updated': isRead ? 'border-cyan-200 bg-cyan-50' : 'border-cyan-300 bg-cyan-100',
    'workspace_deleted': isRead ? 'border-red-200 bg-red-50' : 'border-red-300 bg-red-100',
    
    // Deadline 관련
    'deadline_approaching': isRead ? 'border-orange-200 bg-orange-50' : 'border-orange-300 bg-orange-100',
    'deadline_1day': isRead ? 'border-red-200 bg-red-50' : 'border-red-400 bg-red-100',
    'deadline_3days': isRead ? 'border-yellow-200 bg-yellow-50' : 'border-yellow-300 bg-yellow-100',
    'deadline_7days': isRead ? 'border-green-200 bg-green-50' : 'border-green-300 bg-green-100',
    
    // System 관련
    'welcome_message': isRead ? 'border-green-200 bg-green-50' : 'border-green-300 bg-green-100',
    'account_verification': isRead ? 'border-green-200 bg-green-50' : 'border-green-300 bg-green-100',
    'system': isRead ? 'border-gray-200 bg-gray-50' : 'border-gray-300 bg-gray-100',
  };
  
  const defaultColor = isRead ? 'border-gray-200 bg-white' : 'border-blue-200 bg-blue-50';
  return colorMap[type] || defaultColor;
}

function NotificationsPage({ user }) {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    loading,
    error,
    hasMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
    loadMore,
    requestNotificationPermission,
    filter,
    setFilter
  } = useNotifications(user);

  const [markAllLoading, setMarkAllLoading] = useState(false);
  const [deletingIds, setDeletingIds] = useState(new Set());

  const handleNotificationClick = async (notification) => {
    try {
      // 알림을 읽음 처리
      if (!notification.is_read) {
        await markAsRead(notification.notification_id);
      }

      // related_id와 type에 따라 페이지 이동
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
            // 기본적으로 메인 페이지로 이동
            navigate('/main');
        }
      } else {
        navigate('/main');
      }
    } catch (error) {
      console.error('알림 클릭 처리 실패:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;
    
    setMarkAllLoading(true);
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('모든 알림 읽음 처리 실패:', error);
      alert('모든 알림을 읽음 처리하는데 실패했습니다.');
    } finally {
      setMarkAllLoading(false);
    }
  };

  const handleDeleteNotification = async (e, notificationId) => {
    e.stopPropagation(); // 클릭 이벤트 전파 방지
    
    if (deletingIds.has(notificationId)) return;
    
    if (!window.confirm('이 알림을 삭제하시겠습니까?')) return;
    
    setDeletingIds(prev => new Set(prev).add(notificationId));
    try {
      await deleteNotification(notificationId);
    } catch (error) {
      console.error('알림 삭제 실패:', error);
      alert('알림 삭제에 실패했습니다.');
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
    }
  };

  // 컴포넌트 마운트 시 브라우저 알림 권한 요청
  React.useEffect(() => {
    requestNotificationPermission();
  }, [requestNotificationPermission]);

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

      {/* 에러 메시지 */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
          <button 
            onClick={refresh}
            className="ml-2 text-red-800 underline hover:no-underline"
          >
            다시 시도
          </button>
        </div>
      )}

      {/* 필터 탭 */}
      <div className="flex space-x-4 mb-6 border-b overflow-x-auto">
        {[
          { key: 'all', label: '전체', icon: '🔔' },
          { key: 'unread', label: '읽지 않음', icon: '🔵' },
          { key: 'task', label: '작업', icon: '📋' },
          { key: 'comment', label: '댓글', icon: '💬' },
          { key: 'project', label: '프로젝트', icon: '📁' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 font-medium whitespace-nowrap ${
              filter === tab.key 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.icon} {tab.label}
            {tab.key === 'unread' && unreadCount > 0 && (
              <span className="ml-1 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 알림 목록 */}
      <div className="space-y-4">
        {loading && notifications.length === 0 ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">알림을 불러오는 중...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🔔</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === 'unread' ? '읽지 않은 알림이 없습니다' : '알림이 없습니다'}
            </h3>
            <p className="text-gray-500">
              {filter === 'unread' 
                ? '모든 알림을 읽으셨습니다!' 
                : '새로운 알림이 있으면 여기에 표시됩니다.'
              }
            </p>
          </div>
        ) : (
          notifications.map(notification => (
            <div
              key={notification.notification_id}
              className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md ${
                getNotificationColor(notification.type, notification.is_read)
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex items-start space-x-3">
                <div className="text-2xl flex-shrink-0">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className={`text-sm ${!notification.is_read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                        {notification.message}
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {notification.channel}
                        </span>
                        <span>•</span>
                        <span>{new Date(notification.created_at).toLocaleString('ko-KR')}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      {!notification.is_read && (
                        <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full"></span>
                      )}
                      <button
                        onClick={(e) => handleDeleteNotification(e, notification.notification_id)}
                        disabled={deletingIds.has(notification.notification_id)}
                        className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded"
                        title="알림 삭제"
                      >
                        {deletingIds.has(notification.notification_id) ? (
                          <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-red-600 rounded-full"></div>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 더보기 버튼 */}
      {notifications.length > 0 && hasMore && (
        <div className="text-center mt-8">
          <button
            onClick={loadMore}
            disabled={loading}
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto"
          >
            {loading ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-gray-500 border-t-transparent rounded-full"></div>
                <span>로딩 중...</span>
              </>
            ) : (
              <span>더 많은 알림 보기</span>
            )}
          </button>
        </div>
      )}
      
      {notifications.length > 0 && !hasMore && (
        <div className="text-center mt-8 text-gray-500">
          모든 알림을 불러왔습니다.
        </div>
      )}
    </div>
  );
}

export default NotificationsPage;