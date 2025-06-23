import React, { useEffect, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OrgProjectContext } from '../context/OrgProjectContext';
import { oauthAPI, authAPI, setApiClientToken } from '../api/api';
import KakaoSignupForm from '../components/KakaoSignupForm';

function KakaoCallbackPage() {
  const navigate = useNavigate();
  const { handleSocialLogin } = useContext(OrgProjectContext);
  
  // Kakao signup form states
  const [kakaoSignup, setKakaoSignup] = useState({
    showForm: false,
    email: "",
    extraName: "",
    code: "",
    error: ""
  });

  // Kakao signup handler
  const handleKakaoSignup = async (e) => {
    e.preventDefault();
    setKakaoSignup(prev => ({ ...prev, error: "" }));
    
    const { extraName } = kakaoSignup;

    // Validation
    if (!extraName.trim()) {
      setKakaoSignup(prev => ({ ...prev, error: "이름을 입력해주세요." }));
      return;
    }

    try {
      const response = await oauthAPI.kakao({ 
        code: kakaoSignup.code, 
        name: extraName.trim() 
      });

      if (response.data?.access_token) {
        handleLoginSuccess(response.data);
      } else {
        throw new Error('서버에서 올바른 회원가입 정보를 받지 못했습니다.');
      }
    } catch (error) {
      console.error('카카오 회원가입 중 오류 발생:', error);
      setKakaoSignup(prev => ({ 
        ...prev, 
        error: error.response?.data?.detail || error.message || '카카오 회원가입에 실패했습니다.' 
      }));
    }
  };

  // Update kakao signup form
  const updateKakaoSignup = (field, value) => {
    setKakaoSignup(prev => ({ ...prev, [field]: value }));
  };

  // 공통 로그인 성공 처리 함수
  const handleLoginSuccess = (responseData) => {
    try {
      // 필수 필드 검증
      if (!responseData.access_token || !responseData.email) {
        throw new Error('서버 응답에 필수 정보가 누락되었습니다.');
      }

      // Store tokens and user data (동일한 방식으로 처리)
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

      // API 클라이언트에 토큰 설정 - 이게 중요!
      setApiClientToken(responseData.access_token);

      console.log('카카오 로그인 성공:', {
        email: responseData.email,
        name: responseData.name,
        userId: responseData.user_id
      });

      // Context 핸들러 호출
      handleSocialLogin(
        responseData.email, 
        responseData.name || responseData.email.split('@')[0],
        responseData.access_token
      );
      
    } catch (error) {
      console.error('카카오 로그인 성공 처리 중 오류:', error);
      alert('로그인 처리 중 오류가 발생했습니다.');
      navigate('/login');
    }
  };

  useEffect(() => {
    const processKakaoLogin = async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');
        
        if (!code) {
          alert('카카오 인증 코드가 없습니다.');
          navigate('/login');
          return;
        }

        console.log('카카오 인증 코드:', code);

        // First, try to login without name (for existing users)
        try {
          const response = await oauthAPI.kakao({ code });
          console.log('카카오 로그인 응답:', response.data);

          if (response.data?.access_token) {
            handleLoginSuccess(response.data);
            return;
          }
        } catch (loginError) {
          // If user doesn't exist (400 error with SIGNUP_REQUIRED), show signup form
          if (loginError.response?.status === 400 && 
              loginError.response?.data?.detail?.startsWith('SIGNUP_REQUIRED:')) {
            
            const email = loginError.response.data.detail.split(':')[1];
            setKakaoSignup({
              showForm: true,
              email: email || "카카오 이메일",
              extraName: "",
              code: code,
              error: ""
            });
            return;
          } else {
            // Other errors, re-throw
            throw loginError;
          }
        }

      } catch (error) {
        console.error('카카오 로그인 처리 중 오류:', error);
        
        let errorMessage = '카카오 로그인에 실패했습니다. 다시 시도해주세요.';
        
        // 구글 계정 연동 에러
        if (error.response?.status === 409 && 
            error.response?.data?.detail?.includes('구글')) {
          errorMessage = '구글계정으로 연동되어있는 이메일입니다.';
        } 
        // 서버 에러
        else if (error.response?.status >= 500) {
          errorMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
        }
        // 기타 에러
        else if (error.message) {
          errorMessage = error.message;
        }
        
        alert(errorMessage);
        navigate('/login');
      }
    };

    processKakaoLogin();
  }, [navigate, handleSocialLogin]);

  if (kakaoSignup.showForm) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <KakaoSignupForm 
            kakaoSignup={kakaoSignup}
            onSubmit={handleKakaoSignup}
            onUpdate={updateKakaoSignup}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">카카오 로그인 처리 중...</h2>
        <p className="text-gray-600">잠시만 기다려주세요.</p>
      </div>
    </div>
  );
}

export default KakaoCallbackPage;