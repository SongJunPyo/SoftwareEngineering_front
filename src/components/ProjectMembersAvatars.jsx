import React from 'react';

export default function ProjectMembersAvatars({
  members,
  onAvatarClick,
  maxAvatars = 3
}) {
  const extraCount = Math.max(members.length - maxAvatars, 0);

  return (
    <div className="flex items-center gap-2 mb-4">
      {members.slice(0, maxAvatars).map(member => (
        <img
          key={member.id}
          src={member.avatarUrl || `https://i.pravatar.cc/32?u=${member.email}`}
          alt={member.name}
          className="w-8 h-8 rounded-full border-2 border-white cursor-pointer hover:scale-110 transition-transform"
          onClick={onAvatarClick}
        />
      ))}
      {extraCount > 0 && (
        <div
          className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center cursor-pointer font-bold"
          onClick={onAvatarClick}
        >
          +{extraCount}
        </div>
      )}
    </div>
  );
}

