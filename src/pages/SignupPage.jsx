import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { authAPI } from "../api/api";
import logo from '../components/planora.png';

export default function SignupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [signupLoading, setSignupLoading] = useState(false);
  
  // 이메일 인증 관련 상태
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [successMessage, setSuccessMessage] = useState("");
  
  // 초대 컨텍스트 상태
  const [invitationContext, setInvitationContext] = useState(null);

  // 초대 컨텍스트 확인 함수
  const checkInvitationContext = () => {
    try {
      const pendingInvitationStr = localStorage.getItem('pendingInvitation');
      if (!pendingInvitationStr) {
        console.log('회원가입 페이지 - 초대 컨텍스트 없음');
        setInvitationContext(null);
        return null;
      }
      
      const invitationData = JSON.parse(pendingInvitationStr);
      
      // 만료 체크
      if (Date.now() > invitationData.expires) {
        console.log('회원가입 페이지 - 초대 컨텍스트 만료됨, 정리');
        localStorage.removeItem('pendingInvitation');
        setInvitationContext(null);
        return null;
      }
      
      console.log('회원가입 페이지 - 초대 컨텍스트 발견:', invitationData);
      setInvitationContext({
        email: invitationData.email,
        project: invitationData.project,
        inviter: invitationData.inviter
      });
      return invitationData;
    } catch (error) {
      console.error('회원가입 페이지 - 초대 컨텍스트 파싱 오류:', error);
      localStorage.removeItem('pendingInvitation');
      setInvitationContext(null);
      return null;
    }
  };

  // 쿼리스트링 및 초대 컨텍스트 확인
  useEffect(() => {
    // 쿼리스트링에서 provider 확인 (소셜 로그인 사용자가 실수로 온 경우)
    const params = new URLSearchParams(location.search);
    const providerParam = params.get("provider");
    
    // 소셜 로그인 사용자가 실수로 회원가입 페이지에 온 경우
    if (providerParam) {
      alert("소셜 로그인은 별도의 회원가입이 필요하지 않습니다. 로그인 페이지에서 소셜 로그인을 이용해주세요.");
      navigate('/login');
      return;
    }
    
    // 초대 컨텍스트 확인
    const invitationContext = checkInvitationContext();
    
    // 초대 이메일이 있으면 설정
    if (invitationContext?.email) {
      setEmail(invitationContext.email);
    }
  }, [location.search, navigate]);

  // 페이지 포커스 시 초대 컨텍스트 재확인
  useEffect(() => {
    const handleFocus = () => {
      console.log('회원가입 페이지 포커스 - 초대 컨텍스트 재확인');
      const invitationContext = checkInvitationContext();
      
      // 이메일이 비어있다면 초대 이메일로 설정
      if (invitationContext?.email && !email) {
        setEmail(invitationContext.email);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [email]);

  // 재전송 카운트다운 타이머
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // 이메일 재전송 함수
  const handleResendVerification = async () => {
    if (resendCooldown > 0) return;
    
    setResendLoading(true);
    setError("");
    setSuccessMessage("");
    
    try {
      await authAPI.resendVerification(email);
      setSuccessMessage("인증 이메일이 재전송되었습니다. 메일함을 확인해주세요.");
      setResendCooldown(60); // 60초 쿨다운
    } catch (error) {
      console.error('이메일 재전송 오류:', error);
      if (error.response?.data?.detail) {
        setError(error.response.data.detail);
      } else {
        setError("이메일 재전송에 실패했습니다. 다시 시도해주세요.");
      }
    } finally {
      setResendLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setSignupLoading(true);
    
    if (!email || !password || !confirmPassword || !name) {
      setError("모든 필드를 입력해주세요.");
      setSignupLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      setSignupLoading(false);
      return;
    }
    try {
      const response = await authAPI.register({
        email: email,
        password: password,
        password_confirm: confirmPassword,
        name: name
      });
      
      if (response.data.message === "회원가입 요청이 완료되었습니다. 이메일을 확인하여 계정을 활성화해주세요.") {
        // 이메일 인증이 필요한 경우
        setShowEmailVerification(true);
        setSuccessMessage("회원가입이 완료되었습니다! 이메일을 확인하여 계정을 활성화해주세요.");
        setResendCooldown(60); // 60초 후 재전송 가능
        setSignupLoading(false);
      } else if (response.data.message === "회원가입 성공") {
        // 기존 로직 (OAuth 회원가입 등)
        // 초대 링크 처리
        try {
          const pendingInvitationStr = localStorage.getItem('pendingInvitation');
          if (pendingInvitationStr) {
            const invitationData = JSON.parse(pendingInvitationStr);
            
            // 만료 체크
            if (Date.now() > invitationData.expires) {
              console.log('회원가입 완료 - 초대 만료됨, 정리');
              localStorage.removeItem('pendingInvitation');
              alert("회원가입이 완료되었습니다. 로그인해주세요.");
            } else if (invitationData.email === email) {
              alert(`회원가입이 완료되었습니다. "${invitationData.project}" 프로젝트 초대를 수락하려면 로그인해주세요.`);
            } else {
              alert("회원가입이 완료되었습니다. 로그인해주세요.");
            }
          } else {
            alert("회원가입이 완료되었습니다. 로그인해주세요.");
          }
        } catch (error) {
          console.error('회원가입 후 초대 정보 처리 오류:', error);
          localStorage.removeItem('pendingInvitation');
          alert("회원가입이 완료되었습니다. 로그인해주세요.");
        }
        
        // 초대 정보를 유지하면서 로그인 페이지로 이동
        setSignupLoading(false);
        navigate('/login');
      }
    } catch (error) {
      setSignupLoading(false);
      console.error('Signup error:', error.response?.data || error);
      if (error.response) {
        if (error.response.status === 422) {
          setError("비밀번호 요구사항이 지켜지지 않았습니다.");
        } else if (error.response.status === 409) {
          if (error.response.data && typeof error.response.data.detail === 'string' && error.response.data.detail.includes('구글')) {
            setError("구글계정으로 연동되어있는 이메일입니다.");
          } else {
            setError("이미 존재하는 이메일입니다.");
          }
        } else if (error.response.status === 500 && error.response.data.detail.includes('이메일 전송')) {
          setError("이메일 전송에 실패했습니다. 다시 시도해주세요.");
        } else {
          setError("회원가입 중 오류가 발생했습니다.");
        }
      } else {
        setError("서버 연결에 실패했습니다.");
      }
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

      {/* 메인 컨테이너 */}
      <main className="mt-60 max-w-6xl mx-auto flex flex-col md:flex-row gap-10 px-10">
        {/* 왼쪽 소개 영역 */}
        <section className="flex-1 p-10 rounded-lg bg-white mt-40">
          <h1 className="text-4xl md:text-4xl font-bold leading-tight mb-3">
            당신의 계획이 빛나게
          </h1>
          <h2 className="text-4xl md:text-5xl font-bold border-b-8 border-yellow-300 pb-1 inline-block">
            Planora
          </h2>
          <p className="text-xl md:text-1xl mt-4">이 프로젝트 업무 도구는 당신의 하루를 체계적으로 계획할 수 있도록 도와드립니다.</p>
        </section>

        {/* 회원가입 폼 또는 이메일 인증 대기 화면 */}
        <section className="flex-1 p-10 rounded-lg bg-white flex flex-col items-center mt-16">
          {!showEmailVerification ? (
            // 회원가입 폼
            <>
              {/* 초대 컨텍스트 표시 */}
              {invitationContext && (
                <div className="w-full mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
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
              
              {error && (
                <div className="w-full mb-4 p-3 bg-red-100 text-red-700 rounded">
                  {error}
                </div>
              )}
              
              <input
                type="email"
                placeholder="이메일을 입력하세요"
                className="w-full border border-gray-300 rounded px-4 py-2 mb-3 text-base"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                readOnly={!!invitationContext}
              />
              <input
                type="password"
                placeholder="비밀번호를 입력하세요"
                className="w-full border border-gray-300 rounded px-4 py-2 mb-1 text-base"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="text-xs text-gray-500 mb-2">
                비밀번호는 영문, 숫자, 특수기호를 포함하여 8자리 이상이어야 하며, 특수기호는 1개 이상 포함되어야 합니다.
              </p>
              <input
                type="password"
                placeholder="비밀번호를 다시 입력하세요"
                className="w-full border border-gray-300 rounded px-4 py-2 mb-3 text-base"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <input
                type="text"
                placeholder="이름을 입력하세요"
                className="w-full border border-gray-300 rounded px-4 py-2 mb-3 text-base"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <button
                onClick={handleSignup}
                disabled={signupLoading}
                className={`w-full px-4 py-2 rounded font-medium transition-colors ${
                  signupLoading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {signupLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="m15.75 9.53-1.5-1.5a.75.75 0 00-1.06 1.06l.97.97H8.25a.75.75 0 000 1.5h5.91l-.97.97a.75.75 0 101.06 1.06l1.5-1.5A.75.75 0 0015.75 9.53z" />
                    </svg>
                    가입 중...
                  </span>
                ) : (
                  '회원가입'
                )}
              </button>

              <button
                onClick={() => navigate('/login')}
                className="mt-4 bg-gray-500 text-white px-4 py-2 w-full rounded hover:bg-blue-600"
              >
                로그인으로 돌아가기
              </button>
            </>
          ) : (
            // 이메일 인증 대기 화면
            <div className="w-full max-w-md">
              {/* 성공 메시지 */}
              <div className="text-center mb-6">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                  <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 7.89a2 2 0 002.83 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">이메일을 확인해주세요!</h2>
                <p className="text-gray-600 mb-4">
                  <strong className="text-blue-600">{email}</strong>로<br/>
                  인증 이메일을 발송했습니다.
                </p>
              </div>

              {/* 안내 메시지 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex">
                  <svg className="flex-shrink-0 h-5 w-5 text-blue-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-blue-700">
                    <p className="font-medium mb-1">다음 단계:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>이메일함(스팸함 포함)을 확인하세요</li>
                      <li>인증 링크를 클릭하여 계정을 활성화하세요</li>
                      <li>인증 완료 후 로그인하세요</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* 성공/에러 메시지 */}
              {successMessage && (
                <div className="w-full mb-4 p-3 bg-green-100 text-green-700 rounded-lg">
                  {successMessage}
                </div>
              )}
              
              {error && (
                <div className="w-full mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                  {error}
                </div>
              )}

              {/* 재전송 버튼 */}
              <div className="space-y-3">
                <button
                  onClick={handleResendVerification}
                  disabled={resendLoading || resendCooldown > 0}
                  className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                    resendLoading || resendCooldown > 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  {resendLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="m15.75 9.53-1.5-1.5a.75.75 0 00-1.06 1.06l.97.97H8.25a.75.75 0 000 1.5h5.91l-.97.97a.75.75 0 101.06 1.06l1.5-1.5A.75.75 0 0015.75 9.53z" />
                      </svg>
                      전송 중...
                    </span>
                  ) : resendCooldown > 0 ? (
                    `${resendCooldown}초 후 재전송 가능`
                  ) : (
                    '인증 이메일 재전송'
                  )}
                </button>

                <button
                  onClick={() => navigate('/login')}
                  className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  로그인 페이지로 이동
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
} 