import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectAPI, authAPI } from '../api/api';

export default function InviteAcceptPage() {
  const { invitationId } = useParams();
  const navigate = useNavigate();
  
  // 상태 관리
  const [step, setStep] = useState(''); // '', loading, invitation-check, login-check, ready, success, error, redirect
  const [invitationInfo, setInvitationInfo] = useState(null);
  const [currentUser, setCurrentUser] = useState(undefined); // undefined: 확인 중, null: 로그아웃, object: 로그인
  const [userExists, setUserExists] = useState(null);
  const [message, setMessage] = useState('');
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [error, setError] = useState('');
  const [workspaces, setWorkspaces] = useState([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(null);
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);

  // 초기화: 현재 사용자 정보 확인
  useEffect(() => {
    const userEmail = localStorage.getItem('userEmail');
    const userName = localStorage.getItem('userName');
    const token = localStorage.getItem('access_token');
    
    console.log('현재 사용자 정보 확인:', { userEmail, userName, hasToken: !!token });
    
    if (userEmail && token) {
      setCurrentUser({ email: userEmail, name: userName });
      console.log('로그인된 사용자:', { email: userEmail, name: userName });
    } else {
      setCurrentUser(null);
      console.log('로그인되지 않은 상태');
    }
  }, []);

  // 초대장 정보 및 처리 플로우
  useEffect(() => {
    // currentUser 상태가 아직 확인 중이면 대기
    if (currentUser === undefined) {
      console.log('사용자 정보 확인 중 - 대기');
      return;
    }

    // 이미 실행 중이거나 완료된 경우 중복 실행 방지
    if (step !== '' && step !== 'loading') {
      console.log('이미 처리 중 또는 완료 - 스킵:', step);
      return;
    }

    const processInvitation = async () => {
      if (!invitationId) {
        setStep('error');
        setError('잘못된 초대 링크입니다.');
        return;
      }

      try {
        setStep('loading');
        setMessage('초대장 정보를 확인하는 중...');
        console.log('초대장 처리 시작:', { invitationId, currentUser: currentUser?.email });

        // 1. 초대장 정보 조회 (인증 불필요)
        console.log('API 요청 시작:', `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:8005'}/api/v1/projects/invitations/${invitationId}/info`);
        
        const inviteResponse = await projectAPI.getInvitationInfo(invitationId);
        console.log('API 응답 원본:', inviteResponse);
        
        const inviteData = inviteResponse.data;
        
        console.log('초대장 정보 조회 성공:', inviteData);
        setInvitationInfo(inviteData);

        // 초대 정보를 localStorage에 저장
        const invitationData = {
          invitationId: invitationId,
          url: `/invite/${invitationId}`,
          email: inviteData.email,
          project: inviteData.project.title,
          inviter: inviteData.inviter.name,
          timestamp: Date.now()
        };
        
        localStorage.setItem('pendingInvitation', JSON.stringify(invitationData));
        console.log('localStorage에 초대 정보 저장 완료:', invitationData);

        // 초대장 상태 확인 (백엔드에서 만료도 체크됨)
        if (inviteData.status === 'accepted') {
          localStorage.removeItem('pendingInvitation');
          setStep('error');
          setError('이미 수락된 초대장입니다.');
          return;
        }
        
        if (inviteData.status === 'rejected') {
          localStorage.removeItem('pendingInvitation');
          setStep('error');
          setError('거절된 초대장입니다.');
          return;
        }


        // 2. 로그인 상태에 따른 처리
        if (currentUser) {
          // 로그인되어 있는 경우
          console.log('로그인된 사용자 초대 처리:', { currentUser: currentUser.email, inviteEmail: inviteData.email });
          
          if (currentUser.email === inviteData.email) {
            // 이메일이 일치하면 워크스페이스 목록 조회 후 초대 수락 준비
            console.log('이메일 일치 - 워크스페이스 목록 조회');
            await fetchWorkspaces();
            setStep('ready');
            setMessage('프로젝트 초대를 수락하시겠습니까?');
          } else {
            // 다른 계정으로 로그인된 경우
            console.log('이메일 불일치 - 계정 변경 안내');
            setStep('redirect');
            setMessage(`이 초대는 ${inviteData.email}로 발송되었습니다. 해당 계정으로 로그인해주세요.`);
          }
        } else {
          // 로그인되어 있지 않은 경우
          setMessage('사용자 계정을 확인하는 중...');
          
          try {
            // 3. 사용자 존재 여부 확인
            const emailCheckResponse = await authAPI.checkEmail(inviteData.email);
            const emailExists = emailCheckResponse.data.exists;
            
            setUserExists(emailExists);
            
            if (emailExists) {
              // 사용자 존재 → 로그인 페이지로
              console.log('기존 사용자 발견 - 로그인 페이지로 이동');
              setStep('redirect');
              setMessage(`${inviteData.email} 계정이 존재합니다. 로그인이 필요합니다.`);
              setTimeout(() => {
                console.log('로그인 페이지로 자동 이동');
                navigate('/login');
              }, 3000);
            } else {
              // 사용자 없음 → 회원가입 페이지로
              console.log('신규 사용자 - 회원가입 페이지로 이동');
              setStep('redirect');
              setMessage(`${inviteData.email}로 계정을 생성해야 합니다. 회원가입이 필요합니다.`);
              setTimeout(() => {
                console.log('회원가입 페이지로 자동 이동');
                navigate('/signup');
              }, 3000);
            }
          } catch (emailCheckError) {
            console.error('이메일 확인 실패:', emailCheckError);
            // 에러 시 로그인 페이지로 기본 이동
            setStep('redirect');
            setMessage('로그인이 필요합니다. 잠시 후 로그인 페이지로 이동합니다...');
            setTimeout(() => {
              navigate('/login');
            }, 3000);
          }
        }
      } catch (error) {
        console.error('초대장 처리 실패:', error);
        console.error('에러 상세:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
        
        setStep('error');
        if (error.response?.status === 404) {
          setError('초대장을 찾을 수 없습니다.');
        } else if (error.response?.status === 500) {
          setError('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        } else if (error.code === 'NETWORK_ERROR') {
          setError('네트워크 연결을 확인해주세요.');
        } else {
          setError(`초대장 처리 중 오류가 발생했습니다. (${error.response?.status || 'Unknown'})`);
        }
      }
    };

    processInvitation();
  }, [invitationId, currentUser]); // currentUser 의존성 추가로 로그인 상태 변경 시 재실행

  // 워크스페이스 목록 조회
  const fetchWorkspaces = async () => {
    try {
      const response = await projectAPI.getUserWorkspaces();
      const workspaceList = response.data.workspaces || [];
      setWorkspaces(workspaceList);
      
      // 첫 번째 워크스페이스를 기본 선택
      if (workspaceList.length > 0) {
        setSelectedWorkspaceId(workspaceList[0].workspace_id);
      }
    } catch (error) {
      console.error('워크스페이스 목록 조회 실패:', error);
      setWorkspaces([]);
    }
  };

  // 워크스페이스 생성
  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) {
      alert('워크스페이스 이름을 입력해주세요.');
      return;
    }

    setIsCreatingWorkspace(true);
    try {
      const response = await projectAPI.createUserWorkspace(newWorkspaceName.trim());
      const newWorkspace = response.data;
      
      // 워크스페이스 목록에 추가하고 선택
      setWorkspaces(prev => [...prev, newWorkspace]);
      setSelectedWorkspaceId(newWorkspace.workspace_id);
      setShowCreateWorkspace(false);
      setNewWorkspaceName('');
    } catch (error) {
      console.error('워크스페이스 생성 실패:', error);
      alert('워크스페이스 생성에 실패했습니다.');
    } finally {
      setIsCreatingWorkspace(false);
    }
  };

  // 초대 수락 처리
  const handleAcceptInvitation = async () => {
    if (!selectedWorkspaceId) {
      alert('워크스페이스를 선택해주세요.');
      return;
    }

    setIsAccepting(true);
    try {
      const response = await projectAPI.acceptInvitation(invitationId, selectedWorkspaceId);
      
      // 초대 수락 성공 시 localStorage에서 초대 정보 제거
      localStorage.removeItem('pendingInvitation');
      
      setStep('success');
      setMessage('프로젝트에 성공적으로 참여했습니다!');
      
      // 3초 후 메인 페이지로 이동
      setTimeout(() => {
        navigate('/main');
      }, 3000);
    } catch (error) {
      console.error('초대 수락 실패:', error);
      setStep('error');
      if (error.response?.status === 404) {
        setError('유효하지 않은 초대장입니다.');
      } else if (error.response?.status === 403) {
        setError('이 초대장에 대한 권한이 없습니다.');
      } else {
        setError('초대 수락 중 오류가 발생했습니다.');
      }
    } finally {
      setIsAccepting(false);
    }
  };

  // 초대 거절 처리
  const handleRejectInvitation = async () => {
    setIsRejecting(true);
    try {
      console.log('초대 거절 시작:', { invitationId });
      const response = await projectAPI.rejectInvitation(invitationId);
      console.log('초대 거절 성공:', response);
      
      // 초대 거절 성공 시 localStorage에서 초대 정보 제거
      localStorage.removeItem('pendingInvitation');
      
      setStep('success');
      setMessage('초대를 거절했습니다.');
      
      // 3초 후 메인 페이지로 이동
      setTimeout(() => {
        navigate('/main');
      }, 3000);
    } catch (error) {
      console.error('초대 거절 실패:', error);
      console.error('에러 상세:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      setStep('error');
      if (error.response?.status === 404) {
        setError('유효하지 않은 초대장입니다.');
      } else if (error.response?.status === 403) {
        setError('이 초대장에 대한 권한이 없습니다.');
      } else if (error.response?.status === 500) {
        setError('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      } else {
        setError(`초대 거절 중 오류가 발생했습니다. (${error.response?.status || 'Unknown'})`);
      }
    } finally {
      setIsRejecting(false);
    }
  };

  // 다른 계정으로 로그인
  const handleLoginWithDifferentAccount = () => {
    // 로그인 관련 데이터만 정리 (초대 정보는 유지)
    ['access_token', 'refresh_token', 'isLoggedIn', 'userEmail', 'userName', 'userId']
      .forEach(key => localStorage.removeItem(key));
    
    // 초대 정보는 이미 localStorage에 저장되어 있으므로 추가 저장 불필요
    navigate('/login');
  };

  // 렌더링 함수들
  const renderContent = () => {
    switch (step) {
      case 'loading':
      case '':
        return (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">처리 중...</h2>
            <p className="text-gray-600">{message || '초대 정보를 확인하고 있습니다...'}</p>
          </div>
        );

      case 'ready':
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">프로젝트 초대</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            
            {invitationInfo && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-medium text-gray-900 mb-2">{invitationInfo.project.title}</h3>
                <p className="text-sm text-gray-600 mb-2">{invitationInfo.project.description}</p>
                <p className="text-sm text-gray-500">
                  초대자: {invitationInfo.inviter.name} ({invitationInfo.inviter.email})
                </p>
              </div>
            )}

            {/* 워크스페이스 선택 */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3">워크스페이스 선택</h4>
              {workspaces.length > 0 ? (
                <div className="space-y-2">
                  {workspaces.map((workspace) => (
                    <label key={workspace.workspace_id} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="workspace"
                        value={workspace.workspace_id}
                        checked={selectedWorkspaceId === workspace.workspace_id}
                        onChange={(e) => setSelectedWorkspaceId(parseInt(e.target.value))}
                        className="mr-3"
                      />
                      <div>
                        <div className="font-medium">{workspace.name}</div>
                      </div>
                    </label>
                  ))}
                  <button
                    onClick={() => setShowCreateWorkspace(true)}
                    className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600"
                  >
                    + 새 워크스페이스 만들기
                  </button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 mb-4">워크스페이스가 없습니다. 새로 만들어주세요.</p>
                  <button
                    onClick={() => setShowCreateWorkspace(true)}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                  >
                    워크스페이스 만들기
                  </button>
                </div>
              )}

              {/* 워크스페이스 생성 폼 */}
              {showCreateWorkspace && (
                <div className="mt-4 p-4 border rounded-lg bg-blue-50">
                  <h5 className="font-medium mb-3">새 워크스페이스 만들기</h5>
                  <input
                    type="text"
                    placeholder="워크스페이스 이름을 입력하세요"
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    className="w-full p-2 border rounded mb-3"
                    disabled={isCreatingWorkspace}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateWorkspace}
                      disabled={isCreatingWorkspace || !newWorkspaceName.trim()}
                      className="flex-1 bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50"
                    >
                      {isCreatingWorkspace ? '생성 중...' : '만들기'}
                    </button>
                    <button
                      onClick={() => {
                        setShowCreateWorkspace(false);
                        setNewWorkspaceName('');
                      }}
                      disabled={isCreatingWorkspace}
                      className="flex-1 bg-gray-300 text-gray-700 p-2 rounded hover:bg-gray-400"
                    >
                      취소
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleRejectInvitation}
                disabled={isRejecting || isAccepting}
                className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRejecting ? (
                  <>
                    <div className="inline-block w-4 h-4 border border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    거절 중...
                  </>
                ) : (
                  '초대 거절'
                )}
              </button>
              <button
                onClick={() => navigate('/main')}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                나중에
              </button>
              <button
                onClick={handleAcceptInvitation}
                disabled={isAccepting || isRejecting || !selectedWorkspaceId}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAccepting ? (
                  <>
                    <div className="inline-block w-4 h-4 border border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    수락 중...
                  </>
                ) : (
                  '초대 수락'
                )}
              </button>
            </div>
          </div>
        );

      case 'redirect':
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">프로젝트 초대</h2>
            
            {/* 초대 정보 표시 */}
            {invitationInfo && (
              <div className="bg-blue-50 rounded-lg p-4 mb-4 text-left">
                <h3 className="font-medium text-blue-900 mb-2">{invitationInfo.project.title}</h3>
                <p className="text-sm text-blue-700 mb-2">{invitationInfo.project.description}</p>
                <p className="text-sm text-blue-600">
                  초대자: {invitationInfo.inviter.name} ({invitationInfo.inviter.email})
                </p>
                <p className="text-sm text-blue-600">
                  초대 이메일: {invitationInfo.email}
                </p>
              </div>
            )}
            
            <p className="text-gray-600 mb-6">{message}</p>
            
            {currentUser && (
              <div className="mb-6">
                <p className="text-sm text-gray-500 mb-4">
                  현재 로그인: {currentUser.email}
                </p>
                <button
                  onClick={handleLoginWithDifferentAccount}
                  className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  다른 계정으로 로그인
                </button>
              </div>
            )}
            
            {!currentUser && (
              <div className="space-y-4">
                <div className="flex gap-3 justify-center">
                  {userExists ? (
                    <button
                      onClick={() => navigate('/login')}
                      className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      로그인하기
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate('/signup')}
                      className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
                    >
                      회원가입하기
                    </button>
                  )}
                  <button
                    onClick={() => navigate('/main')}
                    className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    나중에
                  </button>
                </div>
                <p className="text-sm text-gray-500">
                  또는 3초 후 자동으로 이동됩니다...
                </p>
              </div>
            )}
          </div>
        );

      case 'success':
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">초대 수락 완료!</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <p className="text-sm text-gray-500">잠시 후 메인 페이지로 이동합니다...</p>
          </div>
        );

      case 'error':
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">오류가 발생했습니다</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate('/main')}
              className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              메인으로 이동
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {renderContent()}
      </div>
    </div>
  );
}