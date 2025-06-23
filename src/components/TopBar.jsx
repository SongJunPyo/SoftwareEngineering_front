import React, { useState, useRef, useEffect } from "react";
import logo from "./planora.png";
import { useLocation, useNavigate } from "react-router-dom";
import { AlertButton, SettingsButton } from "./Button";
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

function TopBar({ user, onLogout, onNewNotification }) {
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
     setFilter,
     latestNotification
   } = useNotifications(user);

  // TopBar 초기 필터 설정 (전체 탭 제거로 인해 읽지않음으로 시작)
  useEffect(() => {
    setFilter('unread');
  }, [setFilter]);

  // 새 알림이 있을 때 상위 컴포넌트에 전달
  useEffect(() => {
    console.log('📡 TopBar - latestNotification 변경:', latestNotification);
    if (latestNotification && onNewNotification) {
      console.log('📤 TopBar - 상위 컴포넌트로 알림 전달');
      onNewNotification(latestNotification);
    }
  }, [latestNotification, onNewNotification]);

  // 알림 클릭 시 해당 페이지로 이동
  const handleNotificationClick = (notification) => {
    const { type, related_id, channel } = notification;
    
    // Task 관련 알림
    if (type.startsWith('task_') && related_id) {
      navigate(`/main/${related_id}`);
    }
    // Comment 관련 알림 
    else if (type.startsWith('comment_') && related_id) {
      navigate(`/main/${related_id}`);
    }
    // Project 관련 알림
    else if (type.startsWith('project_') && related_id) {
      navigate(`/board`); // 프로젝트 보드로 이동
    }
    // Workspace 관련 알림
    else if (type.startsWith('workspace_')) {
      navigate(`/main`);
    }
    // 초대 관련
    else if (channel === 'invitation' && related_id) {
      navigate(`/invite/${related_id}`);
    }
    // 기타 task 관련
    else if (channel === 'task' && related_id) {
      navigate(`/main/${related_id}`);
    }
    // 기타 project 관련
    else if (channel === 'project' && related_id) {
      navigate(`/board`);
    }
    // 기본값
    else {
      navigate('/notifications');
    }
  };

  // 알림 타입별 기본 제목
  const getDefaultTitle = (type) => {
    const titleMap = {
      // Task 관련
      'task_assigned': '새로운 작업 할당',
      'task_updated': '작업 업데이트',
      'task_completed': '작업 완료',
      'task_deadline': '마감일 알림',
      'task_priority_changed': '작업 우선순위 변경',
      'task_status_changed': '작업 상태 변경',
      'task_due_date_changed': '작업 마감일 변경',
      'task_overdue': '작업 기한 초과',
      
      // Comment 관련
      'comment_created': '새로운 댓글',
      'comment_mention': '댓글 멘션',
      
      // Project 관련
      'project_invited': '프로젝트 초대',
      'project_member_added': '프로젝트 멤버 추가',
      'project_updated': '프로젝트 업데이트',
      'project_deleted': '프로젝트 삭제',
      'project_member_role_changed': '프로젝트 역할 변경',
      
      // Invitation 관련
      'invitation_accepted': '초대 수락',
      'invitation_declined': '초대 거절',
      
      // Workspace 관련
      'workspace_created': '워크스페이스 생성',
      'workspace_updated': '워크스페이스 업데이트',
      'workspace_deleted': '워크스페이스 삭제',
      'workspace_shared': '워크스페이스 공유',
      
      // Deadline 관련
      'deadline_approaching': '마감일 임박',
      'deadline_1day': '마감일 1일 전',
      'deadline_3days': '마감일 3일 전',
      'deadline_7days': '마감일 7일 전',
      
      // System 관련
      'welcome_message': '환영합니다',
      'account_verification': '계정 인증 완료',
      'system': '시스템 알림'
    };
    return titleMap[type] || '알림';
  };

  // 상대적 시간 표시
  const formatRelativeTime = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return '방금 전';
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}시간 전`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}일 전`;
    
    return date.toLocaleDateString('ko-KR');
  };

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
          <AlertButton 
            onClick={() => setShowAlerts((prev) => !prev)} 
            unreadCount={unreadCount}
          />

          {showAlerts && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded shadow z-50">
              <div className="p-3">
                {/* 헤더 */}
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold text-sm">알림</h4>
                  <span
                    className="text-blue-600 underline text-xs cursor-pointer hover:text-blue-800"
                    onClick={() => navigate('/notifications')}
                  >
                    전체보기
                  </span>
                </div>
                
                {/* 필터 버튼 (전체 제거) */}
                <div className="flex justify-between mb-3 text-xs">
                  {[
                    { key: 'unread', label: '읽지않음', icon: '🔴' },
                    { key: 'task', label: '작업', icon: '📋' },
                    { key: 'comment', label: '댓글', icon: '💬' },
                    { key: 'project', label: '프로젝트', icon: '📁' }
                  ].map(({ key, label, icon }) => (
                    <button
                      key={key}
                      onClick={() => setFilter(key)}
                      className={`px-2 py-1 rounded text-xs ${
                        filter === key 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {icon} {label}
                    </button>
                  ))}
                </div>

                {/* 알림 목록 */}
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {notifications.length === 0 ? (
                    <div className="text-gray-500 text-center py-3 text-xs">
                      새 알림이 없습니다
                    </div>
                  ) : (
                    notifications.slice(0, 8).map(alert => (
                      <div
                        key={alert.notification_id}
                        className={`p-2 rounded border cursor-pointer transition-all hover:shadow-sm ${getNotificationColor(alert.type, alert.is_read)}`}
                        onClick={async () => {
                          await markAsRead(alert.notification_id);
                          handleNotificationClick(alert);
                          setShowAlerts(false); // 드롭다운 닫기
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-2 flex-1">
                            <span className="text-sm flex-shrink-0">
                              {getNotificationIcon(alert.type)}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-900 truncate">
                                {alert.title || getDefaultTitle(alert.type)}
                              </p>
                              <p className="text-xs text-gray-600 mt-0.5 truncate">
                                {alert.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {formatRelativeTime(alert.created_at)}
                              </p>
                            </div>
                          </div>
                          {!alert.is_read && (
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0 mt-1"></span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
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
