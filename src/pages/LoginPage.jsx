import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI, oauthAPI } from '../api/api';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios'; // Google API 호출용 (외부 API)

// Components
import LoginHeader from '../components/LoginHeader';
import LoginIntro from '../components/LoginIntro';
import LoginForm from '../components/LoginForm';
import SocialLoginButtons from '../components/SocialLoginButtons';
import GoogleSignupForm from '../components/GoogleSignupForm';

// Constants
const OAUTH_CONFIG = {
  KAKAO: {
    CLIENT_ID: '4eb3eb8b216e68f32dc551a30aa4bf15',
    REDIRECT_URI: 'http://localhost:3000/oauth/kakao/callback',
    AUTHORIZE_URL: 'https://kauth.kakao.com/oauth/authorize'
  },
  NAVER: {
    CLIENT_ID: 'Z23l4FA17iEUlK9FPEsn',
    REDIRECT_URI: 'http://localhost:3000/oauth/naver/callback',
    AUTHORIZE_URL: 'https://nid.naver.com/oauth2.0/authorize'
  },
  GOOGLE: {
    USERINFO_URL: 'https://www.googleapis.com/oauth2/v3/userinfo',
    SCOPE: 'email profile openid'
  }
};

// Utility functions
const validateEmail = (email) => {
  return email.includes('@') && email.includes('.');
};

const validatePassword = (password, confirmPassword = null) => {
  const errors = [];
  if (password.length < 8) {
    errors.push('비밀번호는 8자리 이상이어야 합니다.');
  }
  if (confirmPassword !== null && password !== confirmPassword) {
    errors.push('비밀번호가 일치하지 않습니다.');
  }
  return errors;
};

const getErrorMessage = (error) => {
  if (!error.response) {
    return error.message || "서버 연결에 실패했습니다.";
  }

  switch (error.response.status) {
    case 401:
      return error.response.data.detail || "이메일 또는 비밀번호가 일치하지 않습니다.";
    case 409:
      return error.response.data.detail || "이미 가입된 이메일입니다.";
    case 422:
      return "입력 정보가 올바르지 않습니다.";
    case 429:
      return "너무 많은 로그인 시도입니다. 잠시 후 다시 시도해주세요.";
    case 500:
      return "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
    default:
      return "로그인 중 오류가 발생했습니다.";
  }
};

function LoginPage({ onLogin }) {
  const navigate = useNavigate();

  // Form states
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [error, setError] = useState("");

  // Google signup form states
  const [googleSignup, setGoogleSignup] = useState({
    showForm: false,
    email: "",
    name: "",
    extraName: "",
    extraPassword: "",
    extraPasswordConfirm: "",
    error: ""
  });

  // OAuth 상태 정리 (컴포넌트 마운트 시)
  useEffect(() => {
    // 이전 OAuth 세션 상태 정리
    try {
      if (window.google && window.google.accounts) {
        window.google.accounts.id.cancel();
      }
    } catch (error) {
      // 에러는 무시 (Google SDK가 로드되지 않았을 수 있음)
    }
    
    // OAuth 관련 URL 파라미터 정리
    const url = new URL(window.location);
    if (url.searchParams.has('code') || url.searchParams.has('state')) {
      url.searchParams.delete('code');
      url.searchParams.delete('state');
      window.history.replaceState({}, document.title, url.toString());
    }
  }, []);

  // Common login success handler
  const handleLoginSuccess = (responseData) => {
    try {
      if (!responseData.access_token || !responseData.email) {
        throw new Error('서버 응답에 필수 정보가 누락되었습니다.');
      }

      // Store tokens and user data
      const tokenData = {
        access_token: responseData.access_token,
        refresh_token: responseData.refresh_token,
        isLoggedIn: 'true',
        userEmail: responseData.email,
        userName: responseData.name || '',
        userId: responseData.user_id?.toString()
      };

      Object.entries(tokenData).forEach(([key, value]) => {
        if (value) localStorage.setItem(key, value);
      });

      console.log('로그인 성공:', {
        email: responseData.email,
        name: responseData.name,
        userId: responseData.user_id
      });

      onLogin(responseData.email, '', responseData.name || '');
      navigate('/main', { replace: true });

    } catch (error) {
      console.error('로그인 성공 처리 중 오류:', error);
      setError('로그인 처리 중 오류가 발생했습니다.');
      
      // Clean up on failure
      ['access_token', 'refresh_token', 'isLoggedIn', 'userEmail', 'userName', 'userId']
        .forEach(key => localStorage.removeItem(key));
    }
  };

  // Email/Password login
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError("");

    const { email, password } = formData;

    // Validation
    if (!email.trim() || !password.trim()) {
      setError("이메일과 비밀번호를 모두 입력해주세요.");
      return;
    }

    if (!validateEmail(email)) {
      setError("올바른 이메일 형식을 입력해주세요.");
      return;
    }

    try {
      const response = await authAPI.login({
        email: email.trim(),
        password: password
      });

      if (response.data?.access_token) {
        handleLoginSuccess(response.data);
      } else {
        throw new Error('서버에서 올바른 로그인 정보를 받지 못했습니다.');
      }
    } catch (error) {
      console.error('로그인 오류:', error);
      setError(getErrorMessage(error));
    }
  };

  // Google login - COOP 문제 해결을 위한 간소화된 설정
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        console.log('Google OAuth 성공:', tokenResponse);
        console.log('토큰 타입:', typeof tokenResponse);
        console.log('토큰 키들:', Object.keys(tokenResponse));
        
        // access_token 확인
        const accessToken = tokenResponse.access_token;
        if (!accessToken) {
          throw new Error('Google OAuth에서 access_token을 받지 못했습니다.');
        }

        console.log('Access token:', accessToken.substring(0, 20) + '...');

        // Get user info from Google - 더 간단한 접근
        console.log('Google API 호출 시작...');
        
        try {
          const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { 
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/json'
            },
            timeout: 10000 // 10초 타임아웃
          });

          console.log('Google API 응답:', userInfoResponse.data);
          const { email, name } = userInfoResponse.data;
          
          if (!email) {
            throw new Error('구글에서 이메일 정보를 가져올 수 없습니다.');
          }

          // Check if user exists
          const checkResponse = await authAPI.checkEmail(email);
          
          if (checkResponse.data.exists) {
            // Existing user - login
            const loginResponse = await oauthAPI.google({
              access_token: accessToken,
              email,
              name
            });

            if (loginResponse.data?.access_token) {
              handleLoginSuccess(loginResponse.data);
            } else {
              throw new Error('서버에서 올바른 로그인 정보를 받지 못했습니다.');
            }
          } else {
            // New user - show signup form
            setGoogleSignup({
              ...googleSignup,
              showForm: true,
              email,
              name: name || "",
              extraName: name || "",
              error: ""
            });
          }
        } catch (apiError) {
          console.error('Google API 호출 실패:', apiError);
          
          if (apiError.response?.status === 401) {
            throw new Error('Google 인증이 만료되었습니다. 다시 시도해주세요.');
          } else {
            throw new Error('Google 사용자 정보를 가져오는데 실패했습니다.');
          }
        }

      } catch (error) {
        console.error('구글 로그인 중 오류 발생:', error);
        console.error('오류 상세:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        
        setError(error.message || '구글 로그인에 실패했습니다.');
      }
    },
    onError: (error) => {
      console.error('구글 로그인 실패:', error);
      
      // COOP 관련 오류 처리
      if (error.error === 'popup_blocked' || 
          error.error === 'popup_closed_by_user' ||
          (error.error && error.error.includes('popup'))) {
        setError('팝업이 차단되었습니다. 브라우저에서 팝업을 허용하거나, 다른 브라우저를 시도해보세요.');
      } else {
        const errorMessages = {
          'access_denied': '로그인 권한이 거부되었습니다.',
          'interaction_required': '사용자 상호작용이 필요합니다. 다시 시도해주세요.',
          'redirect_uri_mismatch': 'OAuth 설정 오류입니다. 관리자에게 문의하세요.'
        };
        
        const message = errorMessages[error.error] || '구글 로그인에 실패했습니다.';
        setError(`${message} (오류: ${error.error || 'unknown'})`);
      }
    },
    scope: 'email profile',  // 최소한의 scope만 사용
    include_granted_scopes: true,
    state_cookie_domain: 'single_host_origin'
  });

  // Google signup
  const handleGoogleSignup = async (e) => {
    e.preventDefault();
    setGoogleSignup(prev => ({ ...prev, error: "" }));
    
    const { extraName, extraPassword, extraPasswordConfirm } = googleSignup;

    // Validation
    if (!extraName.trim() || !extraPassword || !extraPasswordConfirm) {
      setGoogleSignup(prev => ({ ...prev, error: "모든 필드를 입력해주세요." }));
      return;
    }
    
    const passwordErrors = validatePassword(extraPassword, extraPasswordConfirm);
    if (passwordErrors.length > 0) {
      setGoogleSignup(prev => ({ ...prev, error: passwordErrors[0] }));
      return;
    }

    try {
      const response = await oauthAPI.googleRegister({
        email: googleSignup.email,
        name: extraName.trim(),
        password: extraPassword,
        password_confirm: extraPasswordConfirm
      });

      if (response.data?.access_token) {
        handleLoginSuccess(response.data);
      } else {
        throw new Error('서버에서 올바른 회원가입 정보를 받지 못했습니다.');
      }
    } catch (error) {
      console.error('구글 회원가입 중 오류 발생:', error);
      setGoogleSignup(prev => ({ ...prev, error: getErrorMessage(error) }));
    }
  };

  // Social login handlers
  const handleKakaoLogin = () => {
    const { CLIENT_ID, REDIRECT_URI, AUTHORIZE_URL } = OAUTH_CONFIG.KAKAO;
    window.location.href = 
      `${AUTHORIZE_URL}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code`;
  };

  const handleNaverLogin = () => {
    const { CLIENT_ID, REDIRECT_URI, AUTHORIZE_URL } = OAUTH_CONFIG.NAVER;
    const state = Math.random().toString(36).substring(2, 15);
    window.location.href = 
      `${AUTHORIZE_URL}?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=${state}`;
  };

  // Form data handlers
  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateGoogleSignup = (field, value) => {
    setGoogleSignup(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <LoginHeader onNavigateHome={() => navigate('/login')} />
      
      <main className="flex-1 flex flex-col md:flex-row items-center justify-center gap-10 px-4 pt-32">
        <LoginIntro />
        
        <section className="flex-1 p-8 rounded-lg bg-white flex flex-col items-center max-w-md w-full">
          {googleSignup.showForm ? (
            <GoogleSignupForm
              googleSignup={googleSignup}
              onSubmit={handleGoogleSignup}
              onUpdate={updateGoogleSignup}
            />
          ) : (
            <>
              <LoginForm
                formData={formData}
                error={error}
                onSubmit={handleEmailLogin}
                onUpdate={updateFormData}
              />
              
              <SocialLoginButtons
                onGoogleLogin={() => googleLogin()}
                onKakaoLogin={handleKakaoLogin}
                onNaverLogin={handleNaverLogin}
              />
              
              <button
                onClick={() => navigate('/signup')}
                className="mt-4 bg-gray-500 text-white px-4 py-2 w-full rounded hover:bg-blue-600"
              >
                회원가입
              </button>
            </>
          )}
        </section>
      </main>
    </div>
  );
}

export default LoginPage;
