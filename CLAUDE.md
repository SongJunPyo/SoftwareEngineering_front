# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 개발 명령어

```bash
# 개발 서버 시작
npm start

# 프로덕션 빌드
npm run build

# 테스트 실행
npm test
```

## 프로젝트 아키텍처

### 전체 구조
프로젝트 관리 대시보드 애플리케이션으로, 워크스페이스 기반의 팀 협업 도구입니다.

### 인증 시스템
- **JWT 기반**: `localStorage`에 access_token/refresh_token 저장
- **자동 토큰 갱신**: API 인터셉터에서 401 응답 시 자동 처리 (`src/api/api.js:29-62`)
- **소셜 로그인**: 구글, 카카오, 네이버 OAuth 지원
- **보호된 라우트**: 모든 워크스페이스 페이지는 인증 필요

### 상태 관리
- **OrgProjectContext**: 워크스페이스/프로젝트 전역 상태 관리 (`src/context/OrgProjectContext.jsx`)
  - 조직(워크스페이스) 목록 및 선택
  - 프로젝트 목록 및 CRUD 작업
  - API 연동을 통한 데이터 동기화

### API 구조
- **중앙화된 API 클라이언트**: `src/api/api.js`
- **Base URL**: `/api/v1` (proxy: localhost:8005)
- **자동 Authorization 헤더**: JWT 토큰 자동 첨부
- **모듈별 API**: authAPI, oauthAPI, workspaceAPI, projectAPI, userAPI

### 라우팅 구조
1. **인증 페이지**: `/login`, `/signup`, OAuth 콜백
2. **메인 페이지**: `/main` (대시보드 개요)
3. **워크스페이스**: `/workspace/*` (사이드바 포함 레이아웃)
   - `/workspace/board`: 칸반 보드
   - `/workspace/calendar`: 캘린더 뷰
   - `/workspace/log`: 로그 페이지
   - `/workspace/all-tasks`: 전체 태스크

### 레이아웃 패턴
- **워크스페이스 레이아웃**: TopBar + Sidebar + ProjectHeader + 메인 콘텐츠
- **인증 레이아웃**: 단순 중앙 정렬 폼
- **사이드바 토글**: 모든 워크스페이스 페이지에서 공통

### 주요 컴포넌트 패턴
- **페이지 컴포넌트**: `src/pages/`에 위치, 라우트별 메인 컴포넌트
- **재사용 컴포넌트**: `src/components/`에 위치
- **프롭스 전달**: 주로 콜백 함수 패턴 사용 (onLogin, onLogout 등)

### 스타일링
- **Tailwind CSS**: 유틸리티 우선 CSS 프레임워크
- **반응형 디자인**: 모바일 퍼스트 접근
- **일관된 색상**: gray 팔레트 기반

### 환경 설정
- **API URL**: `REACT_APP_API_BASE_URL` 환경변수로 설정
- **프록시**: package.json에서 localhost:8005로 설정
- **PWA 지원**: 서비스 워커 및 매니페스트 포함

### 데이터 플로우
1. 로그인 → JWT 토큰 저장 → Context에서 조직 목록 fetch
2. 조직 선택 → 해당 조직의 프로젝트 목록 fetch
3. 프로젝트 작업 → API 호출 → Context 상태 업데이트

### WebSocket 실시간 통신
- **WebSocketProvider**: 전역 WebSocket 연결 관리 (`src/websocket/WebSocketContext.jsx`)
- **실시간 훅**: `useTaskRealtime`, `useCommentRealtime`, `useNotificationRealtime`
- **룸 시스템**: 사용자별, 프로젝트별, 워크스페이스별 실시간 업데이트
- **자동 재연결**: 연결 실패 시 최대 5회 재시도
- **메시지 타입**: Task CRUD, Comment CRUD, 알림, 사용자 상태 등

### 백엔드 연동
- **FastAPI**: Python 백엔드 (localhost:8005)
- **WebSocket**: `/ws/connect` 엔드포인트로 실시간 연결
- **JWT 인증**: WebSocket 연결 시 토큰 기반 인증
- **이벤트 발행**: Task/Comment 변경 시 자동 WebSocket 이벤트 발행

### 주요 라이브러리
- **@fullcalendar/react**: 캘린더 컴포넌트
- **@react-oauth/google**: 구글 OAuth
- **react-beautiful-dnd**: 드래그 앤 드롭
- **react-router-dom**: 라우팅
- **axios**: HTTP 클라이언트