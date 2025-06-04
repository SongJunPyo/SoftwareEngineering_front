import React from 'react';

function GoogleSignupForm({ googleSignup, onSubmit, onUpdate }) {
  const { email, extraName, extraPassword, extraPasswordConfirm, error } = googleSignup;

  return (
    <form className="w-full" onSubmit={onSubmit}>
      <div className="mb-4 text-lg font-bold">추가 정보 입력</div>
      
      <input
        type="email"
        value={email}
        readOnly
        className="w-full border border-gray-300 rounded px-4 py-2 mb-3 text-base bg-gray-100"
      />
      
      <input
        type="text"
        placeholder="이름을 입력하세요"
        className="w-full border border-gray-300 rounded px-4 py-2 mb-3 text-base"
        value={extraName}
        onChange={e => onUpdate('extraName', e.target.value)}
      />
      
      <input
        type="password"
        placeholder="비밀번호를 입력하세요"
        className="w-full border border-gray-300 rounded px-4 py-2 mb-1 text-base"
        value={extraPassword}
        onChange={e => onUpdate('extraPassword', e.target.value)}
      />
      
      <p className="text-xs text-gray-500 mb-2">
        비밀번호는 영문, 숫자, 특수기호를 포함하여 8자리 이상이어야 하며, 특수기호는 1개 이상 포함되어야 합니다.
      </p>
      
      <input
        type="password"
        placeholder="비밀번호를 다시 입력하세요"
        className="w-full border border-gray-300 rounded px-4 py-2 mb-3 text-base"
        value={extraPasswordConfirm}
        onChange={e => onUpdate('extraPasswordConfirm', e.target.value)}
      />
      
      {error && (
        <div className="w-full mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <button 
        type="submit" 
        className="bg-blue-500 text-white px-4 py-2 w-full rounded hover:bg-gray-600"
      >
        회원가입
      </button>
    </form>
  );
}

export default GoogleSignupForm; 