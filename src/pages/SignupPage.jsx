import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function SignupPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!email || !password || !confirmPassword) {
      setError("모든 필드를 입력해주세요.");
      return;
    }
    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    try {
      const response = await axios.post('http://localhost:8005/api/v1/register', {
        email: email,
        password: password,
        password_confirm: confirmPassword,
        name: email.split('@')[0]
      });
      if (response.data.message === "회원가입 성공") {
        alert("회원가입이 완료되었습니다. 로그인해주세요.");
        navigate('/login');
      }
    } catch (error) {
      console.error('Signup error:', error.response?.data || error);
      if (error.response) {
        if (error.response.status === 422) {
          setError("이메일 형식이 올바르지 않습니다.");
        } else if (error.response.status === 409) {
          setError("이미 존재하는 이메일입니다.");
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

        {/* 회원가입 폼 영역 */}
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
          <input
            type="password"
            placeholder="비밀번호를 다시 입력하세요"
            className="w-full border border-gray-300 rounded px-4 py-2 mb-3 text-base"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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