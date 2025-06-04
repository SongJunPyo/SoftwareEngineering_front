// import React, { useContext, useState } from 'react';
// import Sidebar from '../components/Sidebar';
// import DashboardGrid from '../components/DashboardGrid';
// import { OrgProjectContext } from '../context/OrgProjectContext';
// import BoardPage from './BoardPage';
// import CalendarPage from './CalendarPage';
// import AllTasksPage from './AllTasksPage';
// import LogPage from './LogPage';

// const TAB_LIST = [
//   { key: 'main', label: 'main' },
//   { key: 'board', label: 'board' },
//   { key: 'calendar', label: 'calendar' },
//   { key: 'tasks', label: 'tasks' },
//   { key: 'log', label: 'log' },
// ];

// export default function MainPage() {
//   const { organizations, selectedOrgIndex, selectedProjectIndex } = useContext(OrgProjectContext);
//   const org = organizations[selectedOrgIndex];
//   const project = org ? org.projects[selectedProjectIndex] : null;
//   const [activeTab, setActiveTab] = useState('main');

//   let content;
//   switch (activeTab) {
//     case 'main':
//       content = <DashboardGrid />;
//       break;
//     case 'board':
//       content = <BoardPage inner />;
//       break;
//     case 'calendar':
//       content = <CalendarPage inner />;
//       break;
//     case 'tasks':
//       content = <AllTasksPage inner />;
//       break;
//     case 'log':
//       content = <LogPage inner />;
//       break;
//     default:
//       content = <DashboardGrid />;
//   }

//   return (
//     <div className="flex flex-1">
//       <Sidebar />
//       <main className="flex-1 p-6 pt-0">
//         <h1 className="text-3xl font-extrabold mb-2">{project ? project.name : '프로젝트를 선택하세요'}</h1>
//         <p className="text-gray-500 mb-8">{org ? org.orgName : '조직을 선택하세요'}</p>
//         <div className="border-b border-gray-200 mb-8">
//           <nav className="flex space-x-8">
//             {TAB_LIST.map(tab => (
//               <span
//                 key={tab.key}
//                 className={`py-2 px-1 cursor-pointer ${activeTab === tab.key ? 'border-b-2 border-yellow-400 font-bold text-gray-900' : 'text-gray-500'}`}
//                 onClick={() => setActiveTab(tab.key)}
//               >
//                 {tab.label}
//               </span>
//             ))}
//           </nav>
//         </div>
//         {content}
//       </main>
//     </div>
//   );
// } 

// import React, { useContext, useState } from 'react';
// import Sidebar from '../components/Sidebar';
// import DashboardGrid from '../components/DashboardGrid';
// import { OrgProjectContext } from '../context/OrgProjectContext';
// import BoardPage from './BoardPage';
// import CalendarPage from './CalendarPage';
// import AllTasksPage from './AllTasksPage';
// import LogPage from './LogPage';

// const TAB_LIST = [
//   { key: 'main', label: 'main' },
//   { key: 'board', label: 'board' },
//   { key: 'calendar', label: 'calendar' },
//   { key: 'tasks', label: 'tasks' },
//   { key: 'log', label: 'log' },
// ];

// export default function MainPage() {
//   const { organizations, selectedOrgIndex, selectedProjectIndex } = useContext(OrgProjectContext);
//   const org = organizations[selectedOrgIndex];
//   const project = org ? org.projects[selectedProjectIndex] : null;
//   const [activeTab, setActiveTab] = useState('main');

//   let content;
//   switch (activeTab) {
//     case 'main':
//       content = <DashboardGrid />;
//       break;
//     case 'board':
//       content = <BoardPage inner />;
//       break;
//     case 'calendar':
//       content = <CalendarPage inner />;
//       break;
//     case 'tasks':
//       content = <AllTasksPage inner />;
//       break;
//     case 'log':
//       content = <LogPage inner />;
//       break;
//     default:
//       content = <DashboardGrid />;
//   }

//   return (
//     <div className="flex flex-1">
//       <Sidebar />
//       <main className="flex-1 p-6 pt-0">
//         <h1 className="text-3xl font-extrabold mb-2">{project ? project.name : '프로젝트를 선택하세요'}</h1>
//         <p className="text-gray-500 mb-8">{org ? org.orgName : '조직을 선택하세요'}</p>
//         <div className="border-b border-gray-200 mb-8">
//           <nav className="flex space-x-8">
//             {TAB_LIST.map(tab => (
//               <span
//                 key={tab.key}
//                 className={`py-2 px-1 cursor-pointer ${activeTab === tab.key ? 'border-b-2 border-yellow-400 font-bold text-gray-900' : 'text-gray-500'}`}
//                 onClick={() => setActiveTab(tab.key)}
//               >
//                 {tab.label}
//               </span>
//             ))}
//           </nav>
//         </div>
//         {content}
//       </main>
//     </div>
//   );
// } 
// src/pages/MainPage.jsx
import React, { useContext, useState } from 'react';
import styled from 'styled-components';
import Sidebar from '../components/Sidebar';
import DashboardGrid from '../components/DashboardGrid';
import { OrgProjectContext } from '../context/OrgProjectContext';
import BoardPage from './BoardPage';
import CalendarPage from './CalendarPage';
import AllTasksPage from './AllTasksPage';
import LogPage from './LogPage';

const TAB_LIST = [
  { key: 'main', label: 'main' },
  { key: 'board', label: 'board' },
  { key: 'calendar', label: 'calendar' },
  { key: 'tasks', label: 'tasks' },
  { key: 'log', label: 'log' },
];

export default function MainPage() {
  const { organizations, selectedOrgIndex, selectedProjectIndex } = useContext(OrgProjectContext);
  const org = organizations[selectedOrgIndex];
  const project = org ? org.projects[selectedProjectIndex] : null;
  const [activeTab, setActiveTab] = useState('main');

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
          {project ? project.name : '프로젝트를 선택하세요'}
        </h1>
        <p className="text-gray-500 mb-8">
          {org ? org.orgName : '조직을 선택하세요'}
        </p>

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

// ─── styled-components ─────────────────────────────────────────────────────────

const TabNav = styled.nav`
  display: flex;
  border-bottom: 1px solid #e5e7eb; /* Tailwind’s gray-200 */
  margin-bottom: 2rem; /* mb-8 */
`;

// const TabButton = styled.span`
//   padding: 0.5rem 1rem;            /* 약간의 여백 (py-2, px-4 정도) */
//   margin-right: 1rem;              /* 탭 사이 간격 */
//   border-radius: 6px;              /* 둥근 모서리 */
//   font-weight: ${(props) => (props.active ? '600' : '500')};
//   font-size: 1rem;                 /* base 크기 */
//   cursor: pointer;
//   transition: all 0.3s ease;

//   /* 배경색: 선택된 탭만 #C3D900, 나머지는 투명 */
//   background-color: ${(props) => (props.active ? '#C3D900' : 'transparent')};
//   /* 글자색: 선택된 탭은 흰색, 나머지는 회색(hover 시 조금 진해짐) */
//   color: ${(props) => (props.active ? '#FFFFFF' : '#6B7280')}; /* gray-500 */

//   &:hover {
//     /* 선택된 탭이 아닌 경우에만 호버 시 후광 효과 */
//     ${(props) =>
//       props.active
//         ? ''
//         : `
//       box-shadow: 0 0 20px rgba(195, 217, 0, 0.6);
//       color: #374151; /* gray-700 */
//     `}
//   }

//   &:active {
//     transform: scale(0.97);
//     /* 선택된 탭이 아닌 경우에만 활성(클릭) 시 후광 살짝 확장 */
//     ${(props) =>
//       props.active
//         ? ''
//         : `
//       box-shadow: 0 0 24px rgba(195, 217, 0, 0.7);
//     `}
//   }
// `;
const TabButton = styled.span`
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
