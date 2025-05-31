import React, { useContext, useState } from 'react';
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
        <h1 className="text-3xl font-extrabold mb-2">{project ? project.name : '프로젝트를 선택하세요'}</h1>
        <p className="text-gray-500 mb-8">{org ? org.orgName : '조직을 선택하세요'}</p>
        <div className="border-b border-gray-200 mb-8">
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