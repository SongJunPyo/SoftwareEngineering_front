import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI, setApiClientToken } from '../api/api'; // setApiClientToken 임포트
import logo from '../components/planora.png';

export default function EmailVerificationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying'); // verifying, success, error, expired
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      verifyEmail(token);
    } else {
      setStatus('error');
      setMessage('유효하지 않은 인증 링크입니다.');
    }
  }, [searchParams]);

  const handleLoginSuccess = (responseData) => {
    try {
      // 1. LocalStorage에 토큰 저장
      localStorage.setItem('access_token', responseData.access_token);
      if (responseData.refresh_token) {
        localStorage.setItem('refresh_token', responseData.refresh_token);
      }
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userEmail', responseData.email);
      localStorage.setItem('userName', responseData.name || '');
      if (responseData.user_id) {
        localStorage.setItem('userId', responseData.user_id.toString());
      }

      // 2. API 클라이언트 헤더 즉시 업데이트
      setApiClientToken(responseData.access_token);

      // 3. 메인 페이지로 리디렉션
      setTimeout(() => {
        window.location.href = '/main';
      }, 2000);

    } catch (error) {
        console.error('로그인 성공 처리 중 오류:', error);
        setStatus('error');
        setMessage('인증은 성공했으나 로그인 처리 중 오류가 발생했습니다. 수동으로 로그인해주세요.');
    }
  };

  const verifyEmail = async (token) => {
    try {
      setStatus('verifying');
      const response = await authAPI.verifyEmail(token);
      setStatus('success');
      setMessage(response.data.message);

      // 토큰이 반환되면 자동 로그인 처리
      if (response.data.access_token) {
        handleLoginSuccess(response.data);
      }
    } catch (error) {
      console.error('이메일 인증 실패:', error);
      if (error.response?.status === 400) {
        if (error.response.data.detail.includes('만료')) {
          setStatus('expired');
          setMessage('인증 링크가 만료되었습니다. 새로운 인증 이메일을 요청해주세요.');
        } else {
          setStatus('error');
          setMessage(error.response.data.detail || '잘못된 인증 링크입니다.');
        }
      } else {
        setStatus('error');
        setMessage('이메일 인증 중 오류가 발생했습니다.');
      }
    }
  };

  const handleResendVerification = async () => {
    if (!email.trim()) {
      alert('이메일 주소를 입력해주세요.');
      return;
    }

    try {
      setResending(true);
      await authAPI.resendVerification(email);
      alert('인증 이메일이 재전송되었습니다. 이메일을 확인해주세요.');
    } catch (error) {
      console.error('인증 이메일 재전송 실패:', error);
      if (error.response?.data?.detail) {
        alert(error.response.data.detail);
      } else {
        alert('인증 이메일 재전송 중 오류가 발생했습니다.');
      }
    } finally {
      setResending(false);
    }
  };

  const getStatusContent = () => {
    switch (status) {
      case 'verifying':
        return (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold mb-2">이메일 인증 중...</h2>
            <p className="text-gray-600">잠시만 기다려주세요.</p>
          </div>
        );
      
      case 'success':
        return (
          <div className="text-center">
            <div className="text-green-500 text-6xl mb-4">✓</div>
            <h2 className="text-xl font-semibold mb-2 text-green-600">인증 완료!</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <p className="text-gray-500">잠시 후 메인 페이지로 이동합니다...</p>
          </div>
        );
      
      case 'expired':
        return (
          <div className="text-center">
            <div className="text-yellow-500 text-6xl mb-4">⏰</div>
            <h2 className="text-xl font-semibold mb-2 text-yellow-600">링크 만료</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="space-y-4">
              <input
                type="email"
                placeholder="이메일 주소를 입력하세요"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleResendVerification}
                disabled={resending}
                className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {resending ? '전송 중...' : '인증 이메일 재전송'}
              </button>
            </div>
          </div>
        );
      
      case 'error':
        return (
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">✗</div>
            <h2 className="text-xl font-semibold mb-2 text-red-600">인증 실패</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              onClick={() => navigate('/login')}
              className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              로그인 페이지로
            </button>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* 상단 헤더 */}
      <header className="fixed top-0 left-0 w-full bg-white shadow-md z-10 p-5">
        <div className="flex justify-between items-center w-full">
          <img src={logo} alt="Planora Logo" className="h-8 cursor-pointer" onClick={() => navigate('/login')} />
          <button className="text-black text-base border border-black rounded px-4 py-2 hover:bg-black hover:text-white">
            도움말
          </button>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="pt-24 px-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            {getStatusContent()}
          </div>
        </div>
      </main>
    </div>
  );
} 