import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function KakaoCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');
    if (code) {
      // 백엔드에 code 전달
      axios.post('http://localhost:8005/api/v1/oauth/kakao', { code })
        .then(res => {
          // 로그인/회원가입 성공 시 메인 페이지로 이동
          // 필요시 토큰/유저정보 저장
          navigate('/');
        })
        .catch(err => {
          if (err.response && err.response.status === 409 && err.response.data && typeof err.response.data.detail === 'string' && err.response.data.detail.includes('구글')) {
            alert('구글계정으로 연동되어있는 이메일입니다.');
          } else {
            alert('카카오 로그인에 실패했습니다.');
          }
          navigate('/login');
        });
    } else {
      alert('카카오 인증 코드가 없습니다.');
      navigate('/login');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-lg">카카오 로그인 처리 중...</div>
    </div>
  );
} 