import React from 'react';

const STATUS_CONFIG = {
  pending: {
    label: '대기중',
    color: 'bg-yellow-100 text-yellow-800',
    icon: '⏳',
    description: '초대 수락을 기다리는 중입니다'
  },
  accepted: {
    label: '수락됨',
    color: 'bg-green-100 text-green-800',
    icon: '✅',
    description: '초대가 수락되었습니다'
  },
  rejected: {
    label: '거절됨',
    color: 'bg-red-100 text-red-800',
    icon: '❌',
    description: '초대가 거절되었습니다'
  },
  cancelled: {
    label: '취소됨',
    color: 'bg-gray-100 text-gray-800',
    icon: '🚫',
    description: '초대가 취소되었습니다'
  }
};

export default function InvitationStatusBadge({ 
  status, 
  showIcon = true, 
  showTooltip = false,
  size = 'normal',
  onCancel = null,
  onResend = null,
  isActionLoading = false
}) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  
  const sizeClasses = {
    small: 'text-xs px-2 py-1',
    normal: 'text-sm px-3 py-1',
    large: 'text-base px-4 py-2'
  };

  const showActions = status === 'pending' && (onCancel || onResend);

  return (
    <div className="relative group">
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center ${sizeClasses[size]} ${config.color} rounded-full font-medium`}>
          {showIcon && <span className="mr-1">{config.icon}</span>}
          {config.label}
        </span>
        
        {showActions && (
          <div className="flex items-center gap-1">
            {onResend && (
              <button
                onClick={onResend}
                disabled={isActionLoading}
                className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
                title="초대 재전송"
              >
                {isActionLoading ? '전송중...' : '재전송'}
              </button>
            )}
            {onCancel && (
              <button
                onClick={onCancel}
                disabled={isActionLoading}
                className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
                title="초대 취소"
              >
                취소
              </button>
            )}
          </div>
        )}
      </div>
      
      {showTooltip && (
        <div className="invisible group-hover:visible absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap z-10">
          {config.description}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
}