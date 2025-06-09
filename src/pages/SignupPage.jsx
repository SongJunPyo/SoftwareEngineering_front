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
  const [provider, setProvider] = useState("");
  
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
    // 쿼리스트링에서 email, name, provider 읽어오기 (신규 소셜 회원만)
    const params = new URLSearchParams(location.search);
    const emailParam = params.get("email");
    const providerParam = params.get("provider");
    
    // 초대 컨텍스트 확인
    const invitationContext = checkInvitationContext();
    
    // 이메일 설정 우선순위: 소셜로그인 > 초대 > 빈값
    if (emailParam) {
      setEmail(emailParam);
    } else if (invitationContext?.email) {
      setEmail(invitationContext.email);
    }
    
    // 소셜 로그인 프로바이더 설정
    if (providerParam) setProvider(providerParam);
  }, [location.search]);

  // 페이지 포커스 시 초대 컨텍스트 재확인
  useEffect(() => {
    const handleFocus = () => {
      console.log('회원가입 페이지 포커스 - 초대 컨텍스트 재확인');
      const invitationContext = checkInvitationContext();
      
      // 소셜 로그인이 아니고 이메일이 비어있다면 초대 이메일로 설정
      if (invitationContext?.email && !provider && !email) {
        setEmail(invitationContext.email);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [provider, email]);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!email || !password || !confirmPassword || !name) {
      setError("모든 필드를 입력해주세요.");
      return;
    }
    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    try {
      const response = await authAPI.register({
        email: email,
        password: password,
        password_confirm: confirmPassword,
        name: name,
        provider: provider || 'local'
      });
      if (response.data.message === "회원가입 성공") {
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
        navigate('/login');
      }
    } catch (error) {
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

        {/* 회원가입 폼 영역 */}
        <section className="flex-1 p-10 rounded-lg bg-white flex flex-col items-center mt-16">
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
            readOnly={!!provider || !!invitationContext} // 소셜 신규회원 또는 초대받은 경우 이메일 수정 불가
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
            className="bg-blue-500 text-white px-4 py-2 w-full rounded hover:bg-gray-600"
          >
            회원가입
          </button>

          {/* 로그인 페이지로 이동 버튼 */}
          <button
            onClick={() => navigate('/login')}
            className="mt-4 bg-gray-500 text-white px-4 py-2 w-full rounded hover:bg-blue-600"
          >
            로그인으로 돌아가기
          </button>
        </section>
      </main>
    </div>
  );
} 