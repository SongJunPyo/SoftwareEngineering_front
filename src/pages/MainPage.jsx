import React, { useContext, useState, useEffect } from 'react';
import styled from 'styled-components';
import Sidebar from '../components/Sidebar';
import DashboardGrid from '../components/DashboardGrid';
import { OrgProjectContext } from '../context/OrgProjectContext';
import BoardPage from './BoardPage';
import CalendarPage from './CalendarPage';
import AllTasksPage from './AllTasksPage';
import LogPage from './LogPage';
import ProjectMembersAvatars from '../components/ProjectMembersAvatars';
import MemberModal from '../components/MemberModal';
import { projectAPI, dashboardAPI } from '../api/api';

const TAB_LIST = [
  { key: 'main', label: 'main' },
  { key: 'board', label: 'board' },
  { key: 'calendar', label: 'calendar' },
  { key: 'tasks', label: 'tasks' },
  { key: 'log', label: 'log' },
];

export default function MainPage() {
  const { organizations, selectedOrgIndex, selectedProjectIndex, fetchOrganizations } = useContext(OrgProjectContext);
  const org = organizations[selectedOrgIndex];
  const project = org ? org.projects[selectedProjectIndex] : null;
  const [activeTab, setActiveTab] = useState('main');
  const [showModal, setShowModal] = useState(false);
  const [members, setMembers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);

  // 초대 컨텍스트 정리 함수
  const cleanupInvitationContext = () => {
    try {
      const pendingInvitationStr = localStorage.getItem('pendingInvitation');
      if (pendingInvitationStr) {
        const invitationData = JSON.parse(pendingInvitationStr);
        
        // 만료 체크 (24시간)
        const expires = invitationData.timestamp + (24 * 60 * 60 * 1000);
        if (Date.now() > expires) {
          console.log('메인 페이지 - 초대 컨텍스트 만료됨, 정리');
          localStorage.removeItem('pendingInvitation');
          return;
        }
        
        // 현재 사용자가 초대받은 프로젝트에 이미 참여하고 있는지 확인
        if (project && invitationData.project === project.name) {
          console.log('메인 페이지 - 초대받은 프로젝트에 이미 참여 중, 초대 컨텍스트 정리');
          localStorage.removeItem('pendingInvitation');
          return;
        }
        
        // 초대 ID가 현재 URL과 일치하는지 확인 (초대 수락 페이지에서 온 경우)
        if (invitationData.invitationId && window.location.pathname.includes('/invite/')) {
          console.log('메인 페이지 - 초대 수락 페이지에서 이동, 초대 컨텍스트 정리');
          localStorage.removeItem('pendingInvitation');
          return;
        }
      }
    } catch (error) {
      console.error('메인 페이지 - 초대 컨텍스트 정리 중 오류:', error);
      localStorage.removeItem('pendingInvitation');
    }
  };

  // 컴포넌트 마운트 시 초대 컨텍스트 정리
  useEffect(() => {
    cleanupInvitationContext();
  }, []);

  // 프로젝트 변경 시 초대 컨텍스트 재확인
  useEffect(() => {
    if (project) {
      cleanupInvitationContext();
    }
  }, [project]);

  // 페이지 포커스 시 초대 컨텍스트 재확인
  useEffect(() => {
    const handleFocus = () => {
      console.log('메인 페이지 포커스 - 초대 컨텍스트 재확인');
      cleanupInvitationContext();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [project]);

  // 대시보드 데이터 가져오기
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (project?.projectId) {
        try {
          console.log('Fetching dashboard data for project:', project.projectId);
          const response = await dashboardAPI.getDashboardData(project.projectId);
          setDashboardData(response.data);
          console.log('Dashboard data fetched:', response.data);
        } catch (error) {
          console.error('대시보드 데이터 가져오기 실패:', error);
          setDashboardData(null);
        }
      }
    };

    if (activeTab === 'main') {
      fetchDashboardData();
    }
  }, [project?.projectId, activeTab]);

  // 현재 사용자 정보 가져오기
  useEffect(() => {
    const userEmail = localStorage.getItem('userEmail');
    const userName = localStorage.getItem('userName');
    if (userEmail) {
      setCurrentUser({ email: userEmail, name: userName });
    }
  }, []);

  // 프로젝트 멤버 목록 가져오기
  useEffect(() => {
    const fetchMembers = async () => {
      if (project?.projectId) {
        try {
          console.log('MainPage: Fetching members for project:', project.projectId);
          const response = await projectAPI.getMembers(project.projectId);
          console.log('MainPage: API response:', response.data);
          let projectMembers = response.data.members || [];
          
          // 현재 사용자를 맨 앞으로 정렬
          if (currentUser) {
            if (!projectMembers.some(m => m.email === currentUser.email)) {
              projectMembers = [{ ...currentUser, role: 'member' }, ...projectMembers];
            } else {
              projectMembers = [
                ...projectMembers.filter(m => m.email === currentUser.email),
                ...projectMembers.filter(m => m.email !== currentUser.email)
              ];
            }
          }
          
          console.log('MainPage: Final members array:', projectMembers);
          setMembers(projectMembers);
        } catch (error) {
          console.error('멤버 목록 가져오기 실패:', error);
          console.error('Error details:', error.response?.data);
          setMembers([]);
        }
      } else {
        console.log('MainPage: No project ID available');
      }
    };
    
    fetchMembers();
  }, [project?.projectId, currentUser]);

  // 멤버 목록 업데이트 콜백
  const handleMembersUpdate = async () => {
    if (project?.projectId) {
      try {
        const response = await projectAPI.getMembers(project.projectId);
        let projectMembers = response.data.members || [];
        
        if (currentUser) {
          if (!projectMembers.some(m => m.email === currentUser.email)) {
            projectMembers = [{ ...currentUser, role: 'member' }, ...projectMembers];
          } else {
            projectMembers = [
              ...projectMembers.filter(m => m.email === currentUser.email),
              ...projectMembers.filter(m => m.email !== currentUser.email)
            ];
          }
        }
        
        setMembers(projectMembers);
      } catch (error) {
        console.error('멤버 목록 업데이트 실패:', error);
      }
    }
  };

  let content;
  switch (activeTab) {
    case 'main':
      content = <DashboardGrid dashboardData={dashboardData} />;
      break;
    case 'board':
      content = <BoardPage inner />;
      break;
    case 'calendar':
      content = <CalendarPage inner />;
      break;
    case 'tasks':
      content = <AllTasksPage inner />;
      break;
    case 'log':
      content = <LogPage inner />;
      break;
    default:
      content = <DashboardGrid dashboardData={dashboardData} />;
  }

  return (
    <div className="flex flex-1">
      <Sidebar />
      <main className="flex-1 p-6 pt-0">
        <h1 className="text-3xl font-extrabold mb-2">{project ? project.name : '프로젝트를 선택하세요'}</h1>
        <p className="text-gray-500 mb-2">{org ? org.orgName : '조직을 선택하세요'}</p>
      

        {/* 멤버 관리 버튼 & 모달 */}
        {project && (
          <div className="mb-4">
            {/* 멤버 아바타들 */}
            <ProjectMembersAvatars
              members={members}
              onAvatarClick={() => setShowModal(true)}
              maxAvatars={3}
            />

            {showModal && (
              <MemberModal
                members={members}
                projectId={project.projectId}
                onClose={() => setShowModal(false)}
                currentUser={currentUser}
                onMembersUpdate={handleMembersUpdate}
              />
            )}
          </div>
        )}
        <TabNav>
          {TAB_LIST.map(tab => (
            <TabButton
              key={tab.key}
              active={activeTab === tab.key}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </TabButton>
          ))}
        </TabNav>
        {content}
      </main>
    </div>
  );
} 

const TabNav = styled.nav`
  display: flex;
  border-bottom: 1px solid #e5e7eb; /* Tailwind's gray-200 */
  margin-bottom: 2rem; /* mb-8 */
`;

const TabButton = styled.span.withConfig({
  shouldForwardProp: (prop) => prop !== 'active',
})`
  margin-right: 1rem;       /* mr-4 */
  padding: 0.5rem 1rem;     /* py-2 px-4 */
  border-radius: 0.375rem;  /* rounded-md */
  font-size: 1rem;
  font-weight: ${(props) => (props.active ? '600' : '500')};
  color: ${(props) => (props.active ? '#000000' : '#00000')}; /* white or gray-500 */
  cursor: pointer;
  transition: all 0.3s ease;

  /* 1) 선택된 탭일 때: 노란색 그라데이션(세 가지 톤) */
  ${(props) =>
    props.active
      ? `
    background-image: linear-gradient(
      to right,
      #FCF7C4 0%,   /* 연한 노랑 */
      #F6EA83 50%,  /* 중간 톤 레몬 옐로 */
      #F6DC6D 100%  /* 진한 오렌지빛 노랑 */
    );
    box-shadow: none;
  `
      : `
    /* 2) 비선택 탭일 때: 투명 배경, 회색 글자 */
    background-color: transparent;

    &:hover {
      /* 호버 시: 노란 후광만 추가 */
      box-shadow: 0 0 20px rgba(253, 216, 53, 0.6);
      color: #374151; /* gray-700 */
    }

    &:active {
      transform: scale(0.97);
      box-shadow: 0 0 24px rgba(253, 216, 53, 0.7);
    }
  `}

`;