import React, { useContext, useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import DashboardGrid from '../components/DashboardGrid';
import { OrgProjectContext } from '../context/OrgProjectContext';
import BoardPage from './BoardPage';
import CalendarPage from './CalendarPage';
import AllTasksPage from './AllTasksPage';
import LogPage from './LogPage';
import ProjectMembersAvatars from '../components/ProjectMembersAvatars';
import MemberModal from '../components/MemberModal';
import { projectAPI } from '../api/api';

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
      content = <DashboardGrid />;
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
      content = <DashboardGrid />;
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
        <div className="border-b border-gray-200 mb-8 mt-4">
          <nav className="flex space-x-8">
            {TAB_LIST.map(tab => (
              <span
                key={tab.key}
                className={`py-2 px-1 cursor-pointer ${activeTab === tab.key ? 'border-b-2 border-yellow-400 font-bold text-gray-900' : 'text-gray-500'}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </span>
            ))}
          </nav>
        </div>
        {content}
      </main>
    </div>
  );
} 