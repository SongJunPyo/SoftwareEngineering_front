import React from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';

const GoogleLoginBtn = ({ onLoginSuccess }) => {
  const login = useGoogleLogin({
    onSuccess: async tokenResponse => {
      try {
        // 구글 사용자 정보 가져오기
        const userInfoResponse = await axios.get(
          'https://www.googleapis.com/oauth2/v3/userinfo',
          {
            headers: {
              Authorization: `Bearer ${tokenResponse.access_token}`,
            },
          }
        );

        const { email, name, picture } = userInfoResponse.data;
        console.log("Google 로그인 성공:", { email, name, picture }); // 로깅을 위해 사용
        
        // 로그인 성공 처리
        if (onLoginSuccess) {
          onLoginSuccess(email, name);
        }
      } catch (error) {
        console.error('구글 로그인 중 오류 발생:', error);
        alert('구글 로그인 중 오류가 발생했습니다.');
      }
    },
    onError: () => {
      console.error('구글 로그인 실패');
      alert('구글 로그인에 실패했습니다.');
    },
  });

  return (
    <button
      onClick={() => login()}
      className="bg-white text-gray-700 border border-gray-300 rounded px-4 py-2 w-full hover:bg-gray-100 flex items-center justify-center gap-2"
    >
      <img
        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
        alt="Google"
        className="w-5 h-5"
      />
      Google 계정
    </button>
  );
};

export default GoogleLoginBtn;

