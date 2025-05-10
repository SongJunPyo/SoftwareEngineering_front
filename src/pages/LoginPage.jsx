// import React, { useState } from "react";
// import logo from "../components/planora.png";

// function LoginPage({ onLogin }) {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");

//   return (
//     <div className="min-h-screen bg-white">
//       {/* 고정 헤더 */}
//       <header className="fixed top-0 left-0 w-full bg-white shadow-md z-10 p-5">
//             <div className="flex justify-between items-center w-full">
//             {/* <div className="text-2xl font-bold text-black">로고</div> */}
//             <img src={logo} alt="Planora Logo" className="h-8" />
//             <div className="flex items-center space-x-2"> {/* 변경: gap 대신 space-x-2 사용 */}
//             <button className="text-black text-base">도움말</button>
//             <button className="text-black text-base">로그인</button>
//             <button
//                 onClick={() => onLogin(email, password)}
//                 className="text-black text-base border border-black rounded px-6 py-2 hover:bg-black hover:text-white whitespace-nowrap"
//       >
//         시작하기
//       </button>
//     </div>
//   </div>
// </header>


//       {/* 메인 컨테이너 */}
//       <main className="mt-36 max-w-6xl mx-auto flex flex-col md:flex-row gap-10 px-4">
//         {/* 왼쪽 섹션 */}
//         <section className="flex-1 p-10 rounded-lg bg-white bg-[linear-gradient(90deg,_#f8f8f8_1px,_transparent_1px),_linear-gradient(#f8f8f8_1px,_transparent_1px)] bg-[size:40px_40px]">
//           <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
//             <span className="block border-b-8 border-yellow-200 pb-1 inline-block">
//               당신의 프로젝트,
//             </span>
//             <br />지금 시작해보세요.
//           </h1>
//           <p className="text-xl md:text-2xl">쉽고 빠르게 업무를 관리할 수 있어요.</p>
//         </section>

//         {/* 오른쪽 섹션 */}
//         <section className="flex-1 p-10 rounded-lg bg-white bg-[linear-gradient(90deg,_#f8f8f8_1px,_transparent_1px),_linear-gradient(#f8f8f8_1px,_transparent_1px)] bg-[size:40px_40px] flex flex-col items-center">
//           <input
//             type="text"
//             placeholder="이메일"
//             className="w-full border border-gray-300 rounded px-4 py-2 mb-3 text-base"
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//           />
//           <input
//             type="password"
//             placeholder="비밀번호"
//             className="w-full border border-gray-300 rounded px-4 py-2 mb-3 text-base"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//           />

//           <button
//             // onClick={() => alert("회원가입은 현재 지원되지 않습니다.")}
//             onClick={() => onLogin(email, password)}
//             className="bg-blue-500 text-white px-4 py-2 w-full rounded hover:bg-blue-600"
//           >
//             시작하기
//           </button>

//           <p className="text-center my-4 text-base">또는 다음으로 계속하기</p>

//           <div className="flex justify-between w-full gap-2">
//             <button className="bg-white text-gray-700 border border-gray-300 rounded px-4 py-2 w-1/2 hover:bg-gray-100">
//               Google
//             </button>
//             <button className="bg-white text-gray-700 border border-gray-300 rounded px-4 py-2 w-1/2 hover:bg-gray-100">
//               Microsoft
//             </button>
//           </div>

//           {/* 실제 로그인 처리 버튼 */}
//           <button
//             // onClick={() => onLogin(email, password)}
//             onClick={() => alert("회원가입은 현재 지원되지 않습니다.")}
//             className="mt-4 bg-blue-500 text-white px-4 py-2 w-full rounded hover:bg-blue-600"
//           >
//             회원가입
//           </button>
//         </section>
//       </main>
//     </div>
//   );
// }

// export default LoginPage;


import React, { useState } from "react";

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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

        {/* 로그인 폼 영역 (아래로 이동) */}
        <section className="flex-1 p-10 rounded-lg bg-white flex flex-col items-center mt-16">
	  <img src="/logo_demo.png" alt="로그인 이미지" className="w-24 h-24 mb-6" />
          <input
            type="text"
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
            
            onClick={() => onLogin(email, password)}
            className="bg-blue-500 text-white px-4 py-2 w-full rounded hover:bg-gray-600"
          >
            시작하기
          </button>

          <p className="text-center my-4 text-base">SNS 로그인</p>

          <div className="flex justify-between w-full gap-2">
            <button className="bg-white text-gray-700 border border-gray-300 rounded px-4 py-2 w-1/2 hover:bg-gray-100">
              Google
            </button>
            <button className="bg-white text-gray-700 border border-gray-300 rounded px-4 py-2 w-1/2 hover:bg-gray-100">
              Kakao
            </button>
          </div>

          {/* 로그인 버튼 */}
          <button
            onClick={() => alert("회원가입은 현재 지원되지 않습니다.")}
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