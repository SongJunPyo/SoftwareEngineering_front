import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { 
  MESSAGE_TYPES, 
  CONNECTION_STATUS, 
  createMessage, 
  validateMessage, 
  isErrorMessage,
  isSystemMessage,
  shouldShowNotification,
  shouldUpdateUI
} from './messageTypes';

const WebSocketContext = createContext();

// WebSocket 연결 설정
const WS_BASE_URL = process.env.REACT_APP_WS_BASE_URL || 'ws://localhost:8005';
const WS_ENDPOINT = '/ws/connect';
const RECONNECT_INTERVAL = 3000; // 3초
const MAX_RECONNECT_ATTEMPTS = 5;
const HEARTBEAT_INTERVAL = 25000; // 25초

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider = ({ children }) => {
  const [connectionStatus, setConnectionStatus] = useState(CONNECTION_STATUS.DISCONNECTED);
  const [lastMessage, setLastMessage] = useState(null);
  const [connectionError, setConnectionError] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState({}); // {projectId: [userIds]}
  
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const messageHandlersRef = useRef(new Map());
  const userTokenRef = useRef(null);
  const isConnectingRef = useRef(false);

  // 메시지 핸들러 등록
  const addMessageHandler = useCallback((type, handler) => {
    if (!messageHandlersRef.current.has(type)) {
      messageHandlersRef.current.set(type, []);
    }
    messageHandlersRef.current.get(type).push(handler);
    
    // 정리 함수 반환
    return () => {
      const handlers = messageHandlersRef.current.get(type);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index !== -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }, []);

  // 메시지 핸들러 실행
  const executeMessageHandlers = useCallback((message) => {
    const handlers = messageHandlersRef.current.get(message.type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          console.error(`Error in message handler for type ${message.type}:`, error);
        }
      });
    }
  }, []);

  // WebSocket 연결
  const connect = useCallback((token) => {
    if (isConnectingRef.current || (wsRef.current && wsRef.current.readyState === WebSocket.OPEN)) {
      return;
    }

    if (!token) {
      console.error('WebSocket connection requires token');
      return;
    }

    isConnectingRef.current = true;
    userTokenRef.current = token;
    setConnectionStatus(CONNECTION_STATUS.CONNECTING);
    setConnectionError(null);

    try {
      const wsUrl = `${WS_BASE_URL}${WS_ENDPOINT}?token=${encodeURIComponent(token)}`;
      console.log('Connecting to WebSocket:', wsUrl);
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('✅ WebSocket 연결 성공');
        console.log('🔗 연결 상태:', CONNECTION_STATUS.CONNECTED);
        setConnectionStatus(CONNECTION_STATUS.CONNECTED);
        setConnectionError(null);
        reconnectAttemptsRef.current = 0;
        isConnectingRef.current = false;
        
        // Heartbeat 시작
        startHeartbeat();
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('📨 WebSocket 메시지 수신:', message.type, message);
          
          if (!validateMessage(message)) {
            console.warn('⚠️ 잘못된 메시지 형식:', message);
            return;
          }

          setLastMessage(message);
          
          // 특별한 메시지 타입 처리
          if (message.type === MESSAGE_TYPES.HEARTBEAT) {
            if (message.message === "ping") {
              // 서버에서 ping을 보냈으면 pong으로 응답
              sendMessage(createMessage.heartbeat());
            }
            return;
          }

          if (message.type === MESSAGE_TYPES.USER_ONLINE) {
            setOnlineUsers(prev => {
              if (!prev.includes(message.data.user_id)) {
                return [...prev, message.data.user_id];
              }
              return prev;
            });
          } else if (message.type === MESSAGE_TYPES.USER_OFFLINE) {
            setOnlineUsers(prev => prev.filter(id => id !== message.data.user_id));
          } else if (message.type === MESSAGE_TYPES.USER_TYPING) {
            setTypingUsers(prev => {
              const projectId = message.data.project_id;
              const userId = message.data.user_id;
              return {
                ...prev,
                [projectId]: [...(prev[projectId] || []), userId].filter((id, index, arr) => arr.indexOf(id) === index)
              };
            });
          } else if (message.type === MESSAGE_TYPES.USER_STOP_TYPING) {
            setTypingUsers(prev => {
              const projectId = message.data.project_id;
              const userId = message.data.user_id;
              return {
                ...prev,
                [projectId]: (prev[projectId] || []).filter(id => id !== userId)
              };
            });
          }

          // 에러 메시지 처리
          if (isErrorMessage(message)) {
            console.error('WebSocket error message:', message.data.message);
            setConnectionError(message.data.message);
          }

          // 시스템 메시지가 아닌 경우에만 핸들러 실행
          if (!isSystemMessage(message)) {
            executeMessageHandlers(message);
          }

          // 알림 표시가 필요한 메시지
          if (shouldShowNotification(message)) {
            showNotification(message);
          }

        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionError('WebSocket 연결 오류가 발생했습니다.');
        setConnectionStatus(CONNECTION_STATUS.ERROR);
        isConnectingRef.current = false;
      };

      wsRef.current.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        setConnectionStatus(CONNECTION_STATUS.DISCONNECTED);
        isConnectingRef.current = false;
        stopHeartbeat();
        
        // 정상적인 종료가 아닌 경우 재연결 시도
        if (event.code !== 1000 && event.code !== 1001) {
          scheduleReconnect();
        }
      };

    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setConnectionError('WebSocket 연결을 생성할 수 없습니다.');
      setConnectionStatus(CONNECTION_STATUS.ERROR);
      isConnectingRef.current = false;
    }
  }, [executeMessageHandlers]);

  // WebSocket 연결 해제
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    stopHeartbeat();
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }
    
    setConnectionStatus(CONNECTION_STATUS.DISCONNECTED);
    isConnectingRef.current = false;
    userTokenRef.current = null;
  }, []);

  // 재연결 스케줄링
  const scheduleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      console.error('Max reconnect attempts reached');
      setConnectionError('최대 재연결 시도 횟수에 도달했습니다.');
      return;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    setConnectionStatus(CONNECTION_STATUS.RECONNECTING);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectAttemptsRef.current++;
      console.log(`Reconnecting... Attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS}`);
      
      if (userTokenRef.current) {
        connect(userTokenRef.current);
      }
    }, RECONNECT_INTERVAL);
  }, [connect]);

  // Heartbeat 시작
  const startHeartbeat = useCallback(() => {
    stopHeartbeat(); // 기존 heartbeat 정리
    
    heartbeatIntervalRef.current = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        sendMessage(createMessage.heartbeat());
      }
    }, HEARTBEAT_INTERVAL);
  }, []);

  // Heartbeat 중지
  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  // 메시지 전송
  const sendMessage = useCallback((message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify(message));
        return true;
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
        return false;
      }
    } else {
      console.warn('WebSocket is not connected. Cannot send message:', message);
      return false;
    }
  }, []);

  // 룸 참여
  const joinRoom = useCallback((roomId) => {
    return sendMessage(createMessage.joinRoom(roomId));
  }, [sendMessage]);

  // 룸 나가기
  const leaveRoom = useCallback((roomId) => {
    return sendMessage(createMessage.leaveRoom(roomId));
  }, [sendMessage]);

  // 타이핑 상태 전송
  const sendTyping = useCallback((projectId) => {
    return sendMessage(createMessage.typing(projectId));
  }, [sendMessage]);

  const sendStopTyping = useCallback((projectId) => {
    return sendMessage(createMessage.stopTyping(projectId));
  }, [sendMessage]);

  // 알림 표시
  const showNotification = useCallback((message) => {
    // 브라우저 알림 권한 확인 및 표시
    if (Notification.permission === 'granted') {
      const title = message.data.title || '새 알림';
      const body = message.data.message || message.data.content || '새로운 업데이트가 있습니다.';
      
      const notification = new Notification(title, {
        body: body,
        icon: '/favicon.ico',
        tag: message.type + '_' + (message.data.id || Date.now())
      });

      // 3초 후 자동 닫기
      setTimeout(() => notification.close(), 3000);
    }
  }, []);

  // 알림 권한 요청
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  }, []);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // 토큰 변경 감지
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token && token !== userTokenRef.current) {
      if (connectionStatus === CONNECTION_STATUS.DISCONNECTED) {
        connect(token);
      }
    } else if (!token && connectionStatus !== CONNECTION_STATUS.DISCONNECTED) {
      disconnect();
    }
  }, [connect, disconnect, connectionStatus]);

  const contextValue = {
    // 상태
    connectionStatus,
    lastMessage,
    connectionError,
    onlineUsers,
    typingUsers,
    
    // 연결 관리
    connect,
    disconnect,
    
    // 메시지 처리
    sendMessage,
    addMessageHandler,
    
    // 룸 관리
    joinRoom,
    leaveRoom,
    
    // 사용자 상태
    sendTyping,
    sendStopTyping,
    
    // 알림
    requestNotificationPermission,
    
    // 연결 상태 확인
    isConnected: connectionStatus === CONNECTION_STATUS.CONNECTED,
    isConnecting: connectionStatus === CONNECTION_STATUS.CONNECTING,
    isReconnecting: connectionStatus === CONNECTION_STATUS.RECONNECTING
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};

export default WebSocketProvider;