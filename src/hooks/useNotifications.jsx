import { useState, useEffect } from 'react';
import { notificationAPI } from '../api/api';
import { io } from 'socket.io-client';

const API_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8005';

export default function useNotifications(user) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('all');

  const fetchNotifications = async (pageNum = 1, append = false) => {
    try {
      const res = await notificationAPI.list({ page: pageNum });
      const newItems = res.data.items || res.data;
      
      setNotifications(prev =>
        append ? [...prev, ...newItems] : newItems
      );
      
      setUnreadCount(newItems.filter(n => !n.is_read).length);
    } catch (err) {
      console.error('알림 불러오기 실패:', err);
    }
  };

  const markAsRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(prev - 1, 0));
    } catch (err) {
      console.error('읽음 처리 실패:', err);
    }
  };

  const loadMore = async () => {
    const nextPage = page + 1;
    await fetchNotifications(nextPage, true);
    setPage(nextPage);
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      
      // WebSocket 연결 (선택적)
      const socket = io(API_URL, {
        auth: { token: localStorage.getItem('access_token') }
      });

      socket.on('new_notification', () => {
        fetchNotifications();
      });

      return () => socket.disconnect();
    }
  }, [user]);

  const filteredNotifications = notifications.filter(n =>
    filter === 'all' ? true : n.type === filter
  );

  return {
    notifications: filteredNotifications,
    unreadCount,
    markAsRead,
    refresh: () => fetchNotifications(1, false),
    loadMore,
    filter,
    setFilter
  };
}