import React, { createContext, useState } from 'react';

export const OrgProjectContext = createContext();

export function OrgProjectProvider({ children }) {
  // 조직-프로젝트 구조 예시
  const [organizations, setOrganizations] = useState([
    {
      orgName: '소프트웨어공학과',
      projects: [
        { name: 'Project 1' },
        { name: 'Project 2' }
      ]
    },
    {
      orgName: '데이터미디어공학과',
      projects: [
        { name: 'Project 3' }
      ]
    }
  ]);
  const [selectedOrgIndex, setSelectedOrgIndex] = useState(0);
  const [selectedProjectIndex, setSelectedProjectIndex] = useState(0);

  // 조직 선택
  const selectOrganization = (orgIdx) => {
    setSelectedOrgIndex(orgIdx);
    setSelectedProjectIndex(0);
  };
  // 프로젝트 선택
  const selectProject = (projIdx) => {
    setSelectedProjectIndex(projIdx);
  };
  // 조직 추가
  const addOrganization = (orgName) => {
    setOrganizations(prev => [...prev, { orgName, projects: [] }]);
  };
  // 프로젝트 추가
  const addProject = (orgIdx, projectName) => {
    setOrganizations(prev => prev.map((org, idx) => idx === orgIdx ? { ...org, projects: [...org.projects, { name: projectName }] } : org));
  };
  // 조직명 편집 (간단 예시)
  const editOrganization = (orgIdx) => {
    const newName = prompt('새 조직명을 입력하세요', organizations[orgIdx].orgName);
    if (newName) {
      setOrganizations(prev => prev.map((org, idx) => idx === orgIdx ? { ...org, orgName: newName } : org));
    }
  };
  // 프로젝트명 편집 (간단 예시)
  const editProject = (orgIdx, projIdx) => {
    const newName = prompt('새 프로젝트명을 입력하세요', organizations[orgIdx].projects[projIdx].name);
    if (newName) {
      setOrganizations(prev => prev.map((org, oIdx) => oIdx === orgIdx ? {
        ...org,
        projects: org.projects.map((proj, pIdx) => pIdx === projIdx ? { ...proj, name: newName } : proj)
      } : org));
    }
  };
  // 조직 삭제
  const deleteOrganization = (orgIdx) => {
    setOrganizations(prev => prev.filter((_, idx) => idx !== orgIdx));
    if (selectedOrgIndex === orgIdx) setSelectedOrgIndex(0);
  };
  // 프로젝트 삭제
  const deleteProject = (orgIdx, projIdx) => {
    setOrganizations(prev => prev.map((org, idx) => idx === orgIdx ? {
      ...org,
      projects: org.projects.filter((_, pIdx) => pIdx !== projIdx)
    } : org));
    if (selectedProjectIndex === projIdx) setSelectedProjectIndex(0);
  };
  // 조직 순서 변경
  const moveOrganization = (orgIdx, direction) => {
    setOrganizations(prev => {
      const arr = [...prev];
      const targetIdx = orgIdx + direction;
      if (targetIdx < 0 || targetIdx >= arr.length) return arr;
      [arr[orgIdx], arr[targetIdx]] = [arr[targetIdx], arr[orgIdx]];
      return arr;
    });
  };
  // 프로젝트 순서 변경
  const moveProject = (orgIdx, fromIdx, toIdx) => {
    setOrganizations(prev => prev.map((org, idx) => {
      if (idx !== orgIdx) return org;
      const arr = [...org.projects];
      const [removed] = arr.splice(fromIdx, 1);
      arr.splice(toIdx, 0, removed);
      return { ...org, projects: arr };
    }));
  };

  return (
    <OrgProjectContext.Provider value={{
      organizations,
      selectedOrgIndex,
      selectedProjectIndex,
      selectOrganization,
      selectProject,
      addOrganization,
      addProject,
      editOrganization,
      editProject,
      deleteOrganization,
      deleteProject,
      moveOrganization,
      moveProject
    }}>
      {children}
    </OrgProjectContext.Provider>
  );
} 