import React, { useState, useContext, useEffect } from 'react';
import { OrgProjectContext } from '../context/OrgProjectContext';
import { userAPI } from '../api/api';

function UserSettingsPage() {
  const { organizations } = useContext(OrgProjectContext);
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [notifications, setNotifications] = useState({
    emailEnabled: false,
    email: '',
    projectNotifications: {}
  });
  const [provider, setProvider] = useState('');
  const [profileLoading, setProfileLoading] = useState(true);
  const [passwordWarning, setPasswordWarning] = useState('');

  // 사용자 provider 정보 불러오기
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await userAPI.getProfile();
        setProvider(res.data.provider || 'local');
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
    try {
      await userAPI.updateNotifications(notifications);
      alert('알림 설정이 저장되었습니다.');
    } catch (error) {
      console.error('알림 설정 저장 중 오류:', error);
      alert('알림 설정 저장 중 오류가 발생했습니다.');
    }
  };

  const handleAccountDelete = async () => {
    if (!window.confirm('정말로 계정을 탈퇴하시겠습니까?')) return;

    // "탈퇴하겠습니다" 문구 입력 요구
    const confirmText = window.prompt('정확히 다음 문구를 입력해야 탈퇴가 진행됩니다.\n\n탈퇴하겠습니다');
    if (confirmText !== '탈퇴하겠습니다') {
      alert('정확히 "탈퇴하겠습니다"를 입력해야 탈퇴가 진행됩니다.');
      return;
    }

    try {
      // password 없이 DELETE 요청
      await userAPI.deleteAccount();
      alert('계정이 탈퇴되었습니다.');
      localStorage.clear();
      window.location.href = '/login';
    } catch (error) {
      alert('계정 탈퇴 중 오류가 발생했습니다.');
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

      {/* 알림 설정 (프로젝트별 알림 포함) */}
      <section className="bg-white p-6 rounded shadow">
        <h2 className="text-2xl font-semibold mb-4">알림 설정</h2>
        <form onSubmit={handleSaveNotifications} className="space-y-4">
          <div className="flex items-center space-x-2">
            <input id="emailEnabled" name="emailEnabled" type="checkbox" checked={notifications.emailEnabled} onChange={handleNotificationsChange} />
            <label htmlFor="emailEnabled">알림 이메일 수신 여부</label>
          </div>
          {notifications.emailEnabled && (
            <div className="flex flex-col">
              <label className="mb-1">알림 수신 이메일</label>
              <input name="email" type="email" value={notifications.email} onChange={handleNotificationsChange} className="border px-3 py-2 rounded" />
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
                        <input name={proj.projectId} type="checkbox" checked={notifications.projectNotifications[proj.projectId] || false} onChange={handleNotificationsChange} />
                        <label>{proj.name}</label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">저장</button>
        </form>
      </section>

      {/* 계정 탈퇴 */}
      <section className="bg-white p-6 rounded shadow">
        <h2 className="text-2xl font-semibold mb-4">계정 탈퇴</h2>
        {provider !== 'local' && (
          <div className="text-red-500 mb-2">소셜로그인 계정은 비밀번호가 없어 탈퇴 시 비밀번호 확인이 필요하지 않습니다.</div>
        )}
        <button type="button" onClick={handleAccountDelete} className="bg-red-500 text-white px-4 py-2 rounded">계정 탈퇴</button>
      </section>
    </div>
  );
}

export default UserSettingsPage;
