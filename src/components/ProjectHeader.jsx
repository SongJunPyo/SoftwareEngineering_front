import React, { useState, useContext, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { OrgProjectContext } from "../context/OrgProjectContext";
import { projectAPI } from "../api/api";
import ProjectMembersAvatars from "./ProjectMembersAvatars";
import MemberModal from "./MemberModal";

function ProjectHeader() {
  const location = useLocation();
  const { organizations, selectedOrgIndex, selectedProjectIndex } = useContext(OrgProjectContext);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [projectMembers, setProjectMembers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  // 현재 프로젝트 정보 가져오기
  const currentOrg = organizations[selectedOrgIndex];
  const currentProject = currentOrg?.projects[selectedProjectIndex];

  // 메뉴 항목 정의 (모든 업무 추가됨)
  const navItems = [
    { path: "/workspace/board", label: "보드", icon: "🗂️" },
    { path: "/workspace/calendar", label: "캘린더", icon: "📅" },
    { path: "/workspace/all-tasks", label: "모든 업무", icon: "📋" },
    { path: "/workspace/log", label: "로그", icon: "🧮" },
  ];

  // 프로젝트 멤버 가져오기
  const fetchProjectMembers = async () => {
    if (currentProject?.projectId) {
      try {
        const response = await projectAPI.getMembers(currentProject.projectId);
        setProjectMembers(response.data || []);
      } catch (error) {
        console.error('프로젝트 멤버 조회 실패:', error);
        setProjectMembers([]);
      }
    }
  };

  // 현재 사용자 정보 설정
  useEffect(() => {
    const userEmail = localStorage.getItem('userEmail');
    const userName = localStorage.getItem('userName');
    if (userEmail) {
      setCurrentUser({ email: userEmail, name: userName });
    }
  }, []);

  // 프로젝트 변경 시 멤버 목록 새로고침
  useEffect(() => {
    fetchProjectMembers();
  }, [currentProject?.projectId]);

  const handleAvatarClick = () => {
    setShowMemberModal(true);
  };

  const handleMembersUpdate = () => {
    fetchProjectMembers();
  };

  return (
    <div className="bg-white px-6 py-4 shadow">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <h1 className="text-lg font-bold mb-1">📁 {currentProject?.name || "소프트웨어공학"}</h1>
          <h1 className="font-thin mb-2">소프트웨어공학 과제를 수행하는 것을 목표합니다.</h1>
        </div>
        {currentProject && projectMembers.length > 0 && (
          <div className="flex items-center">
            <ProjectMembersAvatars
              members={projectMembers}
              onAvatarClick={handleAvatarClick}
              maxAvatars={4}
            />
          </div>
        )}
      </div>
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

      {/* 멤버 관리 모달 */}
      {showMemberModal && (
        <MemberModal
          members={projectMembers}
          onClose={() => setShowMemberModal(false)}
          projectId={currentProject?.projectId}
          currentUser={currentUser}
          onMembersUpdate={handleMembersUpdate}
        />
      )}
    </div>
  );
}

export default ProjectHeader;
