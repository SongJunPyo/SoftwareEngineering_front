import axios from 'axios';

// API 기본 설정
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';
const API_VERSION = '/api/v1';

// axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터: JWT 토큰 자동 추가
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터: 토큰 갱신 처리
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}${API_VERSION}/auth/refresh`, {
            refresh_token: refreshToken
          });
          
          const newAccessToken = response.data.access_token;
          localStorage.setItem('access_token', newAccessToken);
          
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          // 토큰 갱신 실패시 로그아웃
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('isLoggedIn');
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
  },
  
  // OAuth 관련
  OAUTH: {
    KAKAO: `${API_VERSION}/oauth/kakao`,
    KAKAO_REGISTER: `${API_VERSION}/oauth/kakao/register`,
    NAVER: `${API_VERSION}/oauth/naver`,
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
  },
  
  // 사용자 설정 (추후 추가될 예정)
  USER: {
    PROFILE: `${API_VERSION}/user/profile`,
    SETTINGS: `${API_VERSION}/user/settings`,
    NOTIFICATIONS: `${API_VERSION}/user/notifications`,
    PRIVACY: `${API_VERSION}/user/privacy`,
  }
};

// API 호출 함수들
export const authAPI = {
  login: (credentials) => apiClient.post(API_ENDPOINTS.AUTH.LOGIN, credentials),
  register: (userData) => apiClient.post(API_ENDPOINTS.AUTH.REGISTER, userData),
  checkEmail: (email) => apiClient.post(API_ENDPOINTS.AUTH.CHECK_EMAIL, { email }),
  refresh: (refreshToken) => apiClient.post(API_ENDPOINTS.AUTH.REFRESH, { refresh_token: refreshToken }),
};

export const oauthAPI = {
  kakao: (code) => apiClient.post(API_ENDPOINTS.OAUTH.KAKAO, { code }),
  kakaoRegister: (userData) => apiClient.post(API_ENDPOINTS.OAUTH.KAKAO_REGISTER, userData),
  naver: (code, state) => apiClient.post(API_ENDPOINTS.OAUTH.NAVER, { code, state }),
  google: (tokenData) => apiClient.post(API_ENDPOINTS.OAUTH.GOOGLE, tokenData),
  googleRegister: (userData) => apiClient.post(API_ENDPOINTS.OAUTH.GOOGLE_REGISTER, userData),
};

export const workspaceAPI = {
  list: () => apiClient.get(API_ENDPOINTS.WORKSPACES.LIST),
  create: (workspaceData) => apiClient.post(API_ENDPOINTS.WORKSPACES.CREATE, workspaceData),
  detail: (workspaceId) => apiClient.get(API_ENDPOINTS.WORKSPACES.DETAIL(workspaceId)),
  update: (workspaceId, workspaceData) => apiClient.put(API_ENDPOINTS.WORKSPACES.UPDATE(workspaceId), workspaceData),
  delete: (workspaceId) => apiClient.delete(API_ENDPOINTS.WORKSPACES.DELETE(workspaceId)),
};

export const projectAPI = {
  list: (filters = {}) => apiClient.get(API_ENDPOINTS.PROJECTS.LIST, { params: filters }),
  create: (projectData) => apiClient.post(API_ENDPOINTS.PROJECTS.CREATE, projectData),
  detail: (projectId) => apiClient.get(API_ENDPOINTS.PROJECTS.DETAIL(projectId)),
  update: (projectId, projectData) => apiClient.put(API_ENDPOINTS.PROJECTS.UPDATE(projectId), projectData),
  delete: (projectId) => apiClient.delete(API_ENDPOINTS.PROJECTS.DELETE(projectId)),
  updateOrder: (orderData) => apiClient.put(API_ENDPOINTS.PROJECTS.ORDER, orderData),
  move: (projectId, moveData) => apiClient.put(API_ENDPOINTS.PROJECTS.MOVE(projectId), moveData),
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
  deleteAccount: () => apiClient.delete(API_ENDPOINTS.USER.PROFILE),
};

export default apiClient;
