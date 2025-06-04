import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const OrgProjectContext = createContext({
  organizations: [],
  selectedOrgIndex: 0,
  selectedProjectIndex: 0,
  currentUser: null, // ✅ 쉼표 추가
  setOrganizations: () => {},
  setCurrentUser: () => {},
  // ... 다른 필요한 함수/값들
});

export function OrgProjectProvider({ children }) {
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrgIndex, setSelectedOrgIndex] = useState(0);
  const [selectedProjectIndex, setSelectedProjectIndex] = useState(0);
  const [currentUser, setCurrentUser] = useState(null); // ✅ 상태 관리 추가

  // 조직 목록 불러오기
  const fetchOrganizations = async () => {
    try {
      const token = localStorage.getItem('access_token');
      console.log("Token from localStorage:", token);
      const res = await axios.get('http://localhost:8005/api/v1/workspaces', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrganizations(res.data.map(ws => ({
        orgName: ws.name,
        orgId: ws.workspace_id,
        projects: [] // 프로젝트는 이후에 연동
      })));
    } catch (e) {
      setOrganizations([]);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  // 프로젝트 목록 불러오기 (조직 선택 시)
  const fetchProjects = async (workspaceId, orgIdx) => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('http://localhost:8005/api/v1/projects', {
        headers: { Authorization: `Bearer ${token}` }
      });
	  console.log("프로젝트 API 응답:", res.data);

      const projects = res.data.filter(p => p.workspace_id === workspaceId)
        .map(p => ({ name: p.title, projectId: p.project_id,members: p.members || []  }));
		setOrganizations(prev => prev.map((org, idx) =>
        idx === orgIdx ? { ...org, projects } : org
      ));
    } catch (e) {
      // 실패 시 해당 조직의 프로젝트를 빈 배열로
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
      const token = localStorage.getItem('access_token');
      await axios.post('http://localhost:8005/api/v1/workspaces', {
        name: orgName,
        description: ''
      }, {
        headers: { Authorization: `Bearer ${token}` }
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
        const token = localStorage.getItem('access_token');
        await axios.post('http://localhost:8005/api/v1/projects', {
          title: projectName,
          description: '',
          workspace_id: org.orgId
        }, {
          headers: { Authorization: `Bearer ${token}` }
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
        const token = localStorage.getItem('access_token');
        await axios.put(`http://localhost:8005/api/v1/projects/${project.projectId}`, {
          title: newName
        }, {
          headers: { Authorization: `Bearer ${token}` }
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
        const token = localStorage.getItem('access_token');
        await axios.delete(`http://localhost:8005/api/v1/workspaces/${org.orgId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
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
        const token = localStorage.getItem('access_token');
        await axios.delete(`http://localhost:8005/api/v1/projects/${project.projectId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
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
  // 프로젝트 순서/조직 이동 (드래그앤드롭)
  const moveProject = async (orgIdx, fromIdx, toIdx, destOrgIdx = null) => {
    const org = organizations[orgIdx];
    const project = org?.projects[fromIdx];
    if (!project?.projectId) return;
    const token = localStorage.getItem('access_token');
    // 같은 조직 내 순서 변경
    if (destOrgIdx === null || destOrgIdx === orgIdx) {
      // 순서 정보 전체를 백엔드에 전송
      const newOrder = organizations[orgIdx].projects.map((p, idx) => ({
        project_id: p.projectId,
        order: idx
      }));
      try {
        await axios.put('http://localhost:8005/api/v1/projects/order', newOrder, {
          headers: { Authorization: `Bearer ${token}` }
        });
        await fetchProjects(org.orgId, orgIdx);
      } catch (e) {
        alert('프로젝트 순서 변경 실패');
      }
    } else {
      // 조직 간 이동
      const destOrg = organizations[destOrgIdx];
      if (!destOrg?.orgId) return;
      try {
        await axios.put(`http://localhost:8005/api/v1/projects/${project.projectId}/move`, {
          workspace_id: destOrg.orgId
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        // 이동 후 양쪽 조직의 프로젝트 목록 새로고침
        await fetchProjects(org.orgId, orgIdx);
        await fetchProjects(destOrg.orgId, destOrgIdx);
      } catch (e) {
        alert('프로젝트 이동 실패');
      }
    }
  };

  return (
    <OrgProjectContext.Provider value={{
      organizations,
      selectedOrgIndex,
      selectedProjectIndex,
      setOrganizations, // 임시로 노출
      selectOrganization,
      selectProject,
      addOrganization,
      addProject,
      editProject,
      deleteOrganization,
      deleteProject,
      moveOrganization,
      moveProject,
      setCurrentUser, 
      fetchOrganizations, // 외부에서 호출 가능하게 추가
    }}>
      {children}
    </OrgProjectContext.Provider>
  );
} 
