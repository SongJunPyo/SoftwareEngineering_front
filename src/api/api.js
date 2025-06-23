import axios from 'axios';

// API 기본 설정
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8005';
const API_VERSION = '/api/v1';

// axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: 'http://localhost:8005', 
  headers: {
    'Content-Type': 'application/json',
  },
});

// API 클라이언트의 토큰을 설정하는 함수
export const setApiClientToken = (token) => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    console.log('API Client Token Updated');
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
    console.log('API Client Token Removed');
  }
};

// 페이지 로드 시 LocalStorage의 토큰으로 헤더 설정
const token = localStorage.getItem('access_token');
setApiClientToken(token);

// 응답 인터셉터: 401 오류 처리 (토큰 만료 등)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      // 비밀번호 변경 요청은 로그아웃/리다이렉트 예외 처리
      if (originalRequest.url && originalRequest.url.includes('/user/password')) {
        return Promise.reject(error);
      }
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}${API_VERSION}/auth/refresh`, {
            refresh_token: refreshToken
          });
          
          const newAccessToken = response.data.access_token;
          localStorage.setItem('access_token', newAccessToken);
          
          // API 클라이언트 기본 헤더 업데이트
          setApiClientToken(newAccessToken);
          
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          // 토큰 갱신 실패시 로그아웃
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('isLoggedIn');
          setApiClientToken(null);
          window.location.href = '/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// API 엔드포인트 정의
export const API_ENDPOINTS = {
  // 인증 관련
  AUTH: {
    LOGIN: `${API_VERSION}/auth/login`,
    REGISTER: `${API_VERSION}/auth/register`,
    CHECK_EMAIL: `${API_VERSION}/auth/check-email`,
    REFRESH: `${API_VERSION}/auth/refresh`,
    VERIFY_EMAIL: `${API_VERSION}/auth/verify-email`,
    RESEND_VERIFICATION: `${API_VERSION}/auth/resend-verification`,
    FORGOT_PASSWORD: `${API_VERSION}/auth/forgot-password`,
    ME: `${API_VERSION}/auth/me`,
  },
  
  // OAuth 관련
  OAUTH: {
    KAKAO: `${API_VERSION}/oauth/kakao`,
    KAKAO_REGISTER: `${API_VERSION}/oauth/kakao/register`,
    NAVER: `${API_VERSION}/oauth/naver`,
    NAVER_REGISTER: `${API_VERSION}/oauth/naver/register`,
    GOOGLE: `${API_VERSION}/oauth/google`,
    GOOGLE_REGISTER: `${API_VERSION}/oauth/google/register`,
  },
  
  // 워크스페이스 관리
  WORKSPACES: {
    LIST: `${API_VERSION}/workspaces/`,
    CREATE: `${API_VERSION}/workspaces/`,
    DETAIL: (workspaceId) => `${API_VERSION}/workspaces/${workspaceId}`,
    UPDATE: (workspaceId) => `${API_VERSION}/workspaces/${workspaceId}`,
    DELETE: (workspaceId) => `${API_VERSION}/workspaces/${workspaceId}`,
    ORDER: `${API_VERSION}/workspaces/reorder`,
  },
  
  // 워크스페이스-프로젝트 관계 관리
  WORKSPACE_PROJECT_ORDER: {
    ADD: `${API_VERSION}/workspace-project-order/`,
    REMOVE: (workspaceId, projectId) => `${API_VERSION}/workspace-project-order/${workspaceId}/${projectId}`,
    UPDATE_ORDER: `${API_VERSION}/workspace-project-order/order`,
    GET_PROJECTS: (workspaceId) => `${API_VERSION}/workspace-project-order/workspace/${workspaceId}/projects`,
  },
  
  // 사용자 설정
  USER_SETTINGS: {
    GET: `${API_VERSION}/user-settings/`,
    UPDATE: `${API_VERSION}/user-settings/`,
    RESET: `${API_VERSION}/user-settings/`,
  },
  
  // 프로젝트 관리
  PROJECTS: {
    LIST: `${API_VERSION}/projects/`,
    CREATE: `${API_VERSION}/projects/`,
    DETAIL: (projectId) => `${API_VERSION}/projects/${projectId}`,
    UPDATE: (projectId) => `${API_VERSION}/projects/${projectId}`,
    DELETE: (projectId) => `${API_VERSION}/projects/${projectId}`,
    ORDER: `${API_VERSION}/projects/order`,
    MOVE: (projectId) => `${API_VERSION}/projects/${projectId}/move`,
    INVITE: (projectId) => `${API_VERSION}/projects/${projectId}/invite`,
    INVITATIONS: (projectId) => `${API_VERSION}/projects/${projectId}/invitations`,
    MEMBERS: (projectId) => `${API_VERSION}/projects/${projectId}/members`,
    REMOVE_MEMBER: (projectId, userId) => `${API_VERSION}/projects/${projectId}/members/${userId}`,
    UPDATE_MEMBER_ROLE: (projectId, userId) => `${API_VERSION}/projects/${projectId}/members/${userId}/role`,
    INVITATION_INFO: (invitationId) => `${API_VERSION}/projects/invitations/${invitationId}/info`,
    ACCEPT_INVITATION: (invitationId) => `${API_VERSION}/projects/invitations/${invitationId}/accept`,
    REJECT_INVITATION: (invitationId) => `${API_VERSION}/projects/invitations/${invitationId}/reject`,
    CANCEL_INVITATION: (invitationId) => `${API_VERSION}/projects/invitations/${invitationId}`,
    RESEND_INVITATION: (invitationId) => `${API_VERSION}/projects/invitations/${invitationId}/resend`,
    USER_WORKSPACES: `${API_VERSION}/projects/user/workspaces`,
  },
  
  // 사용자 설정 (추후 추가될 예정)
  USER: {
    PROFILE: `${API_VERSION}/user/profile`,
    SETTINGS: `${API_VERSION}/user/settings`,
    NOTIFICATIONS: `${API_VERSION}/user/notifications`,
    PRIVACY: `${API_VERSION}/user/privacy`,
  },
  
  // 알림 관리
  NOTIFICATIONS: {
    LIST: `${API_VERSION}/notifications`,
    MARK_READ: (notificationId) => `${API_VERSION}/notifications/${notificationId}/read`,
    MARK_ALL_READ: `${API_VERSION}/notifications/mark-all-read`,
    UNREAD_COUNT: `${API_VERSION}/notifications/unread-count`,
    DELETE: (notificationId) => `${API_VERSION}/notifications/${notificationId}`,
  },
  
  // 작업 관리
  TASKS: {
    LIST: `${API_VERSION}/tasks`,
    CREATE: `${API_VERSION}/tasks`,
    DETAIL: (taskId) => `${API_VERSION}/tasks/${taskId}`,
    UPDATE: (taskId) => `${API_VERSION}/tasks/${taskId}`,
    DELETE: (taskId) => `${API_VERSION}/tasks/${taskId}`,
    UPDATE_STATUS: (taskId) => `${API_VERSION}/tasks/${taskId}/status`,
    UPDATE_DESCRIPTION: (taskId) => `${API_VERSION}/tasks/${taskId}/description`,
    PARENT_TASKS: `${API_VERSION}/parent-tasks`,
  },
  
  // 댓글 관리 (신규)
  COMMENTS: {
    LIST_BY_TASK: (taskId) => `${API_VERSION}/comments/task/${taskId}`,
    CREATE: `${API_VERSION}/comments/`,
    UPDATE: (commentId) => `${API_VERSION}/comments/${commentId}`,
    DELETE: (commentId) => `${API_VERSION}/comments/${commentId}`,
  },
  
  // 태그 관리
  TAGS: {
    LIST: (projectId) => `${API_VERSION}/projects/${projectId}/tags`,
    CREATE: (projectId) => `${API_VERSION}/projects/${projectId}/tags`,
    UPDATE: (projectId, tagName) => `${API_VERSION}/projects/${projectId}/tags/${tagName}`,
    DELETE: (projectId, tagName) => `${API_VERSION}/projects/${projectId}/tags/${tagName}`,
  },
  
  // 대시보드
  DASHBOARD: {
    GET_DATA: (projectId) => `${API_VERSION}/dashboard/${projectId}`,
  },

  // 로그 관리
  LOGS: {
    LIST: `${API_VERSION}/logs`,
  }
};

// API 호출 함수들
export const authAPI = {
  login: (credentials) => apiClient.post(API_ENDPOINTS.AUTH.LOGIN, credentials),
  register: (userData) => apiClient.post(API_ENDPOINTS.AUTH.REGISTER, userData),
  checkEmail: (email) => apiClient.post(API_ENDPOINTS.AUTH.CHECK_EMAIL, { email }),
  refresh: (refreshToken) => apiClient.post(API_ENDPOINTS.AUTH.REFRESH, { refresh_token: refreshToken }),
  verifyEmail: (token) => apiClient.post(API_ENDPOINTS.AUTH.VERIFY_EMAIL, { token }),
  resendVerification: (email) => apiClient.post(API_ENDPOINTS.AUTH.RESEND_VERIFICATION, { email }),
  forgotPassword: (email) => apiClient.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email }),
  me: () => apiClient.get(API_ENDPOINTS.AUTH.ME),
};

export const oauthAPI = {
  kakao: (code) => apiClient.post(API_ENDPOINTS.OAUTH.KAKAO, { code }),
  kakaoRegister: (userData) => apiClient.post(API_ENDPOINTS.OAUTH.KAKAO_REGISTER, userData),
  naver: (code, state) => apiClient.post(API_ENDPOINTS.OAUTH.NAVER, { code, state }),
  naverRegister: (userData) => apiClient.post(API_ENDPOINTS.OAUTH.NAVER_REGISTER, userData),
  google: (tokenData) => apiClient.post(API_ENDPOINTS.OAUTH.GOOGLE, tokenData),
  googleRegister: (userData) => apiClient.post(API_ENDPOINTS.OAUTH.GOOGLE_REGISTER, userData),
};

export const workspaceAPI = {
  list: () => apiClient.get(API_ENDPOINTS.WORKSPACES.LIST),
  create: (workspaceData) => apiClient.post(API_ENDPOINTS.WORKSPACES.CREATE, workspaceData),
  detail: (workspaceId) => apiClient.get(API_ENDPOINTS.WORKSPACES.DETAIL(workspaceId)),
  update: (workspaceId, workspaceData) => apiClient.put(API_ENDPOINTS.WORKSPACES.UPDATE(workspaceId), workspaceData),
  delete: (workspaceId) => apiClient.delete(API_ENDPOINTS.WORKSPACES.DELETE(workspaceId)),
  updateOrder: (orderData) => apiClient.patch(API_ENDPOINTS.WORKSPACES.ORDER, orderData),
};

export const workspaceProjectOrderAPI = {
  addProject: (data) => apiClient.post(API_ENDPOINTS.WORKSPACE_PROJECT_ORDER.ADD, data),
  removeProject: (workspaceId, projectId) => apiClient.delete(API_ENDPOINTS.WORKSPACE_PROJECT_ORDER.REMOVE(workspaceId, projectId)),
  updateOrder: (data) => apiClient.put(API_ENDPOINTS.WORKSPACE_PROJECT_ORDER.UPDATE_ORDER, data),
  getProjects: (workspaceId) => apiClient.get(API_ENDPOINTS.WORKSPACE_PROJECT_ORDER.GET_PROJECTS(workspaceId)),
};

export const userSettingsAPI = {
  get: () => apiClient.get(API_ENDPOINTS.USER_SETTINGS.GET),
  update: (settingsData) => apiClient.put(API_ENDPOINTS.USER_SETTINGS.UPDATE, settingsData),
  reset: () => apiClient.delete(API_ENDPOINTS.USER_SETTINGS.RESET),
};

export const projectAPI = {
  list: (filters = {}) => apiClient.get(API_ENDPOINTS.PROJECTS.LIST, { params: filters }),
  create: (projectData) => apiClient.post(API_ENDPOINTS.PROJECTS.CREATE, projectData),
  detail: (projectId) => apiClient.get(API_ENDPOINTS.PROJECTS.DETAIL(projectId)),
  update: (projectId, projectData) => apiClient.put(API_ENDPOINTS.PROJECTS.UPDATE(projectId), projectData),
  delete: (projectId) => apiClient.delete(API_ENDPOINTS.PROJECTS.DELETE(projectId)),
  updateOrder: (orderData) => apiClient.put(API_ENDPOINTS.PROJECTS.ORDER, orderData),
  move: (projectId, moveData) => apiClient.put(API_ENDPOINTS.PROJECTS.MOVE(projectId), moveData),
  invite: (projectId, email, role = 'member') => apiClient.post(API_ENDPOINTS.PROJECTS.INVITE(projectId), { email, role }),
  getInvitations: (projectId) => apiClient.get(API_ENDPOINTS.PROJECTS.INVITATIONS(projectId)),
  getInvitationInfo: (invitationId) => apiClient.get(API_ENDPOINTS.PROJECTS.INVITATION_INFO(invitationId)),
  getMembers: (projectId) => apiClient.get(API_ENDPOINTS.PROJECTS.MEMBERS(projectId)),
  removeMember: (projectId, userId) => apiClient.delete(API_ENDPOINTS.PROJECTS.REMOVE_MEMBER(projectId, userId)),
  updateMemberRole: (projectId, userId, role) => apiClient.put(API_ENDPOINTS.PROJECTS.UPDATE_MEMBER_ROLE(projectId, userId), { role }),
  acceptInvitation: (invitationId, workspaceId) => apiClient.post(API_ENDPOINTS.PROJECTS.ACCEPT_INVITATION(invitationId), { workspace_id: workspaceId }),
  rejectInvitation: (invitationId) => apiClient.post(API_ENDPOINTS.PROJECTS.REJECT_INVITATION(invitationId)),
  cancelInvitation: (invitationId) => apiClient.delete(API_ENDPOINTS.PROJECTS.CANCEL_INVITATION(invitationId)),
  resendInvitation: (invitationId) => apiClient.post(API_ENDPOINTS.PROJECTS.RESEND_INVITATION(invitationId)),
  getUserWorkspaces: () => apiClient.get(API_ENDPOINTS.PROJECTS.USER_WORKSPACES),
  createUserWorkspace: (name) => apiClient.post(API_ENDPOINTS.PROJECTS.USER_WORKSPACES, { name }),
};

// 사용자 설정 API (추후 구현)
export const userAPI = {
  getProfile: () => apiClient.get(API_ENDPOINTS.USER.PROFILE),
  updateProfile: (profileData) => apiClient.put(API_ENDPOINTS.USER.PROFILE, profileData),
  getSettings: () => apiClient.get(API_ENDPOINTS.USER.SETTINGS),
  updateSettings: (settingsData) => apiClient.put(API_ENDPOINTS.USER.SETTINGS, settingsData),
  getNotifications: () => apiClient.get(API_ENDPOINTS.USER.NOTIFICATIONS),
  updateNotifications: (notificationData) => apiClient.put(API_ENDPOINTS.USER.NOTIFICATIONS, notificationData),
  getPrivacy: () => apiClient.get(API_ENDPOINTS.USER.PRIVACY),
  updatePrivacy: (privacyData) => apiClient.put(API_ENDPOINTS.USER.PRIVACY, privacyData),
  deleteAccount: (data) => apiClient.delete('/api/v1/user/delete', { data }),
  changePassword: (data) => apiClient.patch('/api/v1/user/password', data),
};

// 알림 API
export const notificationAPI = {
  list: (params = {}) => apiClient.get(API_ENDPOINTS.NOTIFICATIONS.LIST, { params }),
  markAsRead: (notificationId) => apiClient.patch(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(notificationId)),
  markAllAsRead: () => apiClient.patch(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ),
  getUnreadCount: () => apiClient.get(API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT),
  delete: (notificationId) => apiClient.delete(API_ENDPOINTS.NOTIFICATIONS.DELETE(notificationId)),
};

// 대시보드 API
export const dashboardAPI = {
  getDashboardData: (projectId) => apiClient.get(API_ENDPOINTS.DASHBOARD.GET_DATA(projectId)),
};

// 댓글 API
export const commentAPI = {
  listByTask: (taskId) => apiClient.get(API_ENDPOINTS.COMMENTS.LIST_BY_TASK(taskId)),
  create: (commentData) => apiClient.post(API_ENDPOINTS.COMMENTS.CREATE, commentData),
  update: (commentId, content) => {
    console.log('🔧 댓글 수정 API 호출:', { commentId, content, method: 'PATCH' });
    return apiClient.patch(API_ENDPOINTS.COMMENTS.UPDATE(commentId), { content });
  },
  delete: (commentId) => apiClient.delete(API_ENDPOINTS.COMMENTS.DELETE(commentId)),
};

// 태그 API
export const tagAPI = {
  list: (projectId) => apiClient.get(API_ENDPOINTS.TAGS.LIST(projectId)),
  create: (projectId, tagName) => apiClient.post(API_ENDPOINTS.TAGS.CREATE(projectId), { tag_name: tagName, project_id: projectId }),
  update: (projectId, oldTagName, newTagName) => apiClient.put(API_ENDPOINTS.TAGS.UPDATE(projectId, oldTagName), { tag_name: newTagName }),
  delete: (projectId, tagName) => apiClient.delete(API_ENDPOINTS.TAGS.DELETE(projectId, tagName)),
};

// 작업 API
export const taskAPI = {
  list: (params = {}) => apiClient.get(API_ENDPOINTS.TASKS.LIST, { params }),
  create: (taskData) => apiClient.post(API_ENDPOINTS.TASKS.CREATE, taskData),
  detail: (taskId) => apiClient.get(API_ENDPOINTS.TASKS.DETAIL(taskId)),
  update: (taskId, taskData) => apiClient.patch(API_ENDPOINTS.TASKS.UPDATE(taskId), taskData),
  delete: (taskId) => apiClient.delete(API_ENDPOINTS.TASKS.DELETE(taskId)),
  updateStatus: (taskId, status) => apiClient.patch(API_ENDPOINTS.TASKS.UPDATE_STATUS(taskId), { status }),
  updateDescription: (taskId, descriptionData) => apiClient.patch(API_ENDPOINTS.TASKS.UPDATE_DESCRIPTION(taskId), descriptionData),
  getParentTasks: (projectId) => apiClient.get(API_ENDPOINTS.TASKS.PARENT_TASKS, { params: { project_id: projectId } }),
};

// 로그 API
export const logAPI = {
  list: (params = {}) => apiClient.get(API_ENDPOINTS.LOGS.LIST, { params }),
};

export default apiClient;
