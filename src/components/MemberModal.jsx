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
      
      // 초대 성공 후 2초 후에 구성원 화면으로 돌아가기
      setTimeout(() => {
        switchToMembersMode();
      }, 2000);
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
    if (!isOwner && !isAdmin) {
      alert('관리자 이상 권한이 필요합니다.');
      return;
    }
    
    if (isAdmin && newRole === 'admin') {
      alert('소유자만 관리자를 지정할 수 있습니다.');
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
                  const canRemoveThisMember = canManageMembers && member.role !== 'owner' && (!isCurrentUser || isOwner);
                  const canChangeRole = (isOwner || isAdmin) && !isCurrentUser;

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
        <div className="bg-blue-50 rounded-lg p-3 mb-4 text-sm">
          <h4 className="font-medium text-blue-900 mb-2">권한 설명</h4>
          <ul className="text-blue-800 space-y-1">
            <li><span className="font-medium">소유자:</span> 모든 권한 (프로젝트 삭제, 관리자 지정)</li>
            <li><span className="font-medium">관리자:</span> 전반적인 프로젝트 관리 권한</li>
            <li><span className="font-medium">멤버:</span> 업무 생성, 댓글 등 상호작용 가능</li>
            <li><span className="font-medium">뷰어:</span> 프로젝트 내용 조회만 가능</li>
          </ul>
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