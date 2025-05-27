import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
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
        const userInfoResponse = await axios.get(
          'https://www.googleapis.com/oauth2/v3/userinfo',
          {
            headers: {
              Authorization: `Bearer ${tokenResponse.access_token}`,
            },
          }
        );

        const { email, name, picture } = userInfoResponse.data;
        console.log("Google 로그인 성공:", { email, name, picture }); // 로깅을 위해 사용
        
        // 로그인 성공 처리
        handleGoogleLoginSuccess(email, name);
      } catch (error) {
        console.error('구글 로그인 중 오류 발생:', error);
        alert('구글 로그인 중 오류가 발생했습니다.');
      }
    },
    onError: () => {
      console.error('구글 로그인 실패');
      alert('구글 로그인에 실패했습니다.');
    },
  });

  // 이메일/비밀번호 로그인 시
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      // DB에서 사용자 확인
      const response = await axios.post('http://localhost:8005/api/v1/login', {
        email: email,
        password: password
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.message === "로그인 성공") {
        onLogin(email, password, response.data.name || "");
        navigate('/main', { replace: true });
      } else {
        setError(response.data.detail || "로그인에 실패했습니다.");
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

  // 구글 로그인 성공 시
  const handleGoogleLoginSuccess = async (googleEmail, googleName = "") => {
    try {
      // 1. 이메일로 회원 존재 여부 확인
      const res = await axios.post('http://localhost:8005/api/v1/check-email', { email: googleEmail });
      if (res.data.exists) {
        // 이미 회원이면 바로 로그인 처리
        onLogin(googleEmail, '', googleName);
        navigate('/main', { replace: true });
      } else {
        // 추가 정보 입력 폼 표시
        setShowExtraForm(true);
        setGoogleEmail(googleEmail);
        setGoogleName(googleName || "");
        setExtraName(googleName || "");
      }
    } catch (err) {
      setError("구글 로그인 중 오류가 발생했습니다.");
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
      const response = await axios.post('http://localhost:8005/api/v1/register', {
        email: googleEmail,
        name: extraName,
        password: extraPassword,
        password_confirm: extraPasswordConfirm
      });
      if (response.data.message === "회원가입 성공") {
        onLogin(googleEmail, extraPassword, extraName);
        navigate('/main', { replace: true });
      }
    } catch (error) {
      setExtraError("회원가입 중 오류가 발생했습니다.");
    }
  };

  // 카카오 로그인 핸들러
  const handleKakaoLogin = () => {
    const KAKAO_CLIENT_ID = '4eb3eb8b216e68f32dc551a30aa4bf15';
    const REDIRECT_URI = 'http://localhost:3000/oauth/kakao/callback';
    window.location.href =
      `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code`;
  };

  // 네이버 로그인 핸들러
  const handleNaverLogin = () => {
    const NAVER_CLIENT_ID = 'Z23l4FA17iEUlK9FPEsn';
    const REDIRECT_URI = 'http://localhost:3000/oauth/naver/callback';
    const STATE = Math.random().toString(36).substring(2, 15); // CSRF 방지용
    window.location.href =
      `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${NAVER_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=${STATE}`;
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
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
      <main className="flex-1 flex flex-col md:flex-row items-center justify-center gap-10 px-4 pt-32">
        {/* 왼쪽 소개 영역 */}
        <section className="flex-1 p-8 rounded-lg bg-white max-w-md w-full">
          <h1 className="text-4xl md:text-4xl font-bold leading-tight mb-3">
            당신의 계획이 빛나게
          </h1>
          <h2 className="text-4xl md:text-5xl font-bold border-b-8 border-yellow-300 pb-1 inline-block">
            Planora
          </h2>
          <p className="text-xl md:text-1xl mt-4">이 프로젝트 업무 도구는 당신의 하루를 체계적으로 계획할 수 있도록 도와드립니다.</p>
        </section>

        {/* 로그인/추가정보 폼 영역 */}
        <section className="flex-1 p-8 rounded-lg bg-white flex flex-col items-center max-w-md w-full">
          {showExtraForm ? (
            <form className="w-full" onSubmit={handleGoogleSignup}>
              <div className="mb-4 text-lg font-bold">추가 정보 입력</div>
              <input
                type="email"
                value={googleEmail}
                readOnly
                className="w-full border border-gray-300 rounded px-4 py-2 mb-3 text-base bg-gray-100"
              />
              <input
                type="text"
                placeholder="이름을 입력하세요"
                className="w-full border border-gray-300 rounded px-4 py-2 mb-3 text-base"
                value={extraName}
                onChange={e => setExtraName(e.target.value)}
              />
              <input
                type="password"
                placeholder="비밀번호를 입력하세요"
                className="w-full border border-gray-300 rounded px-4 py-2 mb-1 text-base"
                value={extraPassword}
                onChange={e => setExtraPassword(e.target.value)}
              />
              <p className="text-xs text-gray-500 mb-2">
                비밀번호는 영문, 숫자, 특수기호를 포함하여 8자리 이상이어야 하며, 특수기호는 1개 이상 포함되어야 합니다.
              </p>
              <input
                type="password"
                placeholder="비밀번호를 다시 입력하세요"
                className="w-full border border-gray-300 rounded px-4 py-2 mb-3 text-base"
                value={extraPasswordConfirm}
                onChange={e => setExtraPasswordConfirm(e.target.value)}
              />
              {extraError && <div className="w-full mb-4 p-3 bg-red-100 text-red-700 rounded">{extraError}</div>}
              <button type="submit" className="bg-blue-500 text-white px-4 py-2 w-full rounded hover:bg-gray-600">회원가입</button>
            </form>
          ) : (
            <>
              {error && (
                <div className="w-full mb-4 p-3 bg-red-100 text-red-700 rounded">
                  {error}
                </div>
              )}
              <form className="w-full" onSubmit={handleSubmit}>
                <input
                  type="email"
                  placeholder="이메일을 입력하세요"
                  className="w-full border border-gray-300 rounded px-4 py-2 mb-3 text-base"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <input
                  type="password"
                  placeholder="비밀번호를 입력하세요"
                  className="w-full border border-gray-300 rounded px-4 py-2 mb-3 text-base"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 w-full rounded hover:bg-gray-600"
                >
                  로그인
                </button>
              </form>
              {/* 소셜 로그인 버튼 영역 - 시작하기 버튼과 버튼 사이에 여백 추가 */}
              <div className="flex flex-col w-full gap-2 mt-4">
                <button
                  onClick={() => login()}
                  className="bg-white text-gray-700 border border-gray-300 rounded px-4 py-2 w-full hover:bg-gray-100 flex items-center justify-center gap-2"
                >
                  <img
                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                    alt="Google"
                    className="w-5 h-5"
                  />
                  Google 계정으로 시작하기
                </button>
                <button className="bg-white text-gray-700 border border-gray-300 rounded px-4 py-2 w-full hover:bg-gray-100 flex items-center justify-center gap-2" onClick={handleKakaoLogin}>
                  <img src="https://developers.kakao.com/assets/img/about/logos/kakaotalksharing/kakaotalk_sharing_btn_medium.png" alt="Kakao" className="w-5 h-5" />
                  Kakao 계정으로 시작하기
                </button>
                <button className="bg-white text-gray-700 border border-gray-300 rounded px-4 py-2 w-full hover:bg-gray-100 flex items-center justify-center gap-2" onClick={handleNaverLogin}>
                  <img src={naverLogo} alt="Naver" className="w-5 h-5" />
                  Naver 계정으로 시작하기
                </button>
              </div>
              {/* 회원가입 버튼 */}
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
