# WebSocket 실시간 통신 모듈

이 모듈은 알림, 멘션, 댓글, Task 등의 실시간 기능을 제공하기 위한 WebSocket 통신 레이어입니다.

## 주요 기능

- 🔄 **실시간 Task 업데이트**: Task 생성, 수정, 삭제, 상태 변경
- 💬 **실시간 댓글**: 댓글 생성, 수정, 삭제, 멘션 알림
- 🔔 **실시간 알림**: 개인 알림, Task 할당, 프로젝트 초대
- 👥 **사용자 상태**: 온라인/오프라인, 타이핑 상태
- 🏠 **룸 기반 통신**: 사용자, 프로젝트, 워크스페이스별 그룹
- 🔁 **자동 재연결**: 연결 끊김 시 자동 재연결 시도
- 💓 **Heartbeat**: 연결 상태 유지

## 설치 및 설정

### 1. WebSocket Provider 설정

앱의 최상위 레벨에서 WebSocketProvider로 감싸주세요:

```jsx
// App.jsx
import React from 'react';
import { WebSocketProvider } from './websocket';
import MainApp from './MainApp';

function App() {
  return (
    <WebSocketProvider>
      <MainApp />
    </WebSocketProvider>
  );
}

export default App;
```

### 2. 환경 변수 설정

```bash
# .env
REACT_APP_WS_BASE_URL=ws://localhost:8005
```

## 사용법

### 기본 WebSocket 연결

```jsx
import { useWebSocket } from './websocket';

function MyComponent() {
  const { 
    isConnected, 
    connectionStatus, 
    connect, 
    disconnect 
  } = useWebSocket();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      connect(token);
    }
  }, [connect]);

  return (
    <div>
      <p>연결 상태: {connectionStatus}</p>
      {isConnected ? '🟢 연결됨' : '🔴 연결 안됨'}
    </div>
  );
}
```

### Task 실시간 업데이트

```jsx
import { useTaskRealtime } from './websocket';

function TaskBoard({ projectId }) {
  const [tasks, setTasks] = useState([]);

  useTaskRealtime(projectId, (update) => {
    switch (update.type) {
      case 'created':
        setTasks(prev => [...prev, update.task]);
        break;
      case 'updated':
        setTasks(prev => prev.map(task => 
          task.task_id === update.task.task_id 
            ? { ...task, ...update.task } 
            : task
        ));
        break;
      case 'deleted':
        setTasks(prev => prev.filter(task => 
          task.task_id !== update.task.task_id
        ));
        break;
      case 'status_changed':
        setTasks(prev => prev.map(task => 
          task.task_id === update.task.task_id 
            ? { ...task, status: update.task.status } 
            : task
        ));
        break;
    }
  });

  return (
    <div>
      {tasks.map(task => (
        <TaskCard key={task.task_id} task={task} />
      ))}
    </div>
  );
}
```

### 댓글 실시간 업데이트

```jsx
import { useCommentRealtime } from './websocket';

function CommentSection({ projectId }) {
  const [comments, setComments] = useState([]);

  useCommentRealtime(projectId, (update) => {
    switch (update.type) {
      case 'created':
        setComments(prev => [...prev, update.comment]);
        break;
      case 'updated':
        setComments(prev => prev.map(comment => 
          comment.comment_id === update.comment.comment_id 
            ? { ...comment, ...update.comment } 
            : comment
        ));
        break;
      case 'deleted':
        setComments(prev => prev.filter(comment => 
          comment.comment_id !== update.comment.comment_id
        ));
        break;
      case 'mention':
        // 멘션 알림 처리
        alert(`${update.comment.author_name}님이 회원님을 멘션했습니다!`);
        break;
    }
  });

  return (
    <div>
      {comments.map(comment => (
        <CommentItem key={comment.comment_id} comment={comment} />
      ))}
    </div>
  );
}
```

### 실시간 알림

```jsx
import { useNotificationRealtime } from './websocket';

function NotificationCenter({ userId }) {
  const [notifications, setNotifications] = useState([]);

  useNotificationRealtime(userId, (update) => {
    switch (update.type) {
      case 'new':
        setNotifications(prev => [update.notification, ...prev]);
        // 브라우저 알림 표시됨
        break;
      case 'task_assigned':
        alert(`새로운 Task가 할당되었습니다: ${update.data.title}`);
        break;
      case 'project_member_added':
        alert(`프로젝트에 추가되었습니다: ${update.data.name}`);
        break;
    }
  });

  return (
    <div>
      <h3>알림 ({notifications.length})</h3>
      {notifications.map(notification => (
        <NotificationItem key={notification.notification_id} notification={notification} />
      ))}
    </div>
  );
}
```

### 타이핑 상태

```jsx
import { useTypingIndicator } from './websocket';

function CommentInput({ projectId }) {
  const { startTyping, stopTyping, typingUsers } = useTypingIndicator(projectId);
  const [content, setContent] = useState('');

  const handleInputChange = (e) => {
    setContent(e.target.value);
    
    if (e.target.value.trim()) {
      startTyping();
    } else {
      stopTyping();
    }
  };

  const handleSubmit = () => {
    stopTyping();
    // 댓글 전송 로직
  };

  return (
    <div>
      <textarea
        value={content}
        onChange={handleInputChange}
        onBlur={stopTyping}
        placeholder="댓글을 입력하세요..."
      />
      
      {typingUsers.length > 0 && (
        <p>{typingUsers.length}명이 입력 중...</p>
      )}
      
      <button onClick={handleSubmit}>전송</button>
    </div>
  );
}
```

### 온라인 사용자 상태

```jsx
import { useOnlineStatus } from './websocket';

function UserList({ users }) {
  const { isUserOnline } = useOnlineStatus();

  return (
    <div>
      {users.map(user => (
        <div key={user.id} className="user-item">
          <span className={`status ${isUserOnline(user.id) ? 'online' : 'offline'}`}>
            {isUserOnline(user.id) ? '🟢' : '⚪'}
          </span>
          {user.name}
        </div>
      ))}
    </div>
  );
}
```

### 프로젝트 종합 실시간 업데이트

```jsx
import { useProjectRealtime } from './websocket';

function ProjectDashboard({ projectId }) {
  const [projectData, setProjectData] = useState({
    tasks: [],
    comments: [],
    members: []
  });

  useProjectRealtime(projectId, {
    onTaskUpdate: (update) => {
      // Task 업데이트 처리
      console.log('Task updated:', update);
    },
    
    onCommentUpdate: (update) => {
      // 댓글 업데이트 처리
      console.log('Comment updated:', update);
    },
    
    onMemberUpdate: (update) => {
      // 멤버 업데이트 처리
      if (update.type === 'member_added') {
        setProjectData(prev => ({
          ...prev,
          members: [...prev.members, update.data]
        }));
      }
    },
    
    onProjectUpdate: (update) => {
      // 프로젝트 업데이트 처리
      console.log('Project updated:', update);
    }
  });

  return (
    <div>
      {/* 프로젝트 대시보드 컨텐츠 */}
    </div>
  );
}
```

## 메시지 타입

### Task 관련
- `TASK_CREATED`: 새 Task 생성
- `TASK_UPDATED`: Task 정보 수정
- `TASK_DELETED`: Task 삭제
- `TASK_STATUS_CHANGED`: Task 상태 변경
- `TASK_ASSIGNED`: Task 할당

### Comment 관련
- `COMMENT_CREATED`: 새 댓글 생성
- `COMMENT_UPDATED`: 댓글 수정
- `COMMENT_DELETED`: 댓글 삭제
- `COMMENT_MENTION`: 댓글에서 멘션

### Project 관련
- `PROJECT_MEMBER_ADDED`: 프로젝트 멤버 추가
- `PROJECT_MEMBER_REMOVED`: 프로젝트 멤버 제거
- `PROJECT_UPDATED`: 프로젝트 정보 업데이트

### 알림 관련
- `NOTIFICATION_NEW`: 새 알림
- `NOTIFICATION_READ`: 알림 읽음
- `NOTIFICATION_DELETED`: 알림 삭제

### 사용자 상태
- `USER_ONLINE`: 사용자 온라인
- `USER_OFFLINE`: 사용자 오프라인
- `USER_TYPING`: 사용자 타이핑 중
- `USER_STOP_TYPING`: 사용자 타이핑 중지

## 룸(Room) 시스템

### 룸 타입
- `user:{userId}`: 개인 알림 룸
- `project:{projectId}`: 프로젝트 룸
- `workspace:{workspaceId}`: 워크스페이스 룸
- `task:{taskId}`: 특정 Task 룸

### 자동 룸 참여
- 로그인 시 개인 알림 룸에 자동 참여
- 프로젝트 훅 사용 시 해당 프로젝트 룸에 자동 참여
- 컴포넌트 언마운트 시 자동으로 룸에서 나감

## 에러 처리

```jsx
import { useConnectionStatus } from './websocket';

function ConnectionStatus() {
  const { 
    connectionStatus, 
    connectionError, 
    isConnecting, 
    isReconnecting 
  } = useConnectionStatus();

  if (connectionError) {
    return <div className="error">연결 오류: {connectionError}</div>;
  }

  if (isReconnecting) {
    return <div className="warning">재연결 중...</div>;
  }

  if (isConnecting) {
    return <div className="info">연결 중...</div>;
  }

  return <div className="success">연결됨</div>;
}
```

## 브라우저 알림

브라우저 알림을 사용하려면 권한을 요청해야 합니다:

```jsx
import { useWebSocket } from './websocket';

function App() {
  const { requestNotificationPermission } = useWebSocket();

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  return <div>...</div>;
}
```

## 성능 고려사항

- 컴포넌트가 언마운트될 때 자동으로 메시지 핸들러가 정리됩니다
- 같은 룸에 여러 컴포넌트가 참여해도 중복 연결은 생성되지 않습니다
- Heartbeat를 통해 연결 상태를 유지하고 끊어진 연결을 감지합니다
- 최대 5회까지 자동 재연결을 시도합니다

## 백엔드 연동

백엔드에서 실시간 이벤트를 발행하려면:

```python
# 백엔드 예시
from backend.websocket.events import event_emitter

# Task 생성 이벤트 발행
await event_emitter.emit_task_created(
    task_id=task.id,
    project_id=task.project_id,
    title=task.title,
    created_by=user.id,
    created_by_name=user.name
)

# 댓글 생성 이벤트 발행
await event_emitter.emit_comment_created(
    comment_id=comment.id,
    task_id=comment.task_id,
    project_id=comment.project_id,
    content=comment.content,
    author_id=user.id,
    author_name=user.name,
    mentions=[1, 2, 3]  # 멘션된 사용자 ID 목록
)
```

## 문제 해결

### 연결이 안 될 때
1. 백엔드 서버가 실행 중인지 확인
2. JWT 토큰이 유효한지 확인
3. 브라우저 개발자 도구에서 WebSocket 연결 오류 확인

### 메시지를 받지 못할 때
1. 해당 룸에 참여했는지 확인
2. 메시지 핸들러가 올바르게 등록되었는지 확인
3. 백엔드에서 올바른 룸으로 메시지를 전송하는지 확인

### 성능 문제
1. 불필요한 메시지 핸들러가 등록되지 않았는지 확인
2. 컴포넌트 언마운트 시 정리가 제대로 되는지 확인
3. 너무 많은 실시간 업데이트가 발생하지 않는지 확인