import React, { useState, useEffect, useRef } from 'react';

function NotificationToast({ user, newNotification, onNotificationClick }) {
  const [toasts, setToasts] = useState([]);
  const processedNotifications = useRef(new Set());
  
  console.log('🎯 NotificationToast 초기화 - user:', user);

  // 새 알림 prop을 감지해서 토스트 추가
  useEffect(() => {
    console.log('🍞 NotificationToast - newNotification prop 변경:', newNotification);
    if (!newNotification) return;
    
    // 중복 처리 방지
    const notificationKey = `${newNotification.type}_${newNotification.notification_id || newNotification.id || Date.now()}`;
    console.log('🔑 NotificationToast - notificationKey:', notificationKey);
    if (processedNotifications.current.has(notificationKey)) {
      console.log('⚠️ NotificationToast - 중복 알림 무시');
      return;
    }
    processedNotifications.current.add(notificationKey);
    
    console.log('🎯 새 알림 토스트 생성:', newNotification);
    
    const toast = {
      id: notificationKey,
      title: newNotification.title || '새로운 알림',
      message: newNotification.message,
      type: newNotification.type,
      timestamp: Date.now(),
      notification: newNotification
    };
    
    setToasts(prev => [toast, ...prev].slice(0, 5)); // 최대 5개까지만 표시
    
    // 5초 후 자동 제거
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toast.id));
      processedNotifications.current.delete(notificationKey);
    }, 5000);
    
  }, [newNotification]);

  const handleToastClick = (toast) => {
    // 토스트 제거
    setToasts(prev => prev.filter(t => t.id !== toast.id));
    
    // 부모 컴포넌트의 클릭 핸들러 호출
    if (onNotificationClick) {
      onNotificationClick(toast.notification);
    }
  };

  const removeToast = (toastId) => {
    setToasts(prev => prev.filter(t => t.id !== toastId));
  };

  const getToastIcon = (type) => {
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
      'welcome_message': '👋',
      'account_verification': '✅',
      'system': '⚙️',
    };
    return iconMap[type] || '🔔';
  };

  const getToastColor = (type) => {
    const colorMap = {
      // Task 관련
      'task_assigned': 'bg-blue-500',
      'task_completed': 'bg-green-500',
      'task_deadline': 'bg-red-500',
      'task_priority_changed': 'bg-orange-500',
      'task_status_changed': 'bg-indigo-500',
      'task_due_date_changed': 'bg-pink-500',
      'task_overdue': 'bg-red-600',
      
      // Comment 관련
      'comment_created': 'bg-blue-500',
      'comment_mention': 'bg-purple-500',
      
      // Project 관련
      'project_invited': 'bg-yellow-500',
      'project_updated': 'bg-blue-500',
      'project_deleted': 'bg-red-500',
      'project_member_role_changed': 'bg-purple-500',
      
      // Invitation 관련
      'invitation_accepted': 'bg-green-500',
      'invitation_declined': 'bg-red-500',
      
      // Workspace 관련
      'workspace_created': 'bg-cyan-500',
      'workspace_updated': 'bg-cyan-500',
      'workspace_deleted': 'bg-red-500',
      'workspace_shared': 'bg-teal-500',
      
      // Deadline 관련
      'deadline_approaching': 'bg-orange-500',
      'deadline_1day': 'bg-red-600',
      'deadline_3days': 'bg-yellow-500',
      'deadline_7days': 'bg-green-500',
      
      // System 관련
      'welcome_message': 'bg-green-500',
      'account_verification': 'bg-green-500',
      'system': 'bg-gray-600',
    };
    return colorMap[type] || 'bg-gray-600';
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`w-80 ${getToastColor(toast.type)} text-white rounded-lg shadow-lg transform transition-all duration-300 ease-in-out hover:scale-105 cursor-pointer`}
          onClick={() => handleToastClick(toast)}
        >
          <div className="p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <span className="text-xl">{getToastIcon(toast.type)}</span>
              </div>
              <div className="ml-3 w-0 flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium">
                      {toast.title}
                    </p>
                    <p className="mt-1 text-sm opacity-90 line-clamp-2">
                      {toast.message}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeToast(toast.id);
                    }}
                    className="ml-2 text-white hover:text-gray-200 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="mt-2 text-xs opacity-75">
                  {new Date(toast.timestamp).toLocaleTimeString('ko-KR')}
                </div>
              </div>
            </div>
            
            {/* 진행 바 */}
            <div className="mt-3 w-full bg-white bg-opacity-30 rounded-full h-1">
              <div 
                className="bg-white h-1 rounded-full animate-shrink"
                style={{
                  animation: 'shrink 5s linear forwards'
                }}
              ></div>
            </div>
          </div>
        </div>
      ))}
      
      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
        .animate-shrink {
          animation: shrink 5s linear forwards;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}

export default NotificationToast;