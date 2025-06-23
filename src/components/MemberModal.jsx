import { useState, useEffect } from 'react';
import { projectAPI } from '../api/api';
import RoleSelector from './RoleSelector';
import InvitationStatusBadge from './InvitationStatusBadge';

export default function MemberModal({ members, onClose, projectId, currentUser, onMembersUpdate }) {
  // 화면 모드 상태 ('members' | 'invite')
  const [viewMode, setViewMode] = useState('members');
  
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviteStatus, setInviteStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [actionLoading, setActionLoading] = useState({});
  const [invitations, setInvitations] = useState([]);
  const [invitationsLoading, setInvitationsLoading] = useState(false);
  const [roleGuideExpanded, setRoleGuideExpanded] = useState(false);

  const currentUserMember = members?.find(member => member.email === currentUser?.email);
  const canManageMembers = currentUserMember?.role === 'owner' || currentUserMember?.role === 'admin';
  const isOwner = currentUserMember?.role === 'owner';
  const isAdmin = currentUserMember?.role === 'admin';

  // 초대 목록 가져오기 함수
  const fetchInvitations = async () => {
    if (projectId && canManageMembers) {
      setInvitationsLoading(true);
      try {
        const response = await projectAPI.getInvitations(projectId);
        setInvitations(response.data.invitations || []);
      } catch (error) {
        console.error('초대 목록 가져오기 실패:', error);
        setInvitations([]);
      } finally {
        setInvitationsLoading(false);
      }
    }
  };

  // 초대 모드로 전환할 때만 초대 목록 로드
  useEffect(() => {
    if (viewMode === 'invite') {
      fetchInvitations();
    }
  }, [viewMode, projectId, canManageMembers]);

  // 초대 모드로 전환하는 함수
  const switchToInviteMode = () => {
    setViewMode('invite');
    setInviteStatus('');
    setStatusMessage('');
  };

  // 구성원 모드로 전환하는 함수
  const switchToMembersMode = () => {
    setViewMode('members');
    setInviteEmail('');
    setInviteRole('member');
    setInviteStatus('');
    setStatusMessage('');
  };

  const handleInvite = async (e) => {
    e.preventDefault();

    if (!projectId) {
      setStatusMessage("프로젝트가 선택되지 않았습니다.");
      return;
    }

    if (!inviteEmail) {
      setStatusMessage("초대할 이메일을 입력해 주세요.");
      return;
    }

    setLoading(true);
    try {
      await projectAPI.invite(projectId, inviteEmail, inviteRole);
      
      setInviteStatus(`${inviteEmail}님에게 초대장이 성공적으로 전송되었습니다! 📧`);
      setInviteEmail("");
      setInviteRole('member');
      setStatusMessage("");

      // 멤버 목록 업데이트
      if (typeof onMembersUpdate === "function") {
        await onMembersUpdate();
      }
      
      // 초대 목록 새로고침
      await fetchInvitations();
    } catch (error) {
      if (error.response) {
        switch (error.response.status) {
          case 404:
            setStatusMessage("❌ 서버에 해당 프로젝트가 없습니다. (404 Not Found)");
            break;
          case 401:
            setStatusMessage("❌ 인증이 필요합니다. 다시 로그인해 주세요. (401 Unauthorized)");
            break;
          case 400:
            setStatusMessage(
              `❌ 잘못된 요청입니다: ${error.response.data?.detail || "입력값을 확인하세요."}`
            );
            break;
          default:
            setStatusMessage(
              error.response.data?.detail
                ? `❌ 오류: ${error.response.data.detail}`
                : `❌ 서버 오류(${error.response.status}): 다시 시도해 주세요.`
            );
        }
      } else if (error.request) {
        setStatusMessage("❌ 서버로부터 응답이 없습니다. 네트워크 상태를 확인하세요.");
      } else {
        setStatusMessage(`❌ 오류: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (member) => {
    if (!canManageMembers) {
      alert('권한이 없습니다.');
      return;
    }

    if (member.role === 'owner') {
      alert('프로젝트 소유자는 제거할 수 없습니다.');
      return;
    }

    if (!window.confirm(`${member.name || member.email}님을 프로젝트에서 제거하시겠습니까?`)) {
      return;
    }

    setActionLoading(prev => ({ ...prev, [`remove-${member.user_id}`]: true }));
    try {
      await projectAPI.removeMember(projectId, member.user_id);
      setInviteStatus("멤버가 성공적으로 제거되었습니다.");
      
      if (typeof onMembersUpdate === "function") {
        await onMembersUpdate();
      }
    } catch (error) {
      console.error('멤버 제거 실패:', error);
      alert('멤버 제거에 실패했습니다.');
    } finally {
      setActionLoading(prev => ({ ...prev, [`remove-${member.user_id}`]: false }));
    }
  };

  const handleRoleChange = async (member, newRole) => {
    // 🔒 관리자 이상만 권한 변경 가능
    if (!isOwner && !isAdmin) {
      alert('관리자 이상 권한이 필요합니다.');
      return;
    }
    
    // 🔒 다른 소유자 권한은 변경 불가
    if (member.role === 'owner') {
      alert('다른 소유자의 권한은 변경할 수 없습니다.');
      return;
    }
    
    // 🔒 관리자 권한 변경은 소유자만 가능
    if (member.role === 'admin' && !isOwner) {
      alert('소유자만 관리자의 권한을 변경할 수 있습니다.');
      return;
    }
    
    // 🔒 관리자는 admin/owner 권한 부여 불가
    if (isAdmin && !isOwner && (newRole === 'admin' || newRole === 'owner')) {
      alert('소유자만 관리자 이상 권한을 부여할 수 있습니다.');
      return;
    }

    setActionLoading(prev => ({ ...prev, [`role-${member.user_id}`]: true }));
    try {
      await projectAPI.updateMemberRole(projectId, member.user_id, newRole);
      setInviteStatus(`${member.name || member.email}님의 권한이 변경되었습니다.`);
      
      if (typeof onMembersUpdate === "function") {
        await onMembersUpdate();
      }
    } catch (error) {
      console.error('권한 변경 실패:', error);
      throw error;
    } finally {
      setActionLoading(prev => ({ ...prev, [`role-${member.user_id}`]: false }));
    }
  };


  const handleCancelInvitation = async (invitationId) => {
    const invitation = invitations.find(inv => inv.invitation_id === invitationId);
    if (!window.confirm(`${invitation?.email}님의 초대를 취소하시겠습니까?`)) return;

    setActionLoading(prev => ({ ...prev, [`cancel-${invitationId}`]: true }));
    try {
      await projectAPI.cancelInvitation(invitationId);
      setInviteStatus(`${invitation?.email}님의 초대가 취소되었습니다.`);
      
      await fetchInvitations();
    } catch (error) {
      console.error('초대 취소 실패:', error);
      alert('초대 취소에 실패했습니다.');
    } finally {
      setActionLoading(prev => ({ ...prev, [`cancel-${invitationId}`]: false }));
    }
  };

  const handleResendInvitation = async (invitationId) => {
    const invitation = invitations.find(inv => inv.invitation_id === invitationId);
    setActionLoading(prev => ({ ...prev, [`resend-${invitationId}`]: true }));
    try {
      await projectAPI.resendInvitation(invitationId);
      setInviteStatus(`${invitation?.email}님에게 초대장이 재전송되었습니다.`);
    } catch (error) {
      console.error('초대 재전송 실패:', error);
      alert('초대 재전송에 실패했습니다.');
    } finally {
      setActionLoading(prev => ({ ...prev, [`resend-${invitationId}`]: false }));
    }
  };

  const getInitials = (nameOrEmail) => {
    if (!nameOrEmail) return "?";
    const parts = nameOrEmail.trim().split(" ");
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50" onClick={onClose}>
      <div className="bg-white rounded shadow-lg p-6 min-w-[500px] max-w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          {viewMode === 'members' ? (
            <h3 className="text-xl font-bold">프로젝트 구성원 ({members?.length || 0}명)</h3>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={switchToMembersMode}
                className="text-gray-500 hover:text-gray-700 p-1 rounded"
                title="뒤로가기"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h3 className="text-xl font-bold">팀원 초대</h3>
            </div>
          )}
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded"
            title="닫기"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 메인 콘텐츠 */}
        {viewMode === 'members' ? (
          // 구성원 모드
          <div>
            {/* 멤버 리스트 */}
            <ul className="mb-4 max-h-64 overflow-y-auto">
              {members && members.length > 0 ? (
                members.map(member => {
                  const isCurrentUser = member.email === currentUser?.email;
                  const initials = getInitials(member.name || member.email);
                  // 🔒 소유자 보호 및 관리자 간 제거 방지
                  const canRemoveThisMember = canManageMembers && member.role !== 'owner' && 
                    (!isCurrentUser || isOwner) && 
                    !(isAdmin && member.role === 'admin'); // 관리자는 다른 관리자 제거 불가
                  
                  // 🔒 권한 변경 가능 여부 확인
                  const canChangeRole = !isCurrentUser && (
                    (isOwner && member.role !== 'owner') || // 소유자는 다른 소유자를 제외한 모든 멤버 변경 가능
                    (isAdmin && member.role !== 'owner' && member.role !== 'admin') // 관리자는 일반 멤버만 변경 가능
                  );

                  return (
                    <li key={member.email || member.id} className="flex items-center gap-3 mb-4 p-3 rounded-lg border hover:bg-gray-50">
                      <div className="w-10 h-10 flex items-center justify-center rounded-full bg-yellow-300 text-white font-semibold text-sm uppercase">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium truncate">{member.name || "이름 없음"}</span>
                          {isCurrentUser && (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                              나
                            </span>
                          )}
                        </div>
                        <span className="text-gray-400 text-sm truncate block">{member.email}</span>
                        {member.joined_at && (
                          <span className="text-gray-400 text-xs">
                            {new Date(member.joined_at).toLocaleDateString()} 참여
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <RoleSelector
                          currentRole={member.role}
                          onRoleChange={(newRole) => handleRoleChange(member, newRole)}
                          disabled={!canChangeRole}
                          canChangeToOwner={isOwner}
                          canChangeToAdmin={isOwner}
                          size="small"
                        />
                        
                        {canRemoveThisMember && (
                          <button
                            onClick={() => handleRemoveMember(member)}
                            disabled={actionLoading[`remove-${member.user_id}`]}
                            className="text-red-600 hover:text-red-800 p-1 rounded disabled:opacity-50"
                            title="멤버 제거"
                          >
                            {actionLoading[`remove-${member.user_id}`] ? (
                              <div className="w-4 h-4 border border-current border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })
              ) : (
                <li className="text-center py-4 text-gray-500">
                  멤버 정보를 불러오는 중이거나 멤버가 없습니다.
                </li>
              )}
            </ul>

            {/* 초대 버튼 */}
            {canManageMembers && (
              <div className="flex justify-center mt-4">
                <button
                  onClick={switchToInviteMode}
                  className="bg-yellow-400 text-white px-6 py-2 rounded-lg hover:bg-yellow-500 transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  팀원 초대하기
                </button>
              </div>
            )}
          </div>
        ) : (
          // 초대 모드
          <div>
            {/* 초대 폼 */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-lg font-semibold mb-3">새 멤버 초대</h4>
              <form onSubmit={handleInvite}>
                <div className="flex gap-2 mb-2">
                  <input
                    type="email"
                    placeholder="초대할 이메일 주소를 입력하세요"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    className="border rounded px-3 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    disabled={loading}
                    required
                  />
                  <select
                    value={inviteRole}
                    onChange={e => setInviteRole(e.target.value)}
                    className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white"
                    disabled={loading}
                  >
                    <option value="viewer">뷰어</option>
                    <option value="member">멤버</option>
                    {isOwner && <option value="admin">관리자</option>}
                    {isOwner && <option value="owner">소유자</option>}
                  </select>
                  <button
                    type="submit"
                    disabled={loading || !inviteEmail}
                    className="bg-yellow-400 text-white px-4 py-2 rounded hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {loading ? "전송중..." : "초대하기"}
                  </button>
                </div>
              </form>
              {statusMessage && (
                <div style={{
                  color: statusMessage.startsWith("✅") ? "green" : "red",
                  marginTop: 8
                }}>
                  {statusMessage}
                </div>
              )}
              {inviteStatus && (
                <div className={`text-sm mt-2 ${inviteStatus.includes('실패') ? 'text-red-600' : 'text-green-600'}`}>
                  {inviteStatus}
                </div>
              )}
            </div>

            {/* 초대 목록 */}
            <div className="mb-6">
              <h4 className="text-lg font-bold mb-4">
                초대 현황 ({invitations.length}개)
                <span className="text-sm text-gray-500 ml-2">
                  ({invitations.filter(inv => inv.status === 'pending').length}개 대기중)
                </span>
              </h4>
              
              {invitationsLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto"></div>
                  <p className="text-gray-500 mt-2">초대 목록 로딩 중...</p>
                </div>
              ) : invitations.length > 0 ? (
                <ul className="space-y-3">
                  {invitations.map(invitation => (
                    <li key={invitation.invitation_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{invitation.email}</span>
                          {invitation.role && (
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              invitation.role === 'owner' ? 'bg-yellow-100 text-yellow-800' :
                              invitation.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                              invitation.role === 'member' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {invitation.role === 'owner' ? '소유자' :
                               invitation.role === 'admin' ? '관리자' :
                               invitation.role === 'member' ? '멤버' : '뷰어'}
                            </span>
                          )}
                          <InvitationStatusBadge
                            status={invitation.status}
                            showIcon={true}
                            size="small"
                            onCancel={invitation.status === 'pending' ? () => handleCancelInvitation(invitation.invitation_id) : null}
                            onResend={invitation.status === 'pending' ? () => handleResendInvitation(invitation.invitation_id) : null}
                            isActionLoading={actionLoading[`cancel-${invitation.invitation_id}`] || actionLoading[`resend-${invitation.invitation_id}`]}
                          />
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          초대자: {invitation.invited_by}
                          {invitation.invited_at && (
                            <span className="ml-2">
                              초대일: {new Date(invitation.invited_at).toLocaleDateString()}
                            </span>
                          )}
                          {invitation.expires_at && invitation.status === 'pending' && (
                            <span className="ml-2 text-orange-600">
                              만료 예정: {new Date(invitation.expires_at).toLocaleDateString()}
                            </span>
                          )}
                          {invitation.accepted_at && invitation.status !== 'pending' && (
                            <span className="ml-2">
                              처리일: {new Date(invitation.accepted_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* 삭제 버튼 */}
                      <div className="flex items-center ml-4">
                        <button
                          onClick={() => handleCancelInvitation(invitation.invitation_id)}
                          disabled={actionLoading[`cancel-${invitation.invitation_id}`]}
                          className="text-red-500 hover:text-red-700 p-1 rounded transition-colors disabled:opacity-50"
                          title="초대 삭제"
                        >
                          {actionLoading[`cancel-${invitation.invitation_id}`] ? (
                            <div className="w-4 h-4 border border-current border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  초대 내역이 없습니다.
                </div>
              )}
            </div>
          </div>
        )}

        {/* 권한 설명 */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-4 border border-blue-100">
          <button
            onClick={() => setRoleGuideExpanded(!roleGuideExpanded)}
            className="flex items-center justify-between w-full mb-3 text-left"
          >
            <div className="flex items-center">
              <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h4 className="font-semibold text-blue-900 text-base">권한별 기능 안내</h4>
            </div>
            <svg 
              className={`w-5 h-5 text-blue-600 transition-transform ${roleGuideExpanded ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {roleGuideExpanded && (
            <div className="space-y-4">
            {/* 소유자 권한 */}
            <div className="bg-white rounded-lg p-3 border-l-4 border-yellow-400">
              <div className="flex items-center mb-2">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 mr-2">
                  👑 소유자
                </span>
                <span className="text-sm text-gray-600">최고 관리자 권한</span>
              </div>
              <ul className="text-sm text-gray-700 space-y-1 ml-4">
                <li>• 프로젝트 삭제 및 소유권 이전</li>
                <li>• 관리자 지정 및 모든 멤버 권한 변경</li>
                <li>• 모든 업무 생성/수정/삭제/상태변경</li>
                <li>• 멤버 초대/제거 및 태그 관리</li>
                <li>• 프로젝트 설정 변경</li>
              </ul>
            </div>

            {/* 관리자 권한 */}
            <div className="bg-white rounded-lg p-3 border-l-4 border-blue-400">
              <div className="flex items-center mb-2">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 mr-2">
                  🛡️ 관리자
                </span>
                <span className="text-sm text-gray-600">프로젝트 관리 권한</span>
              </div>
              <ul className="text-sm text-gray-700 space-y-1 ml-4">
                <li>• 멤버/뷰어 초대 및 제거</li>
                <li>• 일반 멤버 권한 변경 (관리자↔멤버↔뷰어)</li>
                <li>• 모든 업무 생성/수정/삭제/상태변경</li>
                <li>• 댓글 작성/수정/삭제 및 태그 관리</li>
                <li className="text-gray-500">⚠️ 다른 관리자나 소유자 권한 변경 불가</li>
              </ul>
            </div>

            {/* 멤버 권한 */}
            <div className="bg-white rounded-lg p-3 border-l-4 border-green-400">
              <div className="flex items-center mb-2">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 mr-2">
                  👤 멤버
                </span>
                <span className="text-sm text-gray-600">일반 작업 권한</span>
              </div>
              <ul className="text-sm text-gray-700 space-y-1 ml-4">
                <li>• 업무 생성 및 본인 담당 업무 수정/삭제</li>
                <li>• 본인 담당 업무의 상태 변경</li>
                <li>• 댓글 작성/수정/삭제</li>
                <li>• 프로젝트 내 모든 정보 조회</li>
                <li className="text-gray-500">⚠️ 다른 사람의 업무 수정/삭제 불가</li>
              </ul>
            </div>

            {/* 뷰어 권한 */}
            <div className="bg-white rounded-lg p-3 border-l-4 border-gray-400">
              <div className="flex items-center mb-2">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 mr-2">
                  👁️ 뷰어
                </span>
                <span className="text-sm text-gray-600">읽기 전용 권한</span>
              </div>
              <ul className="text-sm text-gray-700 space-y-1 ml-4">
                <li>• 프로젝트 정보 및 업무 조회만 가능</li>
                <li>• 칸반보드, 캘린더, 업무 목록 확인</li>
                <li>• 댓글 및 태그 내용 조회</li>
                <li className="text-red-600">⚠️ 생성/수정/삭제 등 모든 변경 작업 불가</li>
              </ul>
            </div>
            
            <div className="mt-3 p-2 bg-amber-50 rounded border border-amber-200">
              <div className="flex items-start">
                <svg className="w-4 h-4 text-amber-600 mr-1 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div className="text-xs text-amber-800">
                  <strong>참고:</strong> 소유자와 관리자는 담당자가 아닌 업무도 수정/삭제할 수 있어 팀 관리가 용이합니다.
                </div>
              </div>
            </div>
          </div>
          )}
        </div>

        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="w-full mt-4 py-2 text-gray-500 hover:text-gray-700 border border-gray-200 rounded hover:bg-gray-50"
        >
          닫기
        </button>
      </div>
    </div>
  );
}