import { useState, useEffect, useCallback, useRef } from 'react';
import { notificationAPI } from '../api/api';
import { useNotificationRealtime } from '../websocket';
import { MESSAGE_TYPES } from '../websocket/messageTypes';

export default function useNotifications(user) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [latestNotification, setLatestNotification] = useState(null);
  
  // 중복 요청 방지를 위한 ref
  const isFetchingRef = useRef(false);

  const fetchNotifications = useCallback(async (pageNum = 1, append = false) => {
    if (isFetchingRef.current) return;
    
    try {
      isFetchingRef.current = true;
      setLoading(true);
      setError(null);
      
      const res = await notificationAPI.list({ page: pageNum, per_page: 10 });
      const newItems = res.data.items || res.data;
      const total = res.data.total || newItems.length;
      
      setNotifications(prev => {
        if (append) {
          // 중복 제거
          const existingIds = new Set(prev.map(n => n.notification_id));
          const uniqueNewItems = newItems.filter(n => !existingIds.has(n.notification_id));
          return [...prev, ...uniqueNewItems];
        } else {
          return newItems;
        }
      });
      
      // 읽지 않은 알림 개수 업데이트
      const unreadNotifications = newItems.filter(n => !n.is_read);
      if (!append) {
        setUnreadCount(unreadNotifications.length);
      }
      
      // 더 가져올 데이터가 있는지 확인
      setHasMore(newItems.length === 10 && (pageNum * 10) < total);
      
    } catch (err) {
      console.error('알림 불러오기 실패:', err);
      setError('알림을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await notificationAPI.getUnreadCount();
      setUnreadCount(res.data.unread_count);
    } catch (err) {
      console.error('읽지 않은 알림 개수 조회 실패:', err);
    }
  }, []);

  const markAsRead = useCallback(async (notificationId) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      
      setNotifications(prev =>
        prev.map(n => 
          n.notification_id === notificationId 
            ? { ...n, is_read: true } 
            : n
        )
      );
      
      setUnreadCount(prev => Math.max(prev - 1, 0));
      
    } catch (err) {
      console.error('읽음 처리 실패:', err);
      throw err;
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const res = await notificationAPI.markAllAsRead();
      
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );
      
      setUnreadCount(0);
      
      return res.data.updated_count;
      
    } catch (err) {
      console.error('모든 알림 읽음 처리 실패:', err);
      throw err;
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await notificationAPI.delete(notificationId);
      
      setNotifications(prev => {
        const notification = prev.find(n => n.notification_id === notificationId);
        const remaining = prev.filter(n => n.notification_id !== notificationId);
        
        // 읽지 않은 알림이었다면 카운트 감소
        if (notification && !notification.is_read) {
          setUnreadCount(count => Math.max(count - 1, 0));
        }
        
        return remaining;
      });
      
    } catch (err) {
      console.error('알림 삭제 실패:', err);
      throw err;
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    
    const nextPage = page + 1;
    await fetchNotifications(nextPage, true);
    setPage(nextPage);
  }, [hasMore, loading, page, fetchNotifications]);

  const refresh = useCallback(() => {
    setPage(1);
    setHasMore(true);
    fetchNotifications(1, false);
  }, [fetchNotifications]);

  // 실시간 알림 처리
  const userId = user?.user_id || user?.id || localStorage.getItem('userId');
  
  console.log('🔔 useNotifications 초기화 - userId:', userId, 'user:', user);
  
  useNotificationRealtime(userId, useCallback((update) => {
    console.log('🔔 실시간 알림 수신:', update);
    
    switch (update.type) {
      case 'new':
        // 새로운 일반 알림 추가
        setNotifications(prev => [update.notification, ...prev]);
        setUnreadCount(prev => prev + 1);
        setLatestNotification(update.notification); // 최신 알림 설정
        // 즉시 리셋하여 중복 처리 방지
        setTimeout(() => setLatestNotification(null), 100);
        
        // 브라우저 알림 표시
        if (Notification.permission === 'granted') {
          new Notification(update.notification.title || '새로운 알림', {
            body: update.notification.message,
            icon: '/favicon.ico',
            tag: `notification_${update.notification.notification_id}`
          });
        }
        break;
        
      case 'task_assigned':
        // Task 할당 알림 처리
        console.log('📋 Task 할당 알림:', update.data);
        
        // 알림 목록에 추가 (가상 알림 생성)
        const taskNotification = {
          notification_id: Date.now(), // 임시 ID
          type: 'task_assigned',
          title: '새로운 작업이 할당되었습니다',
          message: `작업 '${update.data.title}'이 할당되었습니다.`,
          is_read: false,
          created_at: new Date().toISOString(),
          related_id: update.data.task_id
        };
        
        setNotifications(prev => [taskNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
        setLatestNotification(taskNotification); // 최신 알림 설정
        // 즉시 리셋하여 중복 처리 방지
        setTimeout(() => setLatestNotification(null), 100);
        
        // 브라우저 알림 표시
        if (Notification.permission === 'granted') {
          new Notification('새로운 작업 할당', {
            body: `작업 '${update.data.title}'이 할당되었습니다.`,
            icon: '/favicon.ico',
            tag: `task_${update.data.task_id}`
          });
        }
        break;
        
      case 'project_member_added':
        // 프로젝트 멤버 추가 알림 처리
        console.log('👥 프로젝트 멤버 추가 알림:', update.data);
        
        const projectNotification = {
          notification_id: Date.now() + 1, // 임시 ID
          type: 'project_member_added',
          title: '프로젝트에 추가되었습니다',
          message: `'${update.data.name}' 프로젝트 멤버로 추가되었습니다.`,
          is_read: false,
          created_at: new Date().toISOString(),
          related_id: update.data.project_id
        };
        
        setNotifications(prev => [projectNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
        setLatestNotification(projectNotification); // 최신 알림 설정
        // 즉시 리셋하여 중복 처리 방지
        setTimeout(() => setLatestNotification(null), 100);
        
        // 브라우저 알림 표시
        if (Notification.permission === 'granted') {
          new Notification('프로젝트 멤버 추가', {
            body: projectNotification.message,
            icon: '/favicon.ico',
            tag: `project_${update.data.project_id}`
          });
        }
        break;
        
      case 'comment_mention':
        // 댓글 멘션 알림 처리
        console.log('💬 댓글 멘션 알림:', update.data);
        
        const mentionNotification = {
          notification_id: Date.now() + 2, // 임시 ID
          type: 'comment_mention',
          title: '댓글에서 멘션되었습니다',
          message: `${update.data.author_name}님이 댓글에서 회원님을 멘션했습니다.`,
          is_read: false,
          created_at: new Date().toISOString(),
          related_id: update.data.task_id
        };
        
        setNotifications(prev => [mentionNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
        setLatestNotification(mentionNotification); // 최신 알림 설정
        // 즉시 리셋하여 중복 처리 방지
        setTimeout(() => setLatestNotification(null), 100);
        
        // 브라우저 알림 표시
        if (Notification.permission === 'granted') {
          new Notification('댓글 멘션', {
            body: mentionNotification.message,
            icon: '/favicon.ico',
            tag: `mention_${update.data.comment_id}`
          });
        }
        break;
        
      case 'comment_created':
        // 댓글 생성 알림 처리 (Task 담당자에게)
        console.log('💬 댓글 생성 알림:', update.data);
        
        const commentNotification = {
          notification_id: Date.now() + 3, // 임시 ID
          type: 'comment_created',
          title: '새로운 댓글이 작성되었습니다',
          message: `${update.data.author_name}님이 댓글을 작성했습니다.`,
          is_read: false,
          created_at: new Date().toISOString(),
          related_id: update.data.task_id
        };
        
        setNotifications(prev => [commentNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
        setLatestNotification(commentNotification); // 최신 알림 설정
        // 즉시 리셋하여 중복 처리 방지
        setTimeout(() => setLatestNotification(null), 100);
        
        // 브라우저 알림 표시
        if (Notification.permission === 'granted') {
          new Notification('새로운 댓글', {
            body: commentNotification.message,
            icon: '/favicon.ico',
            tag: `comment_${update.data.comment_id}`
          });
        }
        break;
        
      default:
        console.log('🔕 알 수 없는 알림 타입:', update);
    }
  }, []));

  // 컴포넌트 마운트 시 초기 데이터 로드
  useEffect(() => {
    if (user && userId) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [user, userId, fetchNotifications, fetchUnreadCount]);

  // 필터링된 알림 목록
  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.is_read;
    if (filter === 'project') {
      return n.type === 'project' || n.type === 'project_invited' || 
             n.type === 'project_member_added' || n.type === 'project_updated' ||
             n.type === 'project_deleted' || n.type === 'project_member_role_changed' ||
             n.type === 'invitation_accepted' || n.type === 'invitation_declined';
    }
    if (filter === 'task') {
      return n.type === 'task_assigned' || n.type === 'task_updated' || 
             n.type === 'task_completed' || n.type === 'task_deadline' ||
             n.type === 'task_priority_changed' || n.type === 'task_status_changed' ||
             n.type === 'task_due_date_changed' || n.type === 'task_overdue' ||
             n.type === 'deadline_approaching' || n.type === 'deadline_1day' ||
             n.type === 'deadline_3days' || n.type === 'deadline_7days';
    }
    if (filter === 'comment') {
      return n.type === 'comment_created' || n.type === 'comment_mention';
    }
    if (filter === 'workspace') {
      return n.type === 'workspace_created' || n.type === 'workspace_updated' ||
             n.type === 'workspace_deleted' || n.type === 'workspace_shared';
    }
    if (filter === 'system') {
      return n.type === 'system' || n.type === 'welcome_message' ||
             n.type === 'account_verification';
    }
    return n.type === filter;
  });

  // 브라우저 알림 권한 요청
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  }, []);

  return {
    // 데이터
    notifications: filteredNotifications,
    unreadCount,
    loading,
    error,
    hasMore,
    latestNotification, // 최신 알림 추가
    
    // 액션
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
    loadMore,
    requestNotificationPermission,
    
    // 필터
    filter,
    setFilter,
    
    // 유틸리티
    fetchUnreadCount
  };
}