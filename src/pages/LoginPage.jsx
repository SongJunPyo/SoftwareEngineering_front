import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI, oauthAPI, setApiClientToken } from '../api/api';
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
  
  // 초대 컨텍스트 상태
  const [invitationContext, setInvitationContext] = useState(null);

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

  // 비밀번호 찾기 관련 상태
  const [forgotPassword, setForgotPassword] = useState({
    showModal: false,
    email: "",
    loading: false,
    success: false,
    error: "",
    cooldown: 0
  });

  // 초대 컨텍스트 확인 함수
  const checkInvitationContext = () => {
    try {
      const pendingInvitationStr = localStorage.getItem('pendingInvitation');
      if (!pendingInvitationStr) {
        console.log('초대 컨텍스트 없음');
        setInvitationContext(null);
        return false;
      }
      
      const invitationData = JSON.parse(pendingInvitationStr);
      
      // 만료 체크
      if (Date.now() > invitationData.expires) {
        console.log('초대 컨텍스트 만료됨 - 정리');
        localStorage.removeItem('pendingInvitation');
        setInvitationContext(null);
        return false;
      }
      
      console.log('초대 컨텍스트 발견:', invitationData);
      setInvitationContext({
        email: invitationData.email,
        project: invitationData.project,
        inviter: invitationData.inviter
      });
      
      // 초대받은 이메일을 기본값으로 설정
      setFormData(prev => ({ ...prev, email: invitationData.email }));
      return true;
    } catch (error) {
      console.error('초대 컨텍스트 파싱 오류:', error);
      localStorage.removeItem('pendingInvitation');
      setInvitationContext(null);
      return false;
    }
  };

  // OAuth 상태 정리 및 초대 컨텍스트 확인 (컴포넌트 마운트 시)
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
    
    // 초대 컨텍스트 확인
    checkInvitationContext();
  }, []);

  // 페이지 포커스 시 초대 컨텍스트 재확인 (다른 탭에서 돌아올 때)
  useEffect(() => {
    const handleFocus = () => {
      console.log('페이지 포커스 - 초대 컨텍스트 재확인');
      checkInvitationContext();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // 비밀번호 찾기 쿨다운 타이머
  useEffect(() => {
    let timer;
    if (forgotPassword.cooldown > 0) {
      timer = setTimeout(() => {
        setForgotPassword(prev => ({ ...prev, cooldown: prev.cooldown - 1 }));
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [forgotPassword.cooldown]);

  // 비밀번호 찾기 모달 관련 함수들
  const handleForgotPasswordOpen = () => {
    setForgotPassword(prev => ({
      ...prev,
      showModal: true,
      email: formData.email || "",
      error: "",
      success: false
    }));
  };

  const handleForgotPasswordClose = () => {
    setForgotPassword(prev => ({
      ...prev,
      showModal: false,
      email: "",
      error: "",
      success: false,
      loading: false
    }));
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (!forgotPassword.email) {
      setForgotPassword(prev => ({ ...prev, error: "이메일을 입력해주세요." }));
      return;
    }

    if (!validateEmail(forgotPassword.email)) {
      setForgotPassword(prev => ({ ...prev, error: "올바른 이메일 형식이 아닙니다." }));
      return;
    }

    setForgotPassword(prev => ({ ...prev, loading: true, error: "", success: false }));

    try {
      await authAPI.forgotPassword(forgotPassword.email);
      setForgotPassword(prev => ({
        ...prev,
        loading: false,
        success: true,
        cooldown: 60,
        error: ""
      }));
    } catch (error) {
      console.error('비밀번호 찾기 오류:', error);
      setForgotPassword(prev => ({
        ...prev,
        loading: false,
        error: error.response?.data?.detail || "비밀번호 재설정에 실패했습니다."
      }));
    }
  };

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

      // API 클라이언트에 토큰 설정
      setApiClientToken(responseData.access_token);

      console.log('로그인 성공:', {
        email: responseData.email,
        name: responseData.name,
        userId: responseData.user_id
      });

      onLogin(responseData.email, '', responseData.name || '');
      
      // 초대 링크 처리
      try {
        const pendingInvitationStr = localStorage.getItem('pendingInvitation');
        if (pendingInvitationStr) {
          const invitationData = JSON.parse(pendingInvitationStr);
          
          // 만료 체크
          if (Date.now() > invitationData.expires) {
            console.log('초대 만료됨 - 정리 후 일반 로그인');
            localStorage.removeItem('pendingInvitation');
            navigate('/main', { replace: true });
            return;
          }
          
          if (invitationData.email === responseData.email) {
            // 초대받은 이메일과 로그인한 이메일이 일치하면 초대 페이지로 이동
            console.log('초대 이메일과 로그인 이메일이 일치함. 초대 페이지로 이동:', invitationData.url);
            navigate(invitationData.url, { replace: true });
          } else {
            // 다른 이메일로 로그인한 경우 경고
            console.log('다른 이메일로 로그인함:', { expected: invitationData.email, actual: responseData.email });
            alert(`초대는 ${invitationData.email}로 발송되었습니다. 해당 계정으로 로그인해주세요.`);
            navigate('/main', { replace: true });
          }
        } else {
          // 일반 로그인
          navigate('/main', { replace: true });
        }
      } catch (error) {
        console.error('초대 정보 처리 오류:', error);
        localStorage.removeItem('pendingInvitation');
        navigate('/main', { replace: true });
      }

    } catch (error) {
      console.error('로그인 성공 처리 중 오류:', error);
      setError('로그인 처리 중 오류가 발생했습니다.');
      
      // Clean up on failure
      ['access_token', 'refresh_token', 'isLoggedIn', 'userEmail', 'userName', 'userId']
        .forEach(key => localStorage.removeItem(key));
    }
  };

  // Email/Password login
  const handleLogin = async (e) => {
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
      
      if (response.data?.access_token) { // 토큰이 있으면 로그인 성공 함수 호출
        handleLoginSuccess(response.data);
      } else {
        throw new Error('서버에서 올바른 로그인 정보를 받지 못했습니다.');
      }
    } catch (error) {
      console.error('Login error:', error.response?.data || error);
      
      if (error.response?.status === 401) {
        const detail = error.response.data.detail;
        if (detail.includes('이메일 인증이 필요합니다')) {
          setError("이메일 인증이 필요합니다. 이메일을 확인하여 인증을 완료해주세요.");
        } else {
          setError(detail || "이메일 또는 비밀번호가 일치하지 않습니다.");
        }
      } else if (error.response?.status === 409) {
        setError(error.response.data.detail || "이미 가입된 이메일입니다.");
      } else if (error.response?.status === 422) {
        setError("입력 정보가 올바르지 않습니다.");
      } else if (error.response?.status === 429) {
        setError("너무 많은 로그인 시도입니다. 잠시 후 다시 시도해주세요.");
      } else if (error.response?.status === 500) {
        setError("서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      } else {
        setError("로그인 중 오류가 발생했습니다.");
      }
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

          // 백엔드에 구글 OAuth 요청
          const loginResponse = await oauthAPI.google({
            access_token: accessToken,
            email,
            name
          });

          console.log('구글 OAuth 응답:', loginResponse.data);

          // extra_info_required 응답 처리 (신규 회원)
          if (loginResponse.data.extra_info_required) {
            console.log('구글 신규 회원 - 추가 정보 필요:', loginResponse.data);
            setGoogleSignup({
              ...googleSignup,
              showForm: true,
              email: loginResponse.data.email || email,
              name: name || "",
              extraName: "",  // 사용자가 직접 입력하도록 빈 값으로 설정
              error: ""
            });
            return;
          }

          // 로그인 성공 처리
          if (loginResponse.data?.access_token) {
            handleLoginSuccess(loginResponse.data);
          } else {
            throw new Error('서버에서 올바른 로그인 정보를 받지 못했습니다.');
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
          {/* 초대 컨텍스트 표시 */}
          {invitationContext && (
            <div className="w-full mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center mb-2">
                <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h3 className="font-medium text-yellow-800">프로젝트 초대</h3>
              </div>
              <p className="text-sm text-yellow-700 mb-1">
                <strong>"{invitationContext.project}"</strong> 프로젝트에 초대받았습니다.
              </p>
              <p className="text-xs text-yellow-600">
                초대자: {invitationContext.inviter} | 초대 이메일: {invitationContext.email}
              </p>
            </div>
          )}
          
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
                onSubmit={handleLogin}
                onUpdate={updateFormData}
              />
              
              {/* 비밀번호 찾기 링크 */}
              <div className="w-full text-center mt-3 mb-4">
                <button
                  type="button"
                  onClick={handleForgotPasswordOpen}
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                >
                  비밀번호를 잊으셨나요?
                </button>
              </div>
              
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

      {/* 비밀번호 찾기 모달 */}
      {forgotPassword.showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            {!forgotPassword.success ? (
              // 이메일 입력 폼
              <>
                <div className="text-center mb-6">
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
                    <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.74 5.74L9.5 13H8a1 1 0 01-1-1V9.5l3.26-3.26A6 6 0 0117 7z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">비밀번호 찾기</h2>
                  <p className="text-gray-600">
                    가입하신 이메일 주소를 입력해주세요.<br/>
                    임시 비밀번호를 발송해드립니다.
                  </p>
                </div>

                <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                  <div>
                    <input
                      type="email"
                      placeholder="이메일 주소를 입력하세요"
                      value={forgotPassword.email}
                      onChange={(e) => setForgotPassword(prev => ({ ...prev, email: e.target.value, error: "" }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {forgotPassword.error && (
                    <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                      {forgotPassword.error}
                    </div>
                  )}

                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={handleForgotPasswordClose}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      disabled={forgotPassword.loading}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                        forgotPassword.loading
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-500 text-white hover:bg-blue-600'
                      }`}
                    >
                      {forgotPassword.loading ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="m15.75 9.53-1.5-1.5a.75.75 0 00-1.06 1.06l.97.97H8.25a.75.75 0 000 1.5h5.91l-.97.97a.75.75 0 101.06 1.06l1.5-1.5A.75.75 0 0015.75 9.53z" />
                          </svg>
                          전송 중...
                        </span>
                      ) : (
                        '임시 비밀번호 발송'
                      )}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              // 성공 화면
              <>
                <div className="text-center mb-6">
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                    <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 7.89a2 2 0 002.83 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">임시 비밀번호 발송 완료!</h2>
                  <p className="text-gray-600 mb-4">
                    <strong className="text-blue-600">{forgotPassword.email}</strong>로<br/>
                    임시 비밀번호를 발송했습니다.
                  </p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <div className="flex">
                    <svg className="flex-shrink-0 h-5 w-5 text-yellow-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div className="text-sm text-yellow-700">
                      <p className="font-medium mb-1">중요 안내:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>이메일함(스팸함 포함)을 확인하세요</li>
                        <li>임시 비밀번호로 로그인하세요</li>
                        <li>로그인 후 설정에서 새 비밀번호로 변경하세요</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleForgotPasswordSubmit}
                    disabled={forgotPassword.cooldown > 0}
                    className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                      forgotPassword.cooldown > 0
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    {forgotPassword.cooldown > 0
                      ? `${forgotPassword.cooldown}초 후 재전송 가능`
                      : '임시 비밀번호 재전송'
                    }
                  </button>

                  <button
                    onClick={handleForgotPasswordClose}
                    className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    로그인 화면으로 돌아가기
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default LoginPage;
