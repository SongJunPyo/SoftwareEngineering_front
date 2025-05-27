import React, { useContext } from "react";
import Sidebar from "../components/Sidebar";
import { OrgProjectContext } from "../context/OrgProjectContext";

const logs = [
  {
    time: "05:20 PM",
    icon: "📝",
    name: "송준표",
    role: "팀원(직무)",
    message: "송준표님이 댓글을 남겼습니다.",
    content: "어쩌구 저쩌구",
  },
  {
    time: "05:18 PM",
    icon: "📄",
    name: "김태수",
    role: "담당자(직책)",
    message: "김태수님이 업무를 생성했습니다.",
    content: "업무명",
  },
  {
    time: "04:30 PM",
    icon: "📥",
    name: "성기영",
    role: "담당자(직책)",
    message: "성기영님이 송준표님을 프로젝트에 초대했습니다.",
    content: "",
  },
  {
    time: "11:30 AM",
    icon: "📄",
    name: "이예나",
    role: "담당자(직책)",
    message: "이예나님이 업무를 수정했습니다.",
    content: "마감일 25.04.30 ~ 25.05.17",
  },
];

function LogContent() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">🧮 로그</h2>
      <div className="border-l-2 border-gray-300 ml-4">
        {logs.map((log, index) => (
          <div key={index} className="relative pl-6 mb-8">
            <div className="absolute -left-3 top-1 w-6 h-6 bg-white border-2 border-blue-500 rounded-full flex items-center justify-center text-sm">
              {log.icon}
            </div>
            <div className="text-gray-600 text-sm mb-1">{log.time}</div>
            <div className="bg-gray-100 rounded-lg p-4 shadow-sm">
              <p className="font-semibold">{log.message}</p>
              {log.content && (
                <p className="text-sm text-gray-700 mt-1">"{log.content}"</p>
              )}
              <p className="text-xs text-gray-500 mt-2">
                {log.name} | {log.role}
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
