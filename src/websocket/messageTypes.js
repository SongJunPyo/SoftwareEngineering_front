/**
 * WebSocket 메시지 타입 상수 정의
 * 백엔드의 MessageType과 동일하게 유지
 */

export const MESSAGE_TYPES = {
  // 시스템 메시지
  CONNECTION_ESTABLISHED: "connection_established",
  ROOM_JOINED: "room_joined",
  ROOM_LEFT: "room_left",
  ERROR: "error",
  HEARTBEAT: "heartbeat",
  
  // 알림 관련
  NOTIFICATION_NEW: "notification_new",
  NOTIFICATION_READ: "notification_read",
  NOTIFICATION_DELETED: "notification_deleted",
  
  // Task 관련
  TASK_CREATED: "task_created",
  TASK_UPDATED: "task_updated",
  TASK_DELETED: "task_deleted",
  TASK_STATUS_CHANGED: "task_status_changed",
  TASK_ASSIGNED: "task_assigned",
  TASK_UNASSIGNED: "task_unassigned",
  TASK_COMMENT_ADDED: "task_comment_added",
  
  // Comment 관련
  COMMENT_CREATED: "comment_created",
  COMMENT_UPDATED: "comment_updated",
  COMMENT_DELETED: "comment_deleted",
  COMMENT_MENTION: "comment_mention",
  
  // Project 관련
  PROJECT_CREATED: "project_created",
  PROJECT_UPDATED: "project_updated",
  PROJECT_DELETED: "project_deleted",
  PROJECT_MEMBER_ADDED: "project_member_added",
  PROJECT_MEMBER_REMOVED: "project_member_removed",
  PROJECT_MEMBER_ROLE_CHANGED: "project_member_role_changed",
  PROJECT_INVITATION_SENT: "project_invitation_sent",
  
  // Workspace 관련
  WORKSPACE_CREATED: "workspace_created",
  WORKSPACE_UPDATED: "workspace_updated",
  WORKSPACE_DELETED: "workspace_deleted",
  WORKSPACE_ORDER_CHANGED: "workspace_order_changed",
  
  // 사용자 상태
  USER_ONLINE: "user_online",
  USER_OFFLINE: "user_offline",
  USER_TYPING: "user_typing",
  USER_STOP_TYPING: "user_stop_typing"
};

export const ROOM_TYPES = {
  USER: "user",
  PROJECT: "project", 
  WORKSPACE: "workspace",
  TASK: "task"
};

/**
 * 룸 ID 생성 헬퍼 함수들
 */
export const createRoomId = {
  user: (userId) => `${ROOM_TYPES.USER}:${userId}`,
  project: (projectId) => `${ROOM_TYPES.PROJECT}:${projectId}`,
  workspace: (workspaceId) => `${ROOM_TYPES.WORKSPACE}:${workspaceId}`,
  task: (taskId) => `${ROOM_TYPES.TASK}:${taskId}`
};

/**
 * WebSocket 연결 상태
 */
export const CONNECTION_STATUS = {
  CONNECTING: "connecting",
  CONNECTED: "connected",
  DISCONNECTED: "disconnected",
  RECONNECTING: "reconnecting",
  ERROR: "error"
};

/**
 * 메시지 생성 헬퍼 함수들
 */
export const createMessage = {
  heartbeat: () => ({
    type: MESSAGE_TYPES.HEARTBEAT,
    timestamp: new Date().toISOString(),
    message: "ping"
  }),
  
  joinRoom: (roomId) => ({
    type: "join_room",
    room_id: roomId,
    timestamp: new Date().toISOString()
  }),
  
  leaveRoom: (roomId) => ({
    type: "leave_room", 
    room_id: roomId,
    timestamp: new Date().toISOString()
  }),
  
  typing: (projectId) => ({
    type: "typing",
    project_id: projectId,
    timestamp: new Date().toISOString()
  }),
  
  stopTyping: (projectId) => ({
    type: "stop_typing",
    project_id: projectId,
    timestamp: new Date().toISOString()
  }),
  
  getRoomMembers: (roomId) => ({
    type: "get_room_members",
    room_id: roomId,
    timestamp: new Date().toISOString()
  }),
  
  getConnectionStats: () => ({
    type: "get_connection_stats",
    timestamp: new Date().toISOString()
  })
};

/**
 * 메시지 검증 함수
 */
export const validateMessage = (message) => {
  if (!message || typeof message !== 'object') {
    return false;
  }
  
  return message.type && message.timestamp;
};

/**
 * 에러 메시지 확인
 */
export const isErrorMessage = (message) => {
  return message.type === MESSAGE_TYPES.ERROR;
};

/**
 * 시스템 메시지 확인
 */
export const isSystemMessage = (message) => {
  const systemTypes = [
    MESSAGE_TYPES.CONNECTION_ESTABLISHED,
    MESSAGE_TYPES.ROOM_JOINED,
    MESSAGE_TYPES.ROOM_LEFT,
    MESSAGE_TYPES.ERROR,
    MESSAGE_TYPES.HEARTBEAT
  ];
  
  return systemTypes.includes(message.type);
};

/**
 * 알림이 필요한 메시지 타입인지 확인
 */
export const shouldShowNotification = (message) => {
  const notificationTypes = [
    MESSAGE_TYPES.NOTIFICATION_NEW,
    MESSAGE_TYPES.TASK_ASSIGNED,
    MESSAGE_TYPES.COMMENT_MENTION,
    MESSAGE_TYPES.PROJECT_MEMBER_ADDED,
    MESSAGE_TYPES.PROJECT_INVITATION_SENT
  ];
  
  return notificationTypes.includes(message.type);
};

/**
 * 실시간 UI 업데이트가 필요한 메시지 타입인지 확인
 */
export const shouldUpdateUI = (message) => {
  const uiUpdateTypes = [
    MESSAGE_TYPES.TASK_CREATED,
    MESSAGE_TYPES.TASK_UPDATED,
    MESSAGE_TYPES.TASK_DELETED,
    MESSAGE_TYPES.TASK_STATUS_CHANGED,
    MESSAGE_TYPES.COMMENT_CREATED,
    MESSAGE_TYPES.COMMENT_UPDATED,
    MESSAGE_TYPES.COMMENT_DELETED,
    MESSAGE_TYPES.PROJECT_CREATED,
    MESSAGE_TYPES.PROJECT_UPDATED,
    MESSAGE_TYPES.PROJECT_DELETED,
    MESSAGE_TYPES.WORKSPACE_CREATED,
    MESSAGE_TYPES.WORKSPACE_UPDATED,
    MESSAGE_TYPES.WORKSPACE_DELETED
  ];
  
  return uiUpdateTypes.includes(message.type);
};