import React, { useState } from 'react';

const ROLES = {
  viewer: { label: '뷰어', color: 'bg-gray-100 text-gray-600', description: '프로젝트 내용 조회만 가능' },
  member: { label: '멤버', color: 'bg-green-100 text-green-800', description: '업무 생성, 댓글 등 상호작용 가능' },
  admin: { label: '관리자', color: 'bg-blue-100 text-blue-800', description: '전반적인 프로젝트 관리 권한' },
  owner: { label: '소유자', color: 'bg-yellow-100 text-yellow-800', description: '모든 권한 (프로젝트 삭제, 관리자 지정)' }
};

export default function RoleSelector({ 
  currentRole, 
  onRoleChange, 
  disabled = false,
  canChangeToOwner = false,
  canChangeToAdmin = false,
  size = 'normal' 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isChanging, setIsChanging] = useState(false);

  const handleRoleChange = async (newRole) => {
    if (newRole === currentRole || isChanging) return;
    
    // 소유자 권한 변경 시 확인
    if (newRole === 'owner') {
      if (!window.confirm('소유자 권한을 이전하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
        setIsOpen(false);
        return;
      }
    }

    setIsChanging(true);
    try {
      await onRoleChange(newRole);
      setIsOpen(false);
    } catch (error) {
      console.error('권한 변경 실패:', error);
      alert('권한 변경에 실패했습니다.');
    } finally {
      setIsChanging(false);
    }
  };

  const sizeClasses = {
    small: 'text-xs px-2 py-1',
    normal: 'text-sm px-3 py-1',
    large: 'text-base px-4 py-2'
  };

  const availableRoles = Object.entries(ROLES).filter(([roleKey]) => {
    if (roleKey === 'owner') {
      return canChangeToOwner;
    }
    if (roleKey === 'admin') {
      return canChangeToAdmin;
    }
    return true;
  });

  if (disabled) {
    const roleConfig = ROLES[currentRole];
    return (
      <span className={`inline-flex items-center ${sizeClasses[size]} ${roleConfig.color} rounded-full font-medium`}>
        {roleConfig.label}
      </span>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isChanging}
        className={`inline-flex items-center ${sizeClasses[size]} ${ROLES[currentRole].color} rounded-full font-medium hover:opacity-80 transition-opacity ${
          isChanging ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
      >
        {isChanging ? (
          <>
            <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin mr-1"></div>
            변경중...
          </>
        ) : (
          <>
            {ROLES[currentRole].label}
            <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </>
        )}
      </button>

      {isOpen && !isChanging && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          ></div>
          <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border z-20">
            <div className="py-1">
              {availableRoles.map(([roleKey, roleConfig]) => (
                <button
                  key={roleKey}
                  onClick={() => handleRoleChange(roleKey)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                    roleKey === currentRole ? 'bg-gray-50 font-medium' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${roleConfig.color}`}>
                      {roleConfig.label}
                    </span>
                    {roleKey === currentRole && (
                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {roleConfig.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}