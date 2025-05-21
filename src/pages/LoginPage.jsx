import React, { useState } from "react";
import GoogleLoginBtn from '../components/GoogleLoginBtn';
import { useNavigate } from "react-router-dom";
import axios from 'axios';

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

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
        onLogin(email, password);
        navigate('/board');
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
  const handleGoogleLoginSuccess = (googleEmail) => {
    console.log("✅ Google 로그인 성공:", googleEmail);
    onLogin(googleEmail, '');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* 상단 헤더 */}
      <header className="fixed top-0 left-0 w-full bg-white shadow-md z-10 p-5">
        <div className="flex justify-between items-center w-full">
          <div className="text-2xl font-bold text-black">Planora</div>
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

        {/* 로그인 폼 영역 */}
        <section className="flex-1 p-10 rounded-lg bg-white flex flex-col items-center mt-16">
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
          />
          <input
            type="password"
            placeholder="비밀번호를 입력하세요"
            className="w-full border border-gray-300 rounded px-4 py-2 mb-3 text-base"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            onClick={handleSubmit}
            className="bg-blue-500 text-white px-4 py-2 w-full rounded hover:bg-gray-600"
          >
            시작하기
          </button>

          <p className="text-center my-4 text-base">SNS 로그인</p>

          <div className="flex justify-between w-full gap-2">
            <div className="w-1/2">
              <GoogleLoginBtn onLoginSuccess={handleGoogleLoginSuccess}/>
            </div>
            <button className="bg-white text-gray-700 border border-gray-300 rounded px-4 py-2 w-1/2 hover:bg-gray-100">
              Kakao
            </button>
          </div>

          {/* 회원가입 버튼 */}
          <button
            onClick={() => navigate('/signup')}
            className="mt-4 bg-gray-500 text-white px-4 py-2 w-full rounded hover:bg-blue-600"
          >
            회원가입
          </button>
        </section>
      </main>
    </div>
  );
}

export default LoginPage;
