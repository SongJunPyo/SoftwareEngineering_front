import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from '../config/axios';
import logo from '../components/planora.png';
import naverLogo from '../components/naver-icon-file.png';
import { useGoogleLogin } from '@react-oauth/google';

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // 구글 추가 정보 입력 상태
  const [showExtraForm, setShowExtraForm] = useState(false);
  const [googleEmail, setGoogleEmail] = useState("");
  const [googleName, setGoogleName] = useState("");
  const [extraName, setExtraName] = useState("");
  const [extraPassword, setExtraPassword] = useState("");
  const [extraPasswordConfirm, setExtraPasswordConfirm] = useState("");
  const [extraError, setExtraError] = useState("");

  // 구글 로그인 핸들러
  const login = useGoogleLogin({
    onSuccess: async tokenResponse => {
      try {
        // 구글 사용자 정보 가져오기
        const userInfoResponse = await axiosInstance.get(
          'https://www.googleapis.com/oauth2/v3/userinfo',
          {
            headers: {
              Authorization: `Bearer ${tokenResponse.access_token}`,
            },
          }
        );

        const { email, name, picture } = userInfoResponse.data;
        
        // 1. 이메일로 회원 존재 여부 확인
        const checkResponse = await axiosInstance.post('/api/v1/check-email', { email });
        
        if (checkResponse.data.exists) {
          // 이미 회원이면 바로 로그인
          const loginResponse = await axiosInstance.post('/api/v1/oauth/google', {
            access_token: tokenResponse.access_token,
            email: email,
            name: name
          });

          if (loginResponse.data.access_token) {
            localStorage.setItem('access_token', loginResponse.data.access_token);
            localStorage.setItem('refresh_token', loginResponse.data.refresh_token);
            onLogin(email, null, name);
          }
        } else {
          // 신규 회원이면 추가 정보 입력 폼 표시
          setGoogleEmail(email);
          setGoogleName(name);
          setShowExtraForm(true);
        }
      } catch (error) {
        console.error('Google login error:', error);
        setError('구글 로그인 중 오류가 발생했습니다.');
      }
    },
    onError: () => {
      setError('구글 로그인에 실패했습니다.');
    }
  });

  // 이메일/비밀번호 로그인 시
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await axiosInstance.post('/api/v1/login', {
        email: email,
        password: password
      });

      if (response.data.access_token) {
        localStorage.setItem('access_token', response.data.access_token);
        localStorage.setItem('refresh_token', response.data.refresh_token);
        onLogin(email, password, response.data.name || "");
      } else {
        setError("로그인에 실패했습니다.");
      }
    } catch (error) {
      console.error('Login error:', error.response?.data || error);
      if (error.response) {
        if (error.response.status === 401) {
          setError(error.response.data.detail || "이메일 또는 비밀번호가 일치하지 않습니다.");
        } else if (error.response.status === 422) {
          setError("이메일 형식이 올바르지 않습니다.");
        } else {
          setError("로그인 중 오류가 발생했습니다.");
        }
      } else {
        setError("서버 연결에 실패했습니다.");
      }
    }
  };

  // 구글 추가 정보 회원가입 처리
  const handleGoogleSignup = async (e) => {
    e.preventDefault();
    setExtraError("");
    if (!extraName || !extraPassword || !extraPasswordConfirm) {
      setExtraError("모든 필드를 입력해주세요.");
      return;
    }
    if (extraPassword !== extraPasswordConfirm) {
      setExtraError("비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      const response = await axiosInstance.post('/api/v1/oauth/google/register', {
        email: googleEmail,
        name: extraName,
        password: extraPassword,
        password_confirm: extraPasswordConfirm
      });

      if (response.data.access_token) {
        localStorage.setItem('access_token', response.data.access_token);
        localStorage.setItem('refresh_token', response.data.refresh_token);
        onLogin(googleEmail, null, extraName);
      }
    } catch (error) {
      console.error('Google signup error:', error);
      setExtraError(error.response?.data?.detail || "회원가입 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <img className="mx-auto h-12 w-auto" src={logo} alt="Planora" />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            로그인
          </h2>
        </div>
        {!showExtraForm ? (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="email-address" className="sr-only">
                  이메일 주소
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="이메일 주소"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  비밀번호
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="비밀번호"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center">{error}</div>
            )}

            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                로그인
              </button>
            </div>

            <div className="flex flex-col space-y-4">
              <button
                type="button"
                onClick={() => login()}
                className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <img
                  src="https://www.google.com/favicon.ico"
                  alt="Google"
                  className="w-5 h-5 mr-2"
                />
                Google로 로그인
              </button>

              <button
                type="button"
                onClick={() => window.location.href = '/oauth/kakao'}
                className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-400 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                <img
                  src="https://developers.kakao.com/assets/img/about/logos/kakaotalksharing/kakaotalk_sharing_btn_medium.png"
                  alt="Kakao"
                  className="w-5 h-5 mr-2"
                />
                카카오로 로그인
              </button>

              <button
                type="button"
                onClick={() => window.location.href = '/oauth/naver'}
                className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <img
                  src={naverLogo}
                  alt="Naver"
                  className="w-5 h-5 mr-2"
                />
                네이버로 로그인
              </button>
            </div>

            <div className="text-sm text-center">
              <a
                href="/signup"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                계정이 없으신가요? 회원가입
              </a>
            </div>
          </form>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleGoogleSignup}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="name" className="sr-only">
                  이름
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="이름"
                  value={extraName}
                  onChange={(e) => setExtraName(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  비밀번호
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="비밀번호"
                  value={extraPassword}
                  onChange={(e) => setExtraPassword(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password-confirm" className="sr-only">
                  비밀번호 확인
                </label>
                <input
                  id="password-confirm"
                  name="password-confirm"
                  type="password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="비밀번호 확인"
                  value={extraPasswordConfirm}
                  onChange={(e) => setExtraPasswordConfirm(e.target.value)}
                />
              </div>
            </div>

            {extraError && (
              <div className="text-red-500 text-sm text-center">{extraError}</div>
            )}

            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                회원가입 완료
              </button>
            </div>

            <div className="text-sm text-center">
              <button
                type="button"
                onClick={() => setShowExtraForm(false)}
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                돌아가기
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default LoginPage;
