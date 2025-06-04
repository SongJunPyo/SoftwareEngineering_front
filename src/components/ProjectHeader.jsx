import React from "react";
import { Link, useLocation } from "react-router-dom";

function ProjectHeader() {
  const location = useLocation();

  // 메뉴 항목 정의 (모든 업무 추가됨)
  const navItems = [
    { path: "/workspace/board", label: "보드", icon: "🗂️" },
    { path: "/workspace/calendar", label: "캘린더", icon: "📅" },
    { path: "/workspace/all-tasks", label: "모든 업무", icon: "📋" },
    { path: "/workspace/log", label: "로그", icon: "🧮" },
  ];

  return (
    <div className="bg-white px-6 py-4 shadow">
      <h1 className="text-lg font-bold mb-2">📁 소프트웨어공학</h1>
      <h1 className="font-thin mb-2">소프트웨어공학 과제를 수행하는 것을 목표합니다.</h1>
      <div className="flex space-x-4 text-sm text-gray-600">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`hover:text-black transition ${
              location.pathname === item.path
                ? "text-black font-semibold underline underline-offset-4"
                : ""
            }`}
          >
            {item.icon} {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default ProjectHeader;
