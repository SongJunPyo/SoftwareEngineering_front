import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { OrgProjectContext } from '../context/OrgProjectContext';
import axios from 'axios';

function KakaoCallbackPage() {
  const navigate = useNavigate();
  const { handleSocialLogin } = useContext(OrgProjectContext);

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

        // 백엔드에 인가코드 전송
        const response = await axios.post('/api/v1/oauth/kakao', { code });
        console.log('카카오 로그인 응답:', response.data);

        // 응답 데이터 확인
        if (!response.data) {
          throw new Error('서버 응답이 올바르지 않습니다.');
        }

        // 추가 정보가 필요한 경우 (회원가입)
        if (response.data.extra_info_required) {
          console.log('추가 정보 필요:', response.data);
          navigate(`/signup?email=${encodeURIComponent(response.data.email)}&name=${encodeURIComponent(response.data.name || '')}&provider=kakao`);
          return;
        }

        // 로그인 성공
        if (response.data.message === "로그인 성공" || 
            (response.data.email && response.data.name)) {
          console.log('로그인 성공 데이터:', response.data);
          
          // 임시 토큰 생성 (실제로는 백엔드에서 받아야 함)
          const tempToken = `temp_${response.data.user_id}_${Date.now()}`;
          
          handleSocialLogin(
            response.data.email, 
            response.data.name || response.data.email.split('@')[0], // 이름이 없으면 이메일에서 추출
            tempToken
          );
          return;
        }

        // 기타 경우
        console.error('예상치 못한 응답:', response.data);
        throw new Error('로그인 처리 중 오류가 발생했습니다.');

      } catch (error) {
        console.error('카카오 로그인 처리 중 오류:', error);
        
        // 구글 계정 연동 에러
        if (error.response?.status === 409 && 
            error.response?.data?.detail?.includes('구글')) {
          alert('구글계정으로 연동되어있는 이메일입니다.');
        } 
        // 서버 에러
        else if (error.response?.status >= 500) {
          alert('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        }
        // 기타 에러
        else {
          alert('카카오 로그인에 실패했습니다. 다시 시도해주세요.');
        }
        
        navigate('/login');
      }
    };

    processKakaoLogin();
  }, [navigate, handleSocialLogin]);

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