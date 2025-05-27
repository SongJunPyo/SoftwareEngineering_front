import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function NaverCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    if (code) {
      axios.post('http://localhost:8005/api/v1/oauth/naver', { code, state })
        .then(res => {
          if (res.data.message === "로그인 성공") {
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userEmail', res.data.email);
            if (res.data.name) localStorage.setItem('userName', res.data.name);
            navigate('/main');
          } else if (res.data.extra_info_required) {
            navigate(`/signup?email=${encodeURIComponent(res.data.email)}&name=${encodeURIComponent(res.data.name || '')}&provider=naver`);
          }
        })
        .catch(err => {
          if (err.response && err.response.status === 409 && err.response.data && typeof err.response.data.detail === 'string' && err.response.data.detail.includes('구글')) {
            alert('구글계정으로 연동되어있는 이메일입니다.');
          } else {
            alert('네이버 로그인에 실패했습니다.');
          }
          navigate('/login');
        });
    } else {
      alert('네이버 인증 코드가 없습니다.');
      navigate('/login');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-lg">네이버 로그인 처리 중...</div>
    </div>
  );
} 