import React from 'react';

export default function ProjectMembersAvatars({
  members,
  onAvatarClick,
  maxAvatars = 3
}) {
  const extraCount = Math.max(members?.length - maxAvatars, 0);

  // 이니셜 생성 함수
  const getInitials = (nameOrEmail) => {
    if (!nameOrEmail) return "?";
    const parts = nameOrEmail.trim().split(" ");
    if (parts.length === 1) {
      return parts[0].substring(0, 1).toUpperCase();
    }
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  return (
    <div className="flex items-center -space-x-2 mb-4">
      {members?.slice(0, maxAvatars).map((member, index) => (
        <div
          key={member.id || member.email}
          className={`w-8 h-8 rounded-full border-2 border-white cursor-pointer hover:scale-110 transition-transform flex items-center justify-center text-white font-semibold text-xs ${
            index === 0 ? 'bg-yellow-400' : 
            index === 1 ? 'bg-blue-400' : 
            'bg-green-400'
          }`}
          onClick={onAvatarClick}
          style={{ zIndex: maxAvatars - index }}
          title={member.name || member.email}
        >
          {getInitials(member.name || member.email)}
        </div>
      ))}
      {extraCount > 0 && (
        <div
          className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center cursor-pointer font-bold text-white text-xs border-2 border-white"
          onClick={onAvatarClick}
          style={{ zIndex: 0 }}
        >
          +{extraCount}
        </div>
      )}
    </div>
  );
}