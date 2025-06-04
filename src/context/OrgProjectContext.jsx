import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../config/axios';

export const OrgProjectContext = createContext();

export function OrgProjectProvider({ children }) {
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrgIndex, setSelectedOrgIndex] = useState(0);
  const [selectedProjectIndex, setSelectedProjectIndex] = useState(0);
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  // 조직 목록 불러오기
  const fetchOrganizations = async () => {
    try {
      const res = await axiosInstance.get('/api/v1/workspaces');
      if (res.data) {
        setOrganizations(res.data.map(ws => ({
          orgName: ws.name,
          orgId: ws.workspace_id,
          projects: [] // 프로젝트는 이후에 연동
        })));
      }
    } catch (e) {
      console.error('조직 목록 불러오기 실패:', e);
      if (e.response?.status === 401) {
        localStorage.removeItem('access_token');
        navigate('/login');
      }
      setOrganizations([]);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  // 프로젝트 목록 불러오기 (조직 선택 시)
  const fetchProjects = async (workspaceId, orgIdx) => {
    try {
      const res = await axiosInstance.get('/api/v1/projects');
      const projects = res.data.filter(p => p.workspace_id === workspaceId)
        .map(p => ({ name: p.title, projectId: p.project_id }));
      setOrganizations(prev => prev.map((org, idx) =>
        idx === orgIdx ? { ...org, projects } : org
      ));
    } catch (e) {
      setOrganizations(prev => prev.map((org, idx) =>
        idx === orgIdx ? { ...org, projects: [] } : org
      ));
    }
  };

  // 조직 선택 (프로젝트 목록도 fetch)
  const selectOrganization = async (orgIdx) => {
    setSelectedOrgIndex(orgIdx);
    setSelectedProjectIndex(0);
    const org = organizations[orgIdx];
    if (org && org.orgId) {
      await fetchProjects(org.orgId, orgIdx);
    }
  };

  // 프로젝트 선택
  const selectProject = (projIdx) => {
    setSelectedProjectIndex(projIdx);
  };

  // 조직 추가 (API 연동)
  const addOrganization = async (orgName) => {
    try {
      await axiosInstance.post('/api/v1/workspaces', {
        name: orgName,
        description: ''
      });
      await fetchOrganizations();
    } catch (e) {
      alert('조직 생성 실패');
    }
  };

  // 프로젝트 추가 (API 연동)
  const addProject = async (orgIdx, projectName) => {
    const org = organizations[orgIdx];
    if (org && org.orgId) {
      try {
        await axiosInstance.post('/api/v1/projects', {
          title: projectName,
          description: '',
          workspace_id: org.orgId
        });
        await fetchProjects(org.orgId, orgIdx);
      } catch (e) {
        alert('프로젝트 생성 실패');
      }
    }
  };

  // 프로젝트명 편집 (API 연동)
  const editProject = async (orgIdx, projIdx) => {
    const org = organizations[orgIdx];
    const project = org?.projects[projIdx];
    const newName = prompt('새 프로젝트명을 입력하세요', project?.name);
    if (newName && project?.projectId) {
      try {
        await axiosInstance.put(`/api/v1/projects/${project.projectId}`, {
          title: newName
        });
        await fetchProjects(org.orgId, orgIdx);
      } catch (e) {
        alert('프로젝트명 수정 실패');
      }
    }
  };

  // 조직 삭제 (API 연동)
  const deleteOrganization = async (orgIdx) => {
    const org = organizations[orgIdx];
    if (org && org.orgId) {
      try {
        await axiosInstance.delete(`/api/v1/workspaces/${org.orgId}`);
        await fetchOrganizations();
        if (selectedOrgIndex === orgIdx) setSelectedOrgIndex(0);
      } catch (e) {
        alert('조직 삭제 실패');
      }
    }
  };

  // 프로젝트 삭제 (API 연동)
  const deleteProject = async (orgIdx, projIdx) => {
    const org = organizations[orgIdx];
    const project = org?.projects[projIdx];
    if (project?.projectId) {
      try {
        await axiosInstance.delete(`/api/v1/projects/${project.projectId}`);
        await fetchProjects(org.orgId, orgIdx);
        if (selectedProjectIndex === projIdx) setSelectedProjectIndex(0);
      } catch (e) {
        alert('프로젝트 삭제 실패');
      }
    }
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

  // 소셜 로그인 핸들러
  const handleSocialLogin = (email, name, token) => {
    setUser({ email, name });
    setIsLoggedIn(true);
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userEmail', email);
    if (name) localStorage.setItem('userName', name);
    if (token) localStorage.setItem('access_token', token);
    fetchOrganizations();
    navigate('/main', { replace: true });
  };

  return (
    <OrgProjectContext.Provider value={{
      organizations,
      selectedOrgIndex,
      selectedProjectIndex,
      user,
      isLoggedIn,
      fetchOrganizations,
      selectOrganization,
      selectProject,
      addOrganization,
      addProject,
      editProject,
      deleteOrganization,
      deleteProject,
      moveOrganization,
      handleSocialLogin,
    }}>
      {children}
    </OrgProjectContext.Provider>
  );
} 