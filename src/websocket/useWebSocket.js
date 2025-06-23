import { useEffect, useCallback, useRef, useState } from 'react';
import { useWebSocket } from './WebSocketContext';
import { MESSAGE_TYPES, createRoomId } from './messageTypes';

/**
 * 실시간 Task 업데이트를 위한 훅
 */
export const useTaskRealtime = (projectId, onTaskUpdate) => {
  const { addMessageHandler, joinRoom, leaveRoom, isConnected } = useWebSocket();
  const onTaskUpdateRef = useRef(onTaskUpdate);
  
  // 콜백 함수 업데이트
  useEffect(() => {
    onTaskUpdateRef.current = onTaskUpdate;
  }, [onTaskUpdate]);

  useEffect(() => {
    if (!isConnected || !projectId) return;

    // 프로젝트 룸 참여
    const projectRoom = createRoomId.project(projectId);
    joinRoom(projectRoom);

    // Task 관련 메시지 핸들러 등록
    const taskHandlers = [
      addMessageHandler(MESSAGE_TYPES.TASK_CREATED, (message) => {
        if (onTaskUpdateRef.current && message.data.project_id === projectId) {
          onTaskUpdateRef.current({
            type: 'created',
            task: message.data
          });
        }
      }),
      
      addMessageHandler(MESSAGE_TYPES.TASK_UPDATED, (message) => {
        if (onTaskUpdateRef.current && message.data.project_id === projectId) {
          onTaskUpdateRef.current({
            type: 'updated',
            task: message.data
          });
        }
      }),
      
      addMessageHandler(MESSAGE_TYPES.TASK_DELETED, (message) => {
        if (onTaskUpdateRef.current && message.data.project_id === projectId) {
          onTaskUpdateRef.current({
            type: 'deleted',
            task: message.data
          });
        }
      }),
      
      addMessageHandler(MESSAGE_TYPES.TASK_STATUS_CHANGED, (message) => {
        if (onTaskUpdateRef.current && message.data.project_id === projectId) {
          onTaskUpdateRef.current({
            type: 'status_changed',
            task: message.data
          });
        }
      })
    ];

    // 정리 함수
    return () => {
      leaveRoom(projectRoom);
      taskHandlers.forEach(cleanup => cleanup());
    };
  }, [isConnected, projectId, addMessageHandler, joinRoom, leaveRoom]);
};

/**
 * 실시간 Comment 업데이트를 위한 훅
 */
export const useCommentRealtime = (projectId, onCommentUpdate) => {
  const { addMessageHandler, joinRoom, leaveRoom, isConnected } = useWebSocket();
  const onCommentUpdateRef = useRef(onCommentUpdate);
  
  useEffect(() => {
    onCommentUpdateRef.current = onCommentUpdate;
  }, [onCommentUpdate]);

  useEffect(() => {
    if (!isConnected || !projectId) return;

    const projectRoom = createRoomId.project(projectId);
    joinRoom(projectRoom);

    const commentHandlers = [
      addMessageHandler(MESSAGE_TYPES.COMMENT_CREATED, (message) => {
        if (onCommentUpdateRef.current && message.data.project_id === projectId) {
          onCommentUpdateRef.current({
            type: 'created',
            comment: message.data
          });
        }
      }),
      
      addMessageHandler(MESSAGE_TYPES.COMMENT_UPDATED, (message) => {
        if (onCommentUpdateRef.current && message.data.project_id === projectId) {
          onCommentUpdateRef.current({
            type: 'updated',
            comment: message.data
          });
        }
      }),
      
      addMessageHandler(MESSAGE_TYPES.COMMENT_DELETED, (message) => {
        if (onCommentUpdateRef.current && message.data.project_id === projectId) {
          onCommentUpdateRef.current({
            type: 'deleted',
            comment: message.data
          });
        }
      }),
      
      addMessageHandler(MESSAGE_TYPES.COMMENT_MENTION, (message) => {
        if (onCommentUpdateRef.current) {
          onCommentUpdateRef.current({
            type: 'mention',
            comment: message.data
          });
        }
      })
    ];

    return () => {
      leaveRoom(projectRoom);
      commentHandlers.forEach(cleanup => cleanup());
    };
  }, [isConnected, projectId, addMessageHandler, joinRoom, leaveRoom]);
};

/**
 * 실시간 알림을 위한 훅
 */
export const useNotificationRealtime = (userId, onNotification) => {
  const { addMessageHandler, joinRoom, leaveRoom, isConnected } = useWebSocket();
  const onNotificationRef = useRef(onNotification);
  
  useEffect(() => {
    onNotificationRef.current = onNotification;
  }, [onNotification]);

  useEffect(() => {
    if (!isConnected || !userId) return;

    const userRoom = createRoomId.user(userId);
    joinRoom(userRoom);

    const notificationHandlers = [
      // 일반 알림
      addMessageHandler(MESSAGE_TYPES.NOTIFICATION_NEW, (message) => {
        console.log('📨 NOTIFICATION_NEW 수신:', message);
        if (onNotificationRef.current) {
          onNotificationRef.current({
            type: 'new',
            notification: message.data
          });
        }
      }),
      
      // Task 할당 알림
      addMessageHandler(MESSAGE_TYPES.TASK_ASSIGNED, (message) => {
        console.log('📋 TASK_ASSIGNED 수신:', message);
        if (onNotificationRef.current) {
          onNotificationRef.current({
            type: 'task_assigned',
            data: message.data
          });
        }
      }),
      
      // 프로젝트 멤버 추가 알림
      addMessageHandler(MESSAGE_TYPES.PROJECT_MEMBER_ADDED, (message) => {
        console.log('👥 PROJECT_MEMBER_ADDED 수신:', message);
        if (onNotificationRef.current) {
          onNotificationRef.current({
            type: 'project_member_added',
            data: message.data
          });
        }
      }),
      
      // 댓글 멘션 알림
      addMessageHandler(MESSAGE_TYPES.COMMENT_MENTION, (message) => {
        console.log('💬 COMMENT_MENTION 수신:', message);
        if (onNotificationRef.current) {
          onNotificationRef.current({
            type: 'comment_mention',
            data: message.data
          });
        }
      }),
      
      // 댓글 생성 알림 (담당자에게)
      addMessageHandler(MESSAGE_TYPES.COMMENT_CREATED, (message) => {
        console.log('💬 COMMENT_CREATED 수신:', message);
        // 댓글 생성은 일반적으로 Task 담당자에게 알림이 가므로 알림으로 처리
        if (onNotificationRef.current) {
          onNotificationRef.current({
            type: 'comment_created',
            data: message.data
          });
        }
      })
    ];

    return () => {
      leaveRoom(userRoom);
      notificationHandlers.forEach(cleanup => cleanup());
    };
  }, [isConnected, userId, addMessageHandler, joinRoom, leaveRoom]);
};

/**
 * 타이핑 상태를 위한 훅
 */
export const useTypingIndicator = (projectId) => {
  const { sendTyping, sendStopTyping, typingUsers } = useWebSocket();
  const typingTimeoutRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);

  const startTyping = useCallback(() => {
    if (!projectId) return;

    if (!isTyping) {
      sendTyping(projectId);
      setIsTyping(true);
    }

    // 기존 타이머 클리어
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // 3초 후 타이핑 중지
    typingTimeoutRef.current = setTimeout(() => {
      sendStopTyping(projectId);
      setIsTyping(false);
    }, 3000);
  }, [projectId, sendTyping, sendStopTyping, isTyping]);

  const stopTyping = useCallback(() => {
    if (!projectId || !isTyping) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    sendStopTyping(projectId);
    setIsTyping(false);
  }, [projectId, sendStopTyping, isTyping]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTyping && projectId) {
        sendStopTyping(projectId);
      }
    };
  }, [isTyping, projectId, sendStopTyping]);

  return {
    startTyping,
    stopTyping,
    isTyping,
    typingUsers: typingUsers[projectId] || []
  };
};

/**
 * 온라인 사용자 상태를 위한 훅
 */
export const useOnlineStatus = () => {
  const { onlineUsers, isConnected } = useWebSocket();
  
  const isUserOnline = useCallback((userId) => {
    return onlineUsers.includes(userId);
  }, [onlineUsers]);

  return {
    onlineUsers,
    isUserOnline,
    isConnected
  };
};

/**
 * WebSocket 연결 상태를 위한 훅
 */
export const useConnectionStatus = () => {
  const { 
    connectionStatus, 
    connectionError, 
    isConnected, 
    isConnecting, 
    isReconnecting,
    connect,
    disconnect
  } = useWebSocket();

  return {
    connectionStatus,
    connectionError,
    isConnected,
    isConnecting,
    isReconnecting,
    connect,
    disconnect
  };
};

/**
 * 프로젝트별 실시간 업데이트를 위한 종합 훅
 */
export const useProjectRealtime = (projectId, handlers = {}) => {
  const { 
    onTaskUpdate, 
    onCommentUpdate, 
    onMemberUpdate, 
    onProjectUpdate 
  } = handlers;

  // Task 업데이트
  useTaskRealtime(projectId, onTaskUpdate);
  
  // Comment 업데이트
  useCommentRealtime(projectId, onCommentUpdate);
  
  // 멤버 및 프로젝트 업데이트
  const { addMessageHandler, joinRoom, leaveRoom, isConnected } = useWebSocket();
  
  useEffect(() => {
    if (!isConnected || !projectId) return;

    const projectRoom = createRoomId.project(projectId);
    joinRoom(projectRoom);

    const projectHandlers = [];

    // 멤버 업데이트 핸들러
    if (onMemberUpdate) {
      projectHandlers.push(
        addMessageHandler(MESSAGE_TYPES.PROJECT_MEMBER_ADDED, (message) => {
          if (message.data.project_id === projectId) {
            onMemberUpdate({
              type: 'member_added',
              data: message.data
            });
          }
        }),
        
        addMessageHandler(MESSAGE_TYPES.PROJECT_MEMBER_REMOVED, (message) => {
          if (message.data.project_id === projectId) {
            onMemberUpdate({
              type: 'member_removed',
              data: message.data
            });
          }
        })
      );
    }

    // 프로젝트 업데이트 핸들러
    if (onProjectUpdate) {
      projectHandlers.push(
        addMessageHandler(MESSAGE_TYPES.PROJECT_UPDATED, (message) => {
          if (message.data.project_id === projectId) {
            onProjectUpdate({
              type: 'updated',
              data: message.data
            });
          }
        }),
        
        addMessageHandler(MESSAGE_TYPES.PROJECT_DELETED, (message) => {
          if (message.data.project_id === projectId) {
            onProjectUpdate({
              type: 'deleted',
              data: message.data
            });
          }
        })
      );
    }

    return () => {
      leaveRoom(projectRoom);
      projectHandlers.forEach(cleanup => cleanup());
    };
  }, [isConnected, projectId, onMemberUpdate, onProjectUpdate, addMessageHandler, joinRoom, leaveRoom]);
};

/**
 * 사용 예시를 위한 커스텀 훅
 */
export const useRealtimeExample = () => {
  const [tasks, setTasks] = useState([]);
  const [comments, setComments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  
  const projectId = 1; // 예시 프로젝트 ID
  const userId = 1; // 예시 사용자 ID

  // Task 실시간 업데이트
  useTaskRealtime(projectId, (update) => {
    switch (update.type) {
      case 'created':
        setTasks(prev => [...prev, update.task]);
        break;
      case 'updated':
        setTasks(prev => prev.map(task => 
          task.task_id === update.task.task_id ? { ...task, ...update.task } : task
        ));
        break;
      case 'deleted':
        setTasks(prev => prev.filter(task => task.task_id !== update.task.task_id));
        break;
      case 'status_changed':
        setTasks(prev => prev.map(task => 
          task.task_id === update.task.task_id ? { ...task, status: update.task.status } : task
        ));
        break;
    }
  });

  // Comment 실시간 업데이트
  useCommentRealtime(projectId, (update) => {
    switch (update.type) {
      case 'created':
        setComments(prev => [...prev, update.comment]);
        break;
      case 'updated':
        setComments(prev => prev.map(comment => 
          comment.comment_id === update.comment.comment_id ? { ...comment, ...update.comment } : comment
        ));
        break;
      case 'deleted':
        setComments(prev => prev.filter(comment => comment.comment_id !== update.comment.comment_id));
        break;
      case 'mention':
        // 멘션 알림 처리
        console.log('You were mentioned in a comment:', update.comment);
        break;
    }
  });

  // 알림 실시간 업데이트
  useNotificationRealtime(userId, (update) => {
    switch (update.type) {
      case 'new':
        setNotifications(prev => [update.notification, ...prev]);
        break;
      case 'task_assigned':
        console.log('New task assigned:', update.data);
        break;
      case 'project_member_added':
        console.log('Added to project:', update.data);
        break;
    }
  });

  return {
    tasks,
    comments,
    notifications
  };
};

export default {
  useTaskRealtime,
  useCommentRealtime,
  useNotificationRealtime,
  useTypingIndicator,
  useOnlineStatus,
  useConnectionStatus,
  useProjectRealtime,
  useRealtimeExample
};