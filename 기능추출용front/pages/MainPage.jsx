import React, { useContext, useState } from 'react';
import Sidebar from '../components/Sidebar';
import DashboardGrid from '../components/DashboardGrid';
import { OrgProjectContext } from '../context/OrgProjectContext';
import BoardPage from './BoardPage';
import CalendarPage from './CalendarPage';
import AllTasksPage from './AllTasksPage';
import LogPage from './LogPage';
import ProjectMembersAvatars from '../components/ProjectMembersAvatars';
import MemberModal from '../components/MemberModal';

const TAB_LIST = [
  { key: 'main', label: 'main' },
  { key: 'board', label: 'board' },
  { key: 'calendar', label: 'calendar' },
  { key: 'tasks', label: 'tasks' },
  { key: 'log', label: 'log' },
];

export default function MainPage() {
  const { organizations, selectedOrgIndex, selectedProjectIndex, currentUser,fetchOrganizations } = useContext(OrgProjectContext);
  const org = organizations[selectedOrgIndex];
  const project = org ? org.projects[selectedProjectIndex] : null;
  const [activeTab, setActiveTab] = useState('main');
  const [showModal, setShowModal] = useState(false);
  // 실제 멤버 데이터 (내가 항상 맨 앞)
///
///	let members = [];
///	if (project && project.members && project.members.length > 0) {
///		 members = project.members;
///  }
	
///	if (currentUser) {
    // 내가 목록에 없다면 추가
///    if (!members.some(m => m.email === currentUser.email)) {
///      members = [{ ...currentUser }, ...members];
///    } else {
      // 내가 이미 있다면 맨 앞으로
///      members = [
///        ...members.filter(m => m.email === currentUser.email),
///        ...members.filter(m => m.email !== currentUser.email)
///      ];
///    }
///  }
///
	//const maxAvatars = 3;
  //const extraCount = Math.max(members.length - maxAvatars, 0);
console.log("dd",currentUser)
///console.log('현재 프로젝트 멤버:', project?.members);
console.log('org:', org);
console.log('선택된 프로젝트:', project);
console.log('선택된 프로젝트 멤버:', project?.members);

///console.log('members:', members);
let members = [];
if (project && project.members && project.members.length > 0) {
  members = project.members;
}

if (currentUser) {
  if (!members.some(m => m.email === currentUser.email)) {
    members = [{ ...currentUser }, ...members];
  } else {
    members = [
      ...members.filter(m => m.email === currentUser.email),
      ...members.filter(m => m.email !== currentUser.email)
    ];
  }
}

console.log('최종 멤버 리스트:', members);

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
        <h1 className="text-3xl font-extrabold mb-2">
          {project?.name || '프로젝트를 선택하세요'}
        </h1>
        <p className="text-gray-500 mb-2">
          {org?.orgName || '조직을 선택하세요'}
        </p>

        {/* 멤버 아바타 & 모달 */}
        <div className="mb-4">
          <button
            className="w-10 h-10 rounded-full bg-yellow-200 flex items-center justify-center shadow hover:scale-105 transition"
            onClick={() => setShowModal(true)}
            aria-label="멤버 보기"
          >
            <span className="text-xl font-bold text-yellow-700">
              {currentUser?.name?.[0]?.toUpperCase() || "?"}
            </span>
          </button>

          {showModal && (
            <MemberModal
              members={members}
              projectId={project?.projectId}
              onClose={() => setShowModal(false)}
              currentUser={currentUser}
              fetchProjects={fetchOrganizations} // ✅ 갱신 함수 전달
            />
          )}
        </div>

        {/* 탭 네비게이션 */}
        <div className="border-b border-gray-200 mb-8 mt-4">
          <nav className="flex space-x-8">
            {TAB_LIST.map(tab => (
              <span
                key={tab.key}
                className={`py-2 px-1 cursor-pointer ${
                  activeTab === tab.key 
                    ? 'border-b-2 border-yellow-400 font-bold text-gray-900' 
                    : 'text-gray-500'
                }`}
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

