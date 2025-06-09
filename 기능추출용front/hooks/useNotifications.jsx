import { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

const API_URL = 'http://localhost:3000'; // 실제 API 서버 주소로 수정

export default function useNotifications(user) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('all');
  const token = localStorage.getItem("access_token"); // 또는 "accessToken" 등 저장된 키 이름

  const fetchNotifications = async (pageNum = 1, append = false) => {
  try {
    const res = await axios.get(`http://localhost:8005/api/v1/notifications?page=${pageNum}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const newItems = res.data.items;
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
      await axios.patch(`http://localhost:8005/api/v1/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => prev - 1);
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
      const socket = io(API_URL, {
        auth: { token: localStorage.getItem('token') }
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

