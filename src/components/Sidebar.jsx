import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';

function Sidebar() {
  const [showProjects, setShowProjects] = useState(true);
  const [showTasks, setShowTasks] = useState(true);
  const [showPersonal, setShowPersonal] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [extraProjects, setExtraProjects] = useState([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();

  // 프로젝트 클릭 핸들러
  const handleProjectClick = (projectName) => {
    // 실제로는 projectId 등으로 이동해야 하지만, 예시로 쿼리스트링 사용
    navigate(`/workspace/board?project=${encodeURIComponent(projectName)}`);
  };

  return (
    <aside className={`bg-gray-50 shadow h-full p-4 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      {/* 접힘/펼침 토글 버튼 */}
      <div className="flex justify-between items-center mb-4">
        <h2 className={`text-lg font-bold transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'}`}>내 프로젝트</h2>
        <button
          className="bg-blue-300 text-white px-2 py-1 rounded text-lg"
          onClick={() => setIsCollapsed((prev) => !prev)}
        >
          {isCollapsed ? '→' : '←'}
        </button>
      </div>
      {!isCollapsed && (
        <ul className="space-y-2 text-sm">
          {/* 창원대학교 */}
          <li>
            <div
              className="flex justify-between items-center bg-gray-200 px-2 py-1 rounded cursor-pointer"
              onClick={() => setShowProjects(!showProjects)}
            >
              <span className="font-semibold text-purple-600">창원대학교</span>
              <span className="text-gray-600 text-lg">{showProjects ? "−" : "+"}</span>
            </div>
            {showProjects && (
              <ul className="ml-4 mt-1 space-y-1 bg-white p-2 rounded">
                <li className="flex items-center space-x-2 text-purple-500 cursor-pointer" onClick={() => handleProjectClick('소프트웨어공학')}>
                  <div className="w-2 h-2 rounded-full bg-purple-500" />
                  <span>소프트웨어공학</span>
                </li>
                <li className="flex items-center space-x-2 text-gray-700 cursor-pointer" onClick={() => handleProjectClick('데이터미디어공학')}>
                  <div className="w-2 h-2 rounded-full bg-purple-300" />
                  <span>데이터미디어공학</span>
                </li>
              </ul>
            )}
          </li>
          {/* 업무 */}
          <li>
            <div
              className="flex justify-between items-center bg-gray-200 px-2 py-1 rounded cursor-pointer"
              onClick={() => setShowTasks(!showTasks)}
            >
              <span className="font-semibold text-blue-700">업무</span>
              <span className="text-gray-600 text-lg">{showTasks ? "−" : "+"}</span>
            </div>
            {showTasks && (
              <ul className="ml-4 mt-1 space-y-1 bg-white p-2 rounded">
                {["업무1", "업무2", "업무3", "업무4"].map((task, idx) => (
                  <li key={idx} className="flex items-center space-x-2 text-gray-700">
                    <div className="w-2 h-2 rounded-full bg-blue-300" />
                    <span>{task}</span>
                  </li>
                ))}
              </ul>
            )}
          </li>
          {/* 개인 */}
          <li>
            <div
              className="flex justify-between items-center bg-gray-200 px-2 py-1 rounded cursor-pointer"
              onClick={() => setShowPersonal(!showPersonal)}
            >
              <span className="font-semibold text-blue-700">개인</span>
              <span className="text-gray-600 text-lg">{showPersonal ? "−" : "+"}</span>
            </div>
            {showPersonal && (
              <ul className="ml-4 mt-1 space-y-1 bg-white p-2 rounded">
                {["내 업무1", "내 업무2"].map((item, idx) => (
                  <li key={idx} className="flex items-center space-x-2 text-gray-700">
                    <div className="w-2 h-2 rounded-full bg-blue-300" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </li>
          {/* 기타 추가된 프로젝트 */}
          {extraProjects.length > 0 && (
            <li>
              <ul className="ml-2 mt-1 space-y-1">
                {extraProjects.map((project, idx) => (
                  <li key={idx} className="flex items-center space-x-2 text-gray-700 cursor-pointer" onClick={() => handleProjectClick(project.name)}>
                    <div className="w-2 h-2 rounded-full bg-gray-400" />
                    <span>{project.name}</span>
                  </li>
                ))}
              </ul>
            </li>
          )}
        </ul>
      )}
      {showModal && !isCollapsed && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-white p-6 rounded shadow-md w-80">
            <h3 className="text-lg font-bold mb-4">새 프로젝트 만들기</h3>
            <input
              type="text"
              placeholder="프로젝트명"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full border px-3 py-2 mb-3 rounded"
            />
            <textarea
              placeholder="설명"
              value={projectDesc}
              onChange={(e) => setProjectDesc(e.target.value)}
              className="w-full border px-3 py-2 mb-3 rounded"
            />
            <div className="flex justify-end space-x-2">
              <button
                className="px-3 py-1 bg-gray-300 rounded"
                onClick={() => setShowModal(false)}
              >
                취소
              </button>
              <button
                className="px-3 py-1 bg-blue-500 text-white rounded"
                onClick={() => {
                  if (projectName.trim()) {
                    setExtraProjects((prev) => [
                      ...prev,
                      { name: projectName.trim(), desc: projectDesc.trim() },
                    ]);
                    setShowModal(false);
                    setProjectName("");
                    setProjectDesc("");
                  }
                }}
              >
                생성
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;
