import React from 'react';
import naverLogo from './naver-icon-file.png';

function SocialLoginButtons({ onGoogleLogin, onKakaoLogin, onNaverLogin }) {
  return (
    <div className="flex flex-col w-full gap-2 mt-4">
      <button
        onClick={onGoogleLogin}
        className="bg-white text-gray-700 border border-gray-300 rounded px-4 py-2 w-full hover:bg-gray-100 flex items-center justify-center gap-2"
      >
        <img
          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
          alt="Google"
          className="w-5 h-5"
        />
        Google 계정으로 시작하기
      </button>
      
      <button 
        onClick={onKakaoLogin}
        className="bg-white text-gray-700 border border-gray-300 rounded px-4 py-2 w-full hover:bg-gray-100 flex items-center justify-center gap-2"
      >
        <img 
          src="https://developers.kakao.com/assets/img/about/logos/kakaotalksharing/kakaotalk_sharing_btn_medium.png" 
          alt="Kakao" 
          className="w-5 h-5" 
        />
        Kakao 계정으로 시작하기
      </button>
      
      <button 
        onClick={onNaverLogin}
        className="bg-white text-gray-700 border border-gray-300 rounded px-4 py-2 w-full hover:bg-gray-100 flex items-center justify-center gap-2"
      >
        <img 
          src={naverLogo} 
          alt="Naver" 
          className="w-5 h-5" 
        />
        Naver 계정으로 시작하기
      </button>
    </div>
  );
}

export default SocialLoginButtons; 