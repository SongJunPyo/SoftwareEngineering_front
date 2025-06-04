import React, { useState } from 'react';
import axios from 'axios';

export default function MemberModal({ members, onClose, projectId, currentUser, fetchProjects }) {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteStatus, setInviteStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

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
      const response = await axios.post(
        `http://localhost:8005/api/v1/projects/${projectId}/invite`,
        { email: inviteEmail },
        {
          headers: {
            Authorization: `Bearer ${localStorage.access_token}`,
          },
        }
      );

      setInviteStatus("초대장이 성공적으로 전송되었습니다! 📧");
      setInviteEmail("");

      if (typeof fetchProjects === "function") {
        await fetchProjects();
      }
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

  // 이니셜 추출 함수
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
      <div className="bg-white rounded shadow-lg p-6 min-w-[400px] max-w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

        {/* 초대 섹션 */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-lg font-semibold mb-3">팀원 초대하기</h4>
          <div className="flex gap-2 mb-2">
            <input
              type="email"
              placeholder="초대할 이메일 주소를 입력하세요"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              className="border rounded px-3 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              disabled={loading}
            />
            <button
              onClick={handleInvite}
              disabled={loading || !inviteEmail}
              className="bg-yellow-400 text-white px-4 py-2 rounded hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "전송중..." : "초대하기"}
            </button>
          </div>
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

        {/* 멤버 리스트 */}
        <h3 className="text-xl font-bold mb-4">프로젝트 구성원 ({members.length}명)</h3>
        <ul className="mb-4 max-h-48 overflow-y-auto">
          {members.map(member => {
            const isCurrentUser = member.email === currentUser?.email;
            const initials = getInitials(member.name || member.email);

            return (
              <li key={member.email} className="flex items-center gap-3 mb-3 p-2 rounded hover:bg-gray-50">
                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-yellow-300 text-white font-semibold text-sm uppercase">
                  {initials}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{member.name || "이름 없음"}</span>
                    {isCurrentUser && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                        나
                      </span>
                    )}
                  </div>
                  <span className="text-gray-400 text-sm">{member.email}</span>
                </div>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {member.role || "멤버"}
                </span>
              </li>
            );
          })}
        </ul>

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

