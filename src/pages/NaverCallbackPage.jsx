import React, { useEffect, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OrgProjectContext } from '../context/OrgProjectContext';
import { oauthAPI, setApiClientToken } from '../api/api';
import NaverSignupForm from '../components/NaverSignupForm';

function NaverCallbackPage() {
  const navigate = useNavigate();
  const { handleSocialLogin } = useContext(OrgProjectContext);
  const [showSignupForm, setShowSignupForm] = useState(false);
  const [naverSignup, setNaverSignup] = useState({
    email: '',
    name: '',
    extraPassword: '',
    extraPasswordConfirm: '',
    error: ''
  });

  // 공통 로그인 성공 처리 함수
  const handleLoginSuccess = (responseData) => {
    try {
      // 필수 필드 검증
      if (!responseData.access_token || !responseData.email) {
        throw new Error('서버 응답에 필수 정보가 누락되었습니다.');
      }

      // 토큰 저장
      localStorage.setItem('access_token', responseData.access_token);
      if (responseData.refresh_token) {
        localStorage.setItem('refresh_token', responseData.refresh_token);
      }
      
      // API 클라이언트 토큰 업데이트
      setApiClientToken(responseData.access_token);
      
      // 사용자 정보 저장
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userEmail', responseData.email);
      localStorage.setItem('userName', responseData.name || '');
      if (responseData.user_id) {
        localStorage.setItem('userId', responseData.user_id.toString());
      }

      console.log('네이버 로그인 성공:', {
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
      console.error('네이버 로그인 성공 처리 중 오류:', error);
      alert('로그인 처리 중 오류가 발생했습니다.');
      navigate('/login');
    }
  };

  // 비밀번호 유효성 검사 함수
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

  // 에러 메시지 처리 함수
  const getErrorMessage = (error) => {
    if (!error.response) {
      return error.message || "서버 연결에 실패했습니다.";
    }
    
    if (error.response?.data?.detail) {
      return error.response.data.detail;
    }
    
    return "네이버 회원가입 중 오류가 발생했습니다.";
  };

  // 네이버 회원가입 처리
  const handleNaverSignup = async (e) => {
    e.preventDefault();
    setNaverSignup(prev => ({ ...prev, error: "" }));
    
    const { email, name, extraPassword, extraPasswordConfirm } = naverSignup;

    // Validation
    if (!name.trim() || !extraPassword || !extraPasswordConfirm) {
      setNaverSignup(prev => ({ ...prev, error: "모든 필드를 입력해주세요." }));
      return;
    }
    
    const passwordErrors = validatePassword(extraPassword, extraPasswordConfirm);
    if (passwordErrors.length > 0) {
      setNaverSignup(prev => ({ ...prev, error: passwordErrors[0] }));
      return;
    }

    try {
      const response = await oauthAPI.naverRegister({
        email: email,
        name: name.trim(),
        password: extraPassword,
        password_confirm: extraPasswordConfirm
      });

      if (response.data?.access_token) {
        handleLoginSuccess(response.data);
      } else {
        throw new Error('서버에서 올바른 회원가입 정보를 받지 못했습니다.');
      }
    } catch (error) {
      console.error('네이버 회원가입 중 오류 발생:', error);
      setNaverSignup(prev => ({ ...prev, error: getErrorMessage(error) }));
    }
  };

  // 네이버 회원가입 폼 업데이트
  const updateNaverSignup = (field, value) => {
    setNaverSignup(prev => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    const processNaverLogin = async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state');
        
        if (!code) {
          alert('네이버 인증 코드가 없습니다.');
          navigate('/login');
          return;
        }

        console.log('네이버 인증 코드:', code);
        console.log('네이버 state:', state);

        // 백엔드에 인가코드 전송
        const response = await oauthAPI.naver(code, state);
        console.log('네이버 로그인 응답:', response.data);

        // 응답 데이터 검증
        if (!response.data) {
          throw new Error('서버 응답이 올바르지 않습니다.');
        }

        // extra_info_required 응답 처리 (신규 회원)
        if (response.data.extra_info_required) {
          console.log('네이버 신규 회원 - 추가 정보 필요:', response.data);
          setNaverSignup(prev => ({
            ...prev,
            email: response.data.email || '',
            name: ''  // 사용자가 직접 입력하도록 빈 값으로 설정
          }));
          setShowSignupForm(true);
          return;
        }

        // 새로운 응답 형식으로 로그인 성공 처리
        if (response.data.access_token && response.data.email) {
          handleLoginSuccess(response.data);
          return;
        }

        // 기존 형식 호환성 유지 (임시)
        if (response.data.message === "로그인 성공" || 
            (response.data.email && response.data.name)) {
          console.log('기존 형식으로 로그인 성공:', response.data);
          
          // 임시 토큰 생성 (실제로는 백엔드에서 받아야 함)
          const tempToken = `temp_${response.data.user_id}_${Date.now()}`;
          
          handleSocialLogin(
            response.data.email, 
            response.data.name || response.data.email.split('@')[0],
            tempToken
          );
          return;
        }

        // 예상치 못한 응답
        console.error('예상치 못한 응답:', response.data);
        throw new Error('로그인 처리 중 오류가 발생했습니다.');

      } catch (error) {
        console.error('네이버 로그인 처리 중 오류:', error);
        
        let errorMessage = '네이버 로그인에 실패했습니다. 다시 시도해주세요.';
        
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

    processNaverLogin();
  }, [navigate, handleSocialLogin]);

  // 추가 정보 입력 폼이 표시되는 경우
  if (showSignupForm) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">네이버 회원가입</h2>
            <p className="text-gray-600">추가 정보를 입력해주세요.</p>
          </div>
          
          <NaverSignupForm
            naverSignup={naverSignup}
            onSubmit={handleNaverSignup}
            onUpdate={updateNaverSignup}
          />
          
          <div className="text-center mt-4">
            <button
              onClick={() => navigate('/login')}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              로그인 페이지로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 로딩 화면
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">네이버 로그인 처리 중...</h2>
        <p className="text-gray-600">잠시만 기다려주세요.</p>
      </div>
    </div>
  );
}

export default NaverCallbackPage; 