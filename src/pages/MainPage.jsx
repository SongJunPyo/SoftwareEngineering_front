import React from 'react';
import { useNavigate } from 'react-router-dom';

const projects = [
  {
    id: 1,
    name: '소프트웨어공학',
    desc: '소프트웨어공학 과제를 수행하는 프로젝트입니다.',
  },
  {
    id: 2,
    name: '데이터미디어공학',
    desc: '데이터미디어공학 과제를 수행하는 프로젝트입니다.',
  },
  // 필요시 프로젝트 추가
];

function MainPage() {
  const navigate = useNavigate();

  const handleProjectClick = (projectName) => {
    navigate(`/workspace/board?project=${encodeURIComponent(projectName)}`);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center py-20">
      <h1 className="text-3xl font-bold mb-8">프로젝트를 선택하세요</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 w-full max-w-5xl">
        {projects.map((project) => (
          <div
            key={project.id}
            className="bg-gray-50 rounded-xl shadow hover:shadow-lg p-8 cursor-pointer border border-gray-200 transition"
            onClick={() => handleProjectClick(project.name)}
          >
            <h2 className="text-xl font-bold mb-2">{project.name}</h2>
            <p className="text-gray-600">{project.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MainPage; 