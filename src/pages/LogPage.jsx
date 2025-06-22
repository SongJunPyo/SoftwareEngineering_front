import React, { useEffect, useState, useContext } from "react";
import Sidebar from "../components/Sidebar";
import { OrgProjectContext } from "../context/OrgProjectContext";
import { logAPI } from "../api/api";

function LogContent() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    logAPI.list()
      .then(res => setLogs(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">🧮 로그</h2>
      <div className="border-l-2 border-gray-300 ml-4">
        {logs.map((log, index) => (
          <div key={log.log_id} className="relative pl-6 mb-8">
            <div className="absolute -left-3 top-1 w-6 h-6 bg-white border-2 border-blue-500 rounded-full flex items-center justify-center text-sm">
              {/* entity_type에 따라 아이콘 변경 */}
              {log.entity_type === "comment" ? "💬" : log.entity_type === "task" ? "📝" : "🧩"}
            </div>
            <div className="text-gray-600 text-sm mb-1">
              {new Date(log.timestamp).toLocaleString()}
            </div>
            <div className="bg-gray-100 rounded-lg p-4 shadow-sm">
              <p className="font-semibold">
                {/* 유저 이름이 있으면 이름, 없으면 user_id */}
                {log.user_name ? log.user_name : '알 수 없음 (탈퇴)'}님이&nbsp;
                {/* 액션/엔티티 */}
                {log.entity_type === "comment" && log.action === "create" && "댓글을 남겼습니다."}
                {log.entity_type === "task" && log.action === "create" && "업무를 생성했습니다."}
                {/* 기타 액션/엔티티 조합도 추가 가능 */}
              </p>
              {/* 상세 내용(예: 댓글 내용, 테스크 제목 등) */}
              {log.details && (
                <p className="text-sm text-gray-700 mt-1">"{log.details}"</p>
              )}
              <p className="text-xs text-gray-500 mt-2">
                entity_id: {log.entity_id} | project_id: {log.project_id}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LogPage({ inner }) {
  const { organizations, selectedOrgIndex, selectedProjectIndex } = useContext(OrgProjectContext);
  const org = organizations[selectedOrgIndex];
  const project = org ? org.projects[selectedProjectIndex] : null;

  if (inner) {
    return <LogContent />;
  }

  return (
    <div className="flex flex-1">
      <Sidebar />
      <main className="flex-1 p-8">
        <h1 className="text-3xl font-extrabold mb-2">{project ? project.name : '프로젝트를 선택하세요'}</h1>
        <p className="text-gray-500 mb-8">{org ? org.orgName : '조직을 선택하세요'}</p>
        <div className="border-b border-gray-200 mb-8">
          <nav className="flex space-x-8">
            <span className="py-2 px-1 text-gray-500 cursor-pointer">main</span>
            <span className="py-2 px-1 text-gray-500 cursor-pointer">board</span>
            <span className="py-2 px-1 text-gray-500 cursor-pointer">callendar</span>
            <span className="py-2 px-1 text-gray-500 cursor-pointer">tasks</span>
            <span className="py-2 px-1 border-b-2 border-yellow-400 font-bold text-gray-900 cursor-pointer">log</span>
          </nav>
        </div>
        <LogContent />
      </main>
    </div>
  );
}
