import React, { useState, useContext, useEffect } from 'react';
import { OrgProjectContext } from '../context/OrgProjectContext';
import { userAPI } from '../api/api';

function UserSettingsPage() {
  const { organizations } = useContext(OrgProjectContext);
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [notifications, setNotifications] = useState({
    emailEnabled: true,
    email: '',
    projectNotifications: {}
  });
  const [provider, setProvider] = useState('');
  const [profileLoading, setProfileLoading] = useState(true);
  const [passwordWarning, setPasswordWarning] = useState('');
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteForm, setDeleteForm] = useState({
    confirmationText: '',
    password: ''
  });

  // 사용자 provider 정보 불러오기
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await userAPI.getProfile();
        setProvider(res.data.provider || 'local');
        
        // 알림 설정도 함께 가져오기
        if (res.data.email_notifications_enabled !== undefined) {
          setNotifications(prev => ({
            ...prev,
            emailEnabled: res.data.email_notifications_enabled,
            email: res.data.notification_email || res.data.email || ''
          }));
        }
      } catch (e) {
        setProvider('local');
      } finally {
        setProfileLoading(false);
      }
    }
    fetchProfile();
  }, []);

  // Initialize project notification toggles
  useEffect(() => {
    const initial = {};
    organizations.forEach(org => {
      org.projects.forEach(proj => { initial[proj.projectId] = false; });
    });
    setNotifications(n => ({ ...n, projectNotifications: initial }));
  }, [organizations]);

  // 비밀번호 요구사항 체크 함수
  function validatePassword(pw) {
    if (pw.length < 8) return false;
    if (!/[A-Za-z]/.test(pw)) return false;
    if (!/[0-9]/.test(pw)) return false;
    if (!/[!@#$%^&*(),.?":{}|<>\[\]\\/~`_\-+=;'']/.test(pw)) return false;
    return true;
  }

  // 새 비밀번호 입력 시 실시간 체크
  useEffect(() => {
    if (passwords.new && !validatePassword(passwords.new)) {
      setPasswordWarning('비밀번호는 8자 이상, 영문/숫자/특수문자를 모두 포함해야 합니다.');
    } else {
      setPasswordWarning('');
    }
  }, [passwords.new]);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!validatePassword(passwords.new)) {
      alert('비밀번호는 8자 이상, 영문/숫자/특수문자를 모두 포함해야 합니다.');
      return;
    }
    if (passwords.new !== passwords.confirm) {
      alert('새 비밀번호가 일치하지 않습니다.');
      return;
    }
    try {
      await userAPI.changePassword({
        current_password: passwords.current,
        new_password: passwords.new,
        confirm_password: passwords.confirm
      });
      alert('비밀번호가 변경되었습니다.');
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (error) {
      if (error.response?.status === 401) {
        alert('현재 비밀번호가 올바르지 않습니다.');
      } else if (error.response?.data?.detail) {
        alert(error.response.data.detail);
      } else {
        alert('비밀번호 변경 중 오류가 발생했습니다.');
      }
    }
  };

  const handleNotificationsChange = e => {
    const { name, checked, value, type } = e.target;
    if (name === 'emailEnabled') setNotifications(n => ({ ...n, emailEnabled: checked }));
    else if (name === 'email') setNotifications(n => ({ ...n, email: value }));
    else {
      setNotifications(n => ({
        ...n,
        projectNotifications: { ...n.projectNotifications, [name]: checked }
      }));
    }
  };

  const handleSaveNotifications = async (e) => {
    e.preventDefault();
    setSettingsLoading(true);
    try {
      await userAPI.updateNotifications({
        email_notifications_enabled: notifications.emailEnabled,
        notification_email: notifications.emailEnabled ? notifications.email : null
      });
      alert('알림 설정이 저장되었습니다.');
    } catch (error) {
      console.error('알림 설정 저장 중 오류:', error);
      alert('알림 설정 저장 중 오류가 발생했습니다.');
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleDeleteModalOpen = () => {
    setDeleteModalOpen(true);
  };

  const handleDeleteModalClose = () => {
    setDeleteModalOpen(false);
    setDeleteForm({ confirmationText: '', password: '' });
  };

  const handleDeleteFormChange = (e) => {
    const { name, value } = e.target;
    setDeleteForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAccountDelete = async () => {
    // 확인 문자열 검증
    if (deleteForm.confirmationText !== '계정을 영구 삭제합니다') {
      alert('확인 문자를 정확히 입력해주세요.');
      return;
    }

    // 소셜 로그인이 아닌 경우 비밀번호 필수
    if (provider === 'local' && !deleteForm.password) {
      alert('비밀번호를 입력해주세요.');
      return;
    }

    try {
      const requestData = {
        confirmation_text: deleteForm.confirmationText
      };
      
      // 소셜 계정이 아닌 경우에만 비밀번호 포함
      if (provider === 'local') {
        requestData.password = deleteForm.password;
      }
      
      console.log('계정 탈퇴 요청 데이터:', requestData);
      console.log('현재 provider:', provider);
      
      await userAPI.deleteAccount(requestData);
      alert('계정이 탈퇴되었습니다.');
      localStorage.clear();
      window.location.href = '/login';
    } catch (error) {
      if (error.response?.data?.detail) {
        alert(error.response.data.detail);
      } else {
        alert('계정 탈퇴 중 오류가 발생했습니다.');
      }
    }
  };

  if (profileLoading) return <div>로딩 중...</div>;

  return (
    <div className="space-y-12">
      <h1 className="text-3xl font-bold mb-6">User Settings</h1>
      {/* 비밀번호 변경 */}
      <section className="bg-white p-6 rounded shadow">
        <h2 className="text-2xl font-semibold mb-4">비밀번호 변경</h2>
        <div className="text-sm text-gray-500 mb-2">비밀번호는 8자 이상, 영문/숫자/특수문자를 모두 포함해야 합니다.</div>
        {provider !== 'local' ? (
          <div className="text-red-500">소셜로그인 계정은 비밀번호 변경이 불가능합니다.</div>
        ) : (
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="flex flex-col">
              <label className="mb-1">현재 비밀번호</label>
              <input name="current" value={passwords.current} onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))} type="password" className="border px-3 py-2 rounded" />
            </div>
            <div className="flex flex-col">
              <label className="mb-1">새 비밀번호</label>
              <input name="new" value={passwords.new} onChange={e => setPasswords(p => ({ ...p, new: e.target.value }))} type="password" className="border px-3 py-2 rounded" />
              {passwordWarning && <div className="text-red-500 text-xs mt-1">{passwordWarning}</div>}
            </div>
            <div className="flex flex-col">
              <label className="mb-1">새 비밀번호 확인</label>
              <input name="confirm" value={passwords.confirm} onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} type="password" className="border px-3 py-2 rounded" />
            </div>
            <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">비밀번호 변경</button>
          </form>
        )}
      </section>

      {/* 알림 설정 (이메일 알림 포함) */}
      <section className="bg-white p-6 rounded shadow">
        <h2 className="text-2xl font-semibold mb-4">알림 설정</h2>
        <form onSubmit={handleSaveNotifications} className="space-y-4">
          <div className="flex items-center space-x-2">
            <input 
              id="emailEnabled" 
              name="emailEnabled" 
              type="checkbox" 
              checked={notifications.emailEnabled} 
              onChange={handleNotificationsChange} 
            />
            <label htmlFor="emailEnabled">이메일 알림 수신</label>
          </div>
          {notifications.emailEnabled && (
            <div className="flex flex-col">
              <label className="mb-1">알림 수신 이메일</label>
              <input 
                name="email" 
                type="email" 
                value={notifications.email} 
                onChange={handleNotificationsChange} 
                className="border px-3 py-2 rounded" 
                placeholder="알림을 받을 이메일 주소를 입력하세요"
              />
              <p className="text-sm text-gray-500 mt-1">
                비워두면 가입한 이메일로 알림이 전송됩니다.
              </p>
            </div>
          )}
          <div className="mt-4">
            <p className="font-semibold mb-2">프로젝트별 알림 온/오프</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {organizations.map(org => (
                <div key={org.orgId}>
                  <p className="font-medium">{org.orgName}</p>
                  <div className="ml-4 space-y-1">
                    {org.projects.map(proj => (
                      <div key={proj.projectId} className="flex items-center space-x-2">
                        <input 
                          name={proj.projectId} 
                          type="checkbox" 
                          checked={notifications.projectNotifications[proj.projectId] || false} 
                          onChange={handleNotificationsChange} 
                        />
                        <label>{proj.name}</label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button 
            type="submit" 
            className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
            disabled={settingsLoading}
          >
            {settingsLoading ? '저장 중...' : '저장'}
          </button>
        </form>
      </section>

      {/* 계정 탈퇴 */}
      <section className="bg-white p-6 rounded shadow border-l-4 border-red-500">
        <h2 className="text-2xl font-semibold mb-4 text-red-600">⚠️ 위험 구역</h2>
        <div className="bg-red-50 p-4 rounded mb-4">
          <h3 className="font-semibold text-red-800 mb-2">계정 탈퇴 시 처리 사항</h3>
          <ul className="text-sm text-red-700 space-y-1">
            <li>• 소유한 프로젝트는 다른 멤버(관리자 우선)에게 자동으로 소유권이 이전됩니다</li>
            <li>• 다른 멤버가 없는 프로젝트는 완전히 삭제됩니다</li>
            <li>• 본인이 담당자로 지정된 업무들의 담당자가 "알 수 없음 (탈퇴)"로 변경됩니다</li>
            <li>• 작성한 댓글은 유지되지만 작성자가 "알 수 없음 (탈퇴)"로 표시됩니다</li>
            <li>• 이 작업은 되돌릴 수 없습니다</li>
          </ul>
        </div>
        {provider !== 'local' && (
          <div className="text-orange-600 bg-orange-50 p-3 rounded mb-4">
            소셜로그인 계정은 비밀번호 확인 없이 탈퇴됩니다.
          </div>
        )}
        <button 
          type="button" 
          onClick={handleDeleteModalOpen} 
          className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded font-semibold transition-colors"
        >
          계정 탈퇴
        </button>
      </section>

      {/* 계정 삭제 확인 모달 */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-red-600 mb-4">⚠️ 계정 영구 삭제</h3>
            
            <div className="bg-red-50 p-4 rounded mb-4">
              <p className="text-sm text-red-800 mb-2 font-semibold">다음 항목들이 삭제됩니다:</p>
              <ul className="text-xs text-red-700 space-y-1">
                <li>• 소유한 모든 프로젝트 및 관련 업무</li>
                <li>• 워크스페이스 및 설정</li>
                <li>• 알림 및 활동 로그</li>
              </ul>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  다음 문구를 정확히 입력하세요: <span className="text-red-500">"계정을 영구 삭제합니다"</span>
                </label>
                <input
                  type="text"
                  name="confirmationText"
                  value={deleteForm.confirmationText}
                  onChange={handleDeleteFormChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="계정을 영구 삭제합니다"
                />
              </div>

              {provider === 'local' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    비밀번호 확인
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={deleteForm.password}
                    onChange={handleDeleteFormChange}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="현재 비밀번호를 입력하세요"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleDeleteModalClose}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded font-medium transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleAccountDelete}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded font-medium transition-colors"
              >
                영구 삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserSettingsPage;
