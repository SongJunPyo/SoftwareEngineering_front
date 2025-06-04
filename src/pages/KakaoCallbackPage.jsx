import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
<<<<<<< Updated upstream
import axios from 'axios';
=======
import { useContext } from 'react';
import { OrgProjectContext } from '../context/OrgProjectContext';
import { oauthAPI } from '../api/api';
>>>>>>> Stashed changes

export default function KakaoCallbackPage() {
  const navigate = useNavigate();

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
      
      // 사용자 정보 저장
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userEmail', responseData.email);
      localStorage.setItem('userName', responseData.name || '');
      if (responseData.user_id) {
        localStorage.setItem('userId', responseData.user_id.toString());
      }

      console.log('카카오 로그인 성공:', {
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
      console.error('카카오 로그인 성공 처리 중 오류:', error);
      alert('로그인 처리 중 오류가 발생했습니다.');
      navigate('/login');
    }
  };

  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');
    if (code) {
      // 백엔드에 code 전달
      axios.post('http://localhost:8005/api/v1/oauth/kakao', { code })
        .then(res => {
          // 로그인/회원가입 성공 시 메인 페이지로 이동
          // 필요시 토큰/유저정보 저장
          navigate('/');
        })
        .catch(err => {
          if (err.response && err.response.status === 409 && err.response.data && typeof err.response.data.detail === 'string' && err.response.data.detail.includes('구글')) {
            alert('구글계정으로 연동되어있는 이메일입니다.');
          } else {
            alert('카카오 로그인에 실패했습니다.');
          }
          navigate('/login');
<<<<<<< Updated upstream
        });
    } else {
      alert('카카오 인증 코드가 없습니다.');
      navigate('/login');
    }
  }, [navigate]);
=======
          return;
        }

        console.log('카카오 인증 코드:', code);

        // 백엔드에 인가코드 전송
        const response = await oauthAPI.kakao(code);
        console.log('카카오 로그인 응답:', response.data);

        // 응답 데이터 검증
        if (!response.data) {
          throw new Error('서버 응답이 올바르지 않습니다.');
        }

        // 추가 정보가 필요한 경우 (회원가입)
        if (response.data.extra_info_required) {
          console.log('추가 정보 필요:', response.data);
          navigate(`/signup?email=${encodeURIComponent(response.data.email)}&name=${encodeURIComponent(response.data.name || '')}&provider=kakao`);
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
        console.error('카카오 로그인 처리 중 오류:', error);
        
        let errorMessage = '카카오 로그인에 실패했습니다. 다시 시도해주세요.';
        
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

    processKakaoLogin();
  }, [navigate, handleSocialLogin]);
>>>>>>> Stashed changes

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-lg">카카오 로그인 처리 중...</div>
    </div>
  );
} 