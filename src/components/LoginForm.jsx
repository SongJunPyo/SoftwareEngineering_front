import React from 'react';

function LoginForm({ formData, error, onSubmit, onUpdate }) {
  const { email, password } = formData;

  return (
    <>
      {error && (
        <div className="w-full mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      <form className="w-full" onSubmit={onSubmit}>
        <input
          type="email"
          placeholder="이메일을 입력하세요"
          className="w-full border border-gray-300 rounded px-4 py-2 mb-3 text-base"
          value={email}
          onChange={(e) => onUpdate('email', e.target.value)}
        />
        <input
          type="password"
          placeholder="비밀번호를 입력하세요"
          className="w-full border border-gray-300 rounded px-4 py-2 mb-3 text-base"
          value={password}
          onChange={(e) => onUpdate('password', e.target.value)}
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 w-full rounded hover:bg-gray-600"
        >
          로그인
        </button>
      </form>
    </>
  );
}

export default LoginForm; 