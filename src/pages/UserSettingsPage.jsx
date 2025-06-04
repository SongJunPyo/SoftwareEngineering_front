import React, { useState, useContext, useEffect } from 'react';
import { OrgProjectContext } from '../context/OrgProjectContext';
import { userAPI, authAPI } from '../api/api';

function UserSettingsPage() {
  const { organizations } = useContext(OrgProjectContext);

  // Profile info state
  const [profile, setProfile] = useState({ nickname: '', email: '', bio: '', photo: null });
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });

  // Notification settings state
  const [notifications, setNotifications] = useState({
    emailEnabled: false,
    email: '',
    projectNotifications: {}
  });

  // Privacy settings state
  const [privacy, setPrivacy] = useState({ profileVisibility: 'public', emailVisibility: false });

  // Initialize project notification toggles
  useEffect(() => {
    const initial = {};
    organizations.forEach(org => {
      org.projects.forEach(proj => { initial[proj.projectId] = false; });
    });
    setNotifications(n => ({ ...n, projectNotifications: initial }));
  }, [organizations]);

  const handleProfileChange = e => {
    const { name, value, files } = e.target;
    if (name === 'photo') setProfile(p => ({ ...p, photo: files[0] }));
    else setProfile(p => ({ ...p, [name]: value }));
  };

  const handleNotificationsChange = e => {
    const { name, checked, value } = e.target;
    if (name === 'emailEnabled') setNotifications(n => ({ ...n, emailEnabled: checked }));
    else if (name === 'email') setNotifications(n => ({ ...n, email: value }));
    else {
      setNotifications(n => ({
        ...n,
        projectNotifications: { ...n.projectNotifications, [name]: checked }
      }));
    }
  };

  const handlePrivacyChange = e => {
    const { name, value, checked, type } = e.target;
    setPrivacy(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmitProfile = async (e) => {
    e.preventDefault();
    try {
      await userAPI.updateProfile(profile);
      alert('프로필 정보가 저장되었습니다.');
    } catch (error) {
      console.error('프로필 저장 중 오류:', error);
      alert('프로필 저장 중 오류가 발생했습니다.');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      alert('새 비밀번호가 일치하지 않습니다.');
      return;
    }
    try {
      await userAPI.updateProfile({
        current_password: passwords.current,
        new_password: passwords.new,
        confirm_password: passwords.confirm
      });
      alert('비밀번호가 변경되었습니다.');
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (error) {
      console.error('비밀번호 변경 중 오류:', error);
      if (error.response?.status === 401) {
        alert('현재 비밀번호가 올바르지 않습니다.');
      } else {
        alert('비밀번호 변경 중 오류가 발생했습니다.');
      }
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

  const handleSavePrivacy = async (e) => {
    e.preventDefault();
    try {
      await userAPI.updatePrivacy(privacy);
      alert('개인 정보 설정이 저장되었습니다.');
    } catch (error) {
      console.error('개인 정보 설정 저장 중 오류:', error);
      alert('개인 정보 설정 저장 중 오류가 발생했습니다.');
    }
  };

  const handleAccountDelete = async () => {
    if (window.confirm('정말로 계정을 탈퇴하시겠습니까?')) {
      try {
        await userAPI.deleteAccount();
        alert('계정이 탈퇴되었습니다.');
        localStorage.clear();
        window.location.href = '/login';
      } catch (error) {
        console.error('계정 탈퇴 중 오류:', error);
        alert('계정 탈퇴 중 오류가 발생했습니다.');
      }
    }
  };

  // 컴포넌트 마운트 시 사용자 정보 불러오기
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const [profileRes, notificationsRes, privacyRes] = await Promise.all([
          userAPI.getProfile(),
          userAPI.getNotifications(),
          userAPI.getPrivacy()
        ]);
        
        setProfile(profileRes.data);
        setNotifications(notificationsRes.data);
        setPrivacy(privacyRes.data);
      } catch (error) {
        console.error('사용자 데이터 로드 중 오류:', error);
        // 에러 처리 - 기본값 유지
      }
    };

    loadUserData();
  }, []);

  return (
    <div className="space-y-12">
      <h1 className="text-3xl font-bold mb-6">User Settings</h1>

      {/* Account Information */}
      <section className="bg-white p-6 rounded shadow">
        <h2 className="text-2xl font-semibold mb-4">계정 정보 관리</h2>
        <form onSubmit={handleSubmitProfile} className="space-y-4">
          <div className="flex flex-col">
            <label className="mb-1">닉네임</label>
            <input name="nickname" value={profile.nickname} onChange={handleProfileChange} className="border px-3 py-2 rounded" />
          </div>
          <div className="flex flex-col">
            <label className="mb-1">이메일</label>
            <input name="email" value={profile.email} onChange={handleProfileChange} type="email" className="border px-3 py-2 rounded" />
          </div>
          <div className="flex flex-col">
            <label className="mb-1">Bio</label>
            <textarea name="bio" value={profile.bio} onChange={handleProfileChange} className="border px-3 py-2 rounded" />
          </div>
          <div className="flex flex-col">
            <label className="mb-1">사진</label>
            <input name="photo" onChange={handleProfileChange} type="file" accept="image/*" />
          </div>
          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">저장</button>
        </form>

        <h3 className="text-xl font-semibold mt-8 mb-4">비밀번호 변경</h3>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="flex flex-col">
            <label className="mb-1">현재 비밀번호</label>
            <input name="current" value={passwords.current} onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))} type="password" className="border px-3 py-2 rounded" />
          </div>
          <div className="flex flex-col">
            <label className="mb-1">새 비밀번호</label>
            <input name="new" value={passwords.new} onChange={e => setPasswords(p => ({ ...p, new: e.target.value }))} type="password" className="border px-3 py-2 rounded" />
          </div>
          <div className="flex flex-col">
            <label className="mb-1">새 비밀번호 확인</label>
            <input name="confirm" value={passwords.confirm} onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} type="password" className="border px-3 py-2 rounded" />
          </div>
          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">비밀번호 변경</button>
        </form>
      </section>

      {/* Notification Settings */}
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

      {/* Privacy Settings */}
      <section className="bg-white p-6 rounded shadow">
        <h2 className="text-2xl font-semibold mb-4">개인 정보</h2>
        <form onSubmit={handleSavePrivacy} className="space-y-4">
          <div className="flex flex-col">
            <label className="mb-1">프로필 공개 범위</label>
            <select name="profileVisibility" value={privacy.profileVisibility} onChange={handlePrivacyChange} className="border px-3 py-2 rounded">
              <option value="public">전체 공개</option>
              <option value="private">비공개</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <input id="emailVisibility" name="emailVisibility" type="checkbox" checked={privacy.emailVisibility} onChange={handlePrivacyChange} />
            <label htmlFor="emailVisibility">이메일 공개 여부</label>
          </div>
          <div className="mt-4">
            <button type="button" onClick={handleAccountDelete} className="bg-red-500 text-white px-4 py-2 rounded">계정 탈퇴</button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default UserSettingsPage;
