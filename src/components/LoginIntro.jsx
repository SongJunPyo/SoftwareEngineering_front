import React from 'react';

function LoginIntro() {
  return (
    <section className="flex-1 p-8 rounded-lg bg-white max-w-md w-full">
      <h1 className="text-4xl md:text-4xl font-bold leading-tight mb-3">
        당신의 계획이 빛나게
      </h1>
      <h2 className="text-4xl md:text-5xl font-bold border-b-8 border-yellow-300 pb-1 inline-block">
        Planora
      </h2>
      <p className="text-xl md:text-1xl mt-4">
        이 프로젝트 업무 도구는 당신의 하루를 체계적으로 계획할 수 있도록 도와드립니다.
      </p>
    </section>
  );
}

export default LoginIntro; 