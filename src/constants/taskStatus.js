/**
 * 업무 상태 관련 상수 정의
 * 모든 페이지에서 일관된 상태 표시를 위한 공통 설정
 */

// 업무 상태 값 상수
export const TASK_STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  PENDING: 'pending',
  COMPLETE: 'complete'
};

// 상태별 설정 (칸반 보드용 - Tailwind CSS 클래스 포함)
export const STATUS_CONFIG_KANBAN = {
  [TASK_STATUS.TODO]: {
    label: "📝 할 일",
    color: "bg-gray-100",
    textColor: "text-gray-700",
    borderColor: "border-gray-300",
    bgColor: "bg-gray-50",
    headerColor: "bg-gray-200"
  },
  [TASK_STATUS.IN_PROGRESS]: {
    label: "🔄 진행중",
    color: "bg-blue-100", 
    textColor: "text-blue-700",
    borderColor: "border-blue-300",
    bgColor: "bg-blue-50",
    headerColor: "bg-blue-100"
  },
  [TASK_STATUS.PENDING]: {
    label: "⏸️ 대기",
    color: "bg-yellow-100", 
    textColor: "text-yellow-700",
    borderColor: "border-yellow-300",
    bgColor: "bg-yellow-50",
    headerColor: "bg-yellow-100"
  },
  [TASK_STATUS.COMPLETE]: {
    label: "✅ 완료",
    color: "bg-green-100",
    textColor: "text-green-700", 
    borderColor: "border-green-300",
    bgColor: "bg-green-50",
    headerColor: "bg-green-100"
  }
};

// 상태별 설정 (캘린더용 - hex 색상 포함)
export const STATUS_CONFIG_CALENDAR = {
  [TASK_STATUS.TODO]: { 
    label: "📝 할 일", 
    color: "#6b7280" 
  },
  [TASK_STATUS.IN_PROGRESS]: { 
    label: "🔄 진행중", 
    color: "#3b82f6" 
  },
  [TASK_STATUS.PENDING]: { 
    label: "⏸️ 대기", 
    color: "#f59e0b" 
  },
  [TASK_STATUS.COMPLETE]: { 
    label: "✅ 완료", 
    color: "#10b981" 
  }
};

// 상태별 테이블 스타일 (모든 업무 페이지용)
export const STATUS_TABLE_STYLES = {
  [TASK_STATUS.COMPLETE]: 'bg-green-100 text-green-800',
  [TASK_STATUS.IN_PROGRESS]: 'bg-blue-100 text-blue-800',
  [TASK_STATUS.PENDING]: 'bg-yellow-100 text-yellow-800',
  [TASK_STATUS.TODO]: 'bg-gray-100 text-gray-800'
};

// 상태 라벨만 반환하는 헬퍼 함수
export const getStatusLabel = (status) => {
  const config = STATUS_CONFIG_KANBAN[status];
  return config ? config.label : '알 수 없음';
};

// 필터 옵션용 배열
export const STATUS_FILTER_OPTIONS = [
  { value: '', label: '상태' },
  { value: TASK_STATUS.TODO, label: STATUS_CONFIG_KANBAN[TASK_STATUS.TODO].label },
  { value: TASK_STATUS.IN_PROGRESS, label: STATUS_CONFIG_KANBAN[TASK_STATUS.IN_PROGRESS].label },
  { value: TASK_STATUS.PENDING, label: STATUS_CONFIG_KANBAN[TASK_STATUS.PENDING].label },
  { value: TASK_STATUS.COMPLETE, label: STATUS_CONFIG_KANBAN[TASK_STATUS.COMPLETE].label }
];

// 폼 옵션용 배열 (생성/수정 모달)
export const STATUS_FORM_OPTIONS = [
  { value: TASK_STATUS.TODO, label: STATUS_CONFIG_KANBAN[TASK_STATUS.TODO].label },
  { value: TASK_STATUS.IN_PROGRESS, label: STATUS_CONFIG_KANBAN[TASK_STATUS.IN_PROGRESS].label },
  { value: TASK_STATUS.PENDING, label: STATUS_CONFIG_KANBAN[TASK_STATUS.PENDING].label },
  { value: TASK_STATUS.COMPLETE, label: STATUS_CONFIG_KANBAN[TASK_STATUS.COMPLETE].label }
];

// 유효한 상태값 검증 함수
export const isValidStatus = (status) => {
  return Object.values(TASK_STATUS).includes(status);
};

// 상태 순서 (정렬용)
export const STATUS_ORDER = {
  [TASK_STATUS.TODO]: 1,
  [TASK_STATUS.IN_PROGRESS]: 2,
  [TASK_STATUS.PENDING]: 3,
  [TASK_STATUS.COMPLETE]: 4
};