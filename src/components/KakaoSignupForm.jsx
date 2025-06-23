import React from 'react';

function KakaoSignupForm({ kakaoSignup, onSubmit, onUpdate }) {
  const { email, extraName, error } = kakaoSignup;

  return (
    <form className="w-full" onSubmit={onSubmit}>
      <div className="mb-4 text-lg font-bold">카카오 계정으로 가입</div>
      <div className="mb-4 text-sm text-gray-600">
        카카오 계정으로 가입하시면 별도의 비밀번호 없이 카카오 로그인만으로 이용하실 수 있습니다.
      </div>
      
      <input
        type="email"
        value={email}
        readOnly
        className="w-full border border-gray-300 rounded px-4 py-2 mb-3 text-base bg-gray-100"
      />
      
      <input
        type="text"
        placeholder="표시할 이름을 입력하세요"
        className="w-full border border-gray-300 rounded px-4 py-2 mb-3 text-base"
        value={extraName}
        onChange={e => onUpdate('extraName', e.target.value)}
      />
      
      {error && (
        <div className="w-full mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <button 
        type="submit" 
        className="bg-yellow-500 text-white px-4 py-2 w-full rounded hover:bg-yellow-600"
      >
        카카오 계정으로 가입하기
      </button>
    </form>
  );
}

export default KakaoSignupForm;