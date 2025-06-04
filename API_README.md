# API 구조 가이드

## 📋 개요
이 프로젝트는 새로운 API v1 구조를 사용하며, 중앙집중화된 API 관리 시스템을 구축했습니다.

## 🏗️ API 구조

### 기본 설정
- **Base URL**: `/api/v1`
- **인증 방식**: JWT Bearer Token
- **자동 토큰 갱신**: 지원

### 폴더 구조
```
src/api/
├── api.js          # 중앙 API 관리 파일
```

## 🔧 환경 설정

### .env 파일 생성
프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
# API 서버 URL 설정
REACT_APP_API_BASE_URL=http://localhost:8000

# 개발 환경 설정
NODE_ENV=development

# OAuth 클라이언트 ID (선택사항, 환경변수로 관리하고 싶은 경우)
# REACT_APP_KAKAO_CLIENT_ID=your_kakao_client_id
# REACT_APP_NAVER_CLIENT_ID=your_naver_client_id
# REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
```

### 프로덕션 환경 설정
프로덕션 환경에서는 `.env.production` 파일을 생성하세요:

```env
# 프로덕션 API 서버 URL
REACT_APP_API_BASE_URL=https://api.yourapp.com

# 프로덕션 환경 설정
NODE_ENV=production
```

### 환경변수 적용 확인
환경변수가 올바르게 적용되었는지 확인하려면:

```javascript
console.log('API Base URL:', process.env.REACT_APP_API_BASE_URL);
```

## 📡 API 엔드포인트

### 1. 인증 관련 API
```javascript
import { authAPI } from '../api/api';

// 로그인
await authAPI.login({ email, password });

// 회원가입
await authAPI.register({ email, password, password_confirm, name });

// 이메일 중복 확인
await authAPI.checkEmail(email);

// 토큰 갱신 (자동 처리됨)
await authAPI.refresh(refreshToken);
```

### 2. OAuth 로그인 API
```javascript
import { oauthAPI } from '../api/api';

// 카카오 로그인
await oauthAPI.kakao(code);

// 네이버 로그인
await oauthAPI.naver(code, state);

// 구글 로그인
await oauthAPI.google(tokenData);

// 구글 회원가입
await oauthAPI.googleRegister(userData);
```

### 3. 워크스페이스 관리 API
```javascript
import { workspaceAPI } from '../api/api';

// 워크스페이스 목록 조회
await workspaceAPI.list();

// 워크스페이스 생성
await workspaceAPI.create(workspaceData);

// 워크스페이스 상세 조회
await workspaceAPI.detail(workspaceId);

// 워크스페이스 수정
await workspaceAPI.update(workspaceId, workspaceData);

// 워크스페이스 삭제
await workspaceAPI.delete(workspaceId);
```

### 4. 프로젝트 관리 API
```javascript
import { projectAPI } from '../api/api';

// 프로젝트 목록 조회 (필터링 지원)
await projectAPI.list({ workspace_id: 1 });

// 프로젝트 생성
await projectAPI.create(projectData);

// 프로젝트 상세 조회
await projectAPI.detail(projectId);

// 프로젝트 수정
await projectAPI.update(projectId, projectData);

// 프로젝트 삭제
await projectAPI.delete(projectId);

// 프로젝트 순서 변경
await projectAPI.updateOrder(orderData);

// 프로젝트 이동
await projectAPI.move(projectId, moveData);
```

### 5. 사용자 설정 API
```javascript
import { userAPI } from '../api/api';

// 프로필 조회
await userAPI.getProfile();

// 프로필 수정
await userAPI.updateProfile(profileData);

// 알림 설정 조회
await userAPI.getNotifications();

// 알림 설정 수정
await userAPI.updateNotifications(notificationData);

// 개인정보 설정 조회
await userAPI.getPrivacy();

// 개인정보 설정 수정
await userAPI.updatePrivacy(privacyData);

// 계정 삭제
await userAPI.deleteAccount();
```

## 🔐 인증 토큰 관리

### 서버 응답 형식
모든 로그인 API는 다음과 같은 표준 응답 형식을 반환합니다:

```javascript
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "user_id": 123,
  "email": "user@example.com",
  "name": "User Name"
}
```

### 로그인 성공 처리
```javascript
const handleLoginSuccess = (responseData) => {
  // 필수 필드 검증
  if (!responseData.access_token || !responseData.email) {
    throw new Error('서버 응답에 필수 정보가 누락되었습니다.');
  }

  // 토큰 저장
  localStorage.setItem('access_token', responseData.access_token);
  if (responseData.refresh_token) {
    localStorage.setItem('refresh_token', responseData.refresh_token);
  }
  
  // 사용자 정보 저장
  localStorage.setItem('isLoggedIn', 'true');
  localStorage.setItem('userEmail', responseData.email);
  localStorage.setItem('userName', responseData.name || '');
  if (responseData.user_id) {
    localStorage.setItem('userId', responseData.user_id.toString());
  }
};
```

### 자동 토큰 관리
- **JWT 토큰**: `localStorage`에 `access_token`으로 저장
- **리프레시 토큰**: `localStorage`에 `refresh_token`으로 저장
- **자동 갱신**: 401 응답 시 자동으로 토큰 갱신 시도
- **자동 로그아웃**: 토큰 갱신 실패 시 자동 로그아웃
- **사용자 정보**: 서버에서 받은 정확한 정보를 저장

### 보안 개선사항
1. **입력 값 검증**: 클라이언트 측에서 기본적인 유효성 검사
2. **응답 데이터 검증**: 서버 응답의 필수 필드 확인
3. **에러 처리 강화**: 상세한 에러 분류 및 처리
4. **토큰 검증**: 토큰 존재 여부 및 유효성 확인
5. **데이터 정리**: 로그인 실패 시 모든 인증 데이터 정리

## 🚀 사용법

### 기본 사용
```javascript
import { authAPI } from '../api/api';

const handleLogin = async () => {
  try {
    const response = await authAPI.login({
      email: 'user@example.com',
      password: 'password123'
    });
    
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
      // 로그인 성공 처리
    }
  } catch (error) {
    console.error('로그인 실패:', error);
    // 에러 처리
  }
};
```

### 에러 처리
```javascript
try {
  const response = await authAPI.login(credentials);
  // 성공 처리
} catch (error) {
  if (error.response?.status === 401) {
    // 인증 오류
  } else if (error.response?.status === 422) {
    // 유효성 검사 오류
  } else {
    // 기타 오류
  }
}
```

## 🔄 API 변경사항

### 기존 → 새로운 구조
| 기존 엔드포인트 | 새로운 엔드포인트 | 변경사항 |
|---|---|---|
| `/login` | `/api/v1/auth/login` | 버전 추가, auth 그룹화 |
| `/register` | `/api/v1/auth/register` | 버전 추가, auth 그룹화 |
| `/check-email` | `/api/v1/auth/check-email` | 버전 추가, auth 그룹화 |
| `/oauth/kakao` | `/api/v1/oauth/kakao` | 버전 추가 |
| `/oauth/naver` | `/api/v1/oauth/naver` | 버전 추가 |
| `/oauth/google` | `/api/v1/oauth/google` | 버전 추가 |

## 🛠️ 개발자 가이드

### 새로운 API 추가
1. `src/api/api.js`에서 `API_ENDPOINTS`에 엔드포인트 추가
2. 해당 API 객체에 함수 추가
3. 컴포넌트에서 import하여 사용

### 예시: 새로운 API 추가
```javascript
// 1. API_ENDPOINTS에 추가
export const API_ENDPOINTS = {
  // ... 기존 코드
  TASKS: {
    LIST: `${API_VERSION}/tasks/`,
    CREATE: `${API_VERSION}/tasks/`,
    DETAIL: (taskId) => `${API_VERSION}/tasks/${taskId}`,
  }
};

// 2. API 함수 추가
export const taskAPI = {
  list: () => apiClient.get(API_ENDPOINTS.TASKS.LIST),
  create: (taskData) => apiClient.post(API_ENDPOINTS.TASKS.CREATE, taskData),
  detail: (taskId) => apiClient.get(API_ENDPOINTS.TASKS.DETAIL(taskId)),
};

// 3. 컴포넌트에서 사용
import { taskAPI } from '../api/api';

const tasks = await taskAPI.list();
```

## 📝 주의사항

1. **환경변수**: `.env` 파일을 생성하여 API URL 설정
2. **토큰 관리**: 자동 관리되므로 수동 처리 불필요
3. **에러 처리**: 적절한 에러 처리 구현 필요
4. **CORS**: 개발 환경에서 CORS 설정 확인
5. **보안**: 프로덕션 환경에서 HTTPS 사용 권장 