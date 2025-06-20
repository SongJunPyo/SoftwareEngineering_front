import React, { createContext, useState, useEffect } from 'react';
import { workspaceAPI, projectAPI, workspaceProjectOrderAPI } from '../api/api';
import { useNavigate } from 'react-router-dom';

export const OrgProjectContext = createContext();

export function OrgProjectProvider({ children }) {
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrgIndex, setSelectedOrgIndex] = useState(0);
  const [selectedProjectIndex, setSelectedProjectIndex] = useState(0);
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Task 상태 관리를 위한 상태
  const [taskUpdateTrigger, setTaskUpdateTrigger] = useState(0);
  const navigate = useNavigate();

  // 조직 목록 불러오기
  const fetchOrganizations = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.log('토큰이 없어 조직 목록을 불러올 수 없습니다.');
        return;
      }

      const res = await workspaceAPI.list();

      if (res.data) {
        const orgsWithProjects = [];
        
        // 워크스페이스를 order 순으로 정렬
        const sortedWorkspaces = res.data.sort((a, b) => (a.order || 0) - (b.order || 0));
        
        // 각 워크스페이스에 대해 프로젝트도 함께 로드
        for (const ws of sortedWorkspaces) {
          try {
            const projectRes = await workspaceProjectOrderAPI.getProjects(ws.workspace_id);
            const projects = projectRes.data.map(p => ({ 
              name: p.title, 
              projectId: p.project_id,
              userRole: p.user_role,
              projectOrder: p.project_order
            }));
            
            orgsWithProjects.push({
              orgName: ws.name,
              orgId: ws.workspace_id,
              order: ws.order,
              projects: projects
            });
          } catch (projectError) {
            console.error(`워크스페이스 ${ws.name}의 프로젝트 로딩 실패:`, projectError);
            orgsWithProjects.push({
              orgName: ws.name,
              orgId: ws.workspace_id,
              order: ws.order,
              projects: []
            });
          }
        }
        
        setOrganizations(orgsWithProjects);
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
      const res = await workspaceProjectOrderAPI.getProjects(workspaceId);
      const projects = res.data.map(p => ({ 
        name: p.title, 
        projectId: p.project_id,
        userRole: p.user_role,
        projectOrder: p.project_order
      }));
      
      setOrganizations(prev => prev.map((org, idx) =>
        idx === orgIdx ? { ...org, projects } : org
      ));
    } catch (e) {
      console.error('프로젝트 목록 불러오기 실패:', e);
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
      await workspaceAPI.create({
        name: orgName,
        description: ''
      });
      await fetchOrganizations();
    } catch (e) {
      console.error('조직 생성 실패:', e);
      alert('조직 생성 실패');
    }
  };

  // 조직명 편집 (API 연동)
  const editOrganization = async (orgIdx) => {
    const org = organizations[orgIdx];
    const newName = prompt('새 조직명을 입력하세요', org?.orgName);
    if (newName && org?.orgId) {
      try {
        await workspaceAPI.update(org.orgId, {
          name: newName
        });
        await fetchOrganizations();
      } catch (e) {
        console.error('조직명 수정 실패:', e);
        alert('조직명 수정 실패');
      }
    }
  };

  // 프로젝트 추가 (API 연동)
  const addProject = async (orgIdx, projectName) => {
    const org = organizations[orgIdx];
    if (org && org.orgId) {
      try {
        // 프로젝트를 생성하면서 동시에 워크스페이스에 연결
        const projectRes = await projectAPI.create({
          title: projectName,
          description: '',
          workspace_id: org.orgId
        });
        
        // 전체 조직 목록 새로고침
        await fetchOrganizations();
      } catch (e) {
        console.error('프로젝트 생성 실패:', e);
        console.error('오류 상세:', e.response?.data);
        alert(`프로젝트 생성 실패: ${e.response?.data?.detail || e.message}`);
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
        await projectAPI.update(project.projectId, {
          title: newName
        });
        // 전체 조직 목록 새로고침
        await fetchOrganizations();
      } catch (e) {
        console.error('프로젝트명 수정 실패:', e);
        alert('프로젝트명 수정 실패');
      }
    }
  };

  // 조직 삭제 (API 연동)
  const deleteOrganization = async (orgIdx) => {
    const org = organizations[orgIdx];
    if (org && org.orgId) {
      try {
        await workspaceAPI.delete(org.orgId);
        await fetchOrganizations();
        if (selectedOrgIndex === orgIdx) setSelectedOrgIndex(0);
      } catch (e) {
        console.error('조직 삭제 실패:', e);
        if (e.response?.status === 400) {
          // 워크스페이스에 프로젝트가 있는 경우
          alert(e.response.data.detail || '워크스페이스에 프로젝트가 있습니다. 모든 프로젝트를 삭제하거나 다른 워크스페이스로 이동한 후 삭제해주세요.');
        } else {
          alert('조직 삭제 실패');
        }
      }
    }
  };

  // 프로젝트 삭제 (API 연동)
  const deleteProject = async (orgIdx, projIdx) => {
    const org = organizations[orgIdx];
    const project = org?.projects[projIdx];
    if (project?.projectId) {
      try {
        await projectAPI.delete(project.projectId);
        // 전체 조직 목록 새로고침
        await fetchOrganizations();
        if (selectedProjectIndex === projIdx) setSelectedProjectIndex(0);
      } catch (e) {
        console.error('프로젝트 삭제 실패:', e);
        console.error('오류 상세:', e.response?.data);
        alert(`프로젝트 삭제 실패: ${e.response?.data?.detail || e.message}`);
      }
    }
  };

  // 조직 순서 변경 (드래그 앤 드롭)
  const moveOrganization = async (sourceIndex, destinationIndex) => {
    const newOrganizations = [...organizations];
    
    // 드래그한 아이템을 제거하고 새 위치에 삽입
    const [movedOrg] = newOrganizations.splice(sourceIndex, 1);
    newOrganizations.splice(destinationIndex, 0, movedOrg);
    
    setOrganizations(newOrganizations);
    
    try {
      // 서버에 순서 업데이트 전송
      const workspaceOrders = newOrganizations.map((org, idx) => ({
        workspace_id: org.orgId,
        order: idx // order는 0부터 시작
      }));
      
      console.log('워크스페이스 순서 업데이트 요청:', { workspace_orders: workspaceOrders });
      console.log('workspaceOrders 상세:', workspaceOrders);
      await workspaceAPI.updateOrder({ workspace_orders: workspaceOrders });
    } catch (e) {
      console.error('워크스페이스 순서 변경 실패:', e);
      // 실패 시 원래 상태로 복원
      await fetchOrganizations();
    }
  };

  // 프로젝트 순서/조직 이동 (드래그앤드롭)
  const moveProject = async (orgIdx, fromIdx, toIdx, destOrgIdx = null) => {
    const org = organizations[orgIdx];
    const project = org?.projects[fromIdx];
    if (!project?.projectId || !org?.orgId) return;

    // 같은 조직 내 순서 변경
    if (destOrgIdx === null || destOrgIdx === orgIdx) {
      try {
        // 로컬 상태 먼저 업데이트
        const newOrganizations = [...organizations];
        const newProjects = [...newOrganizations[orgIdx].projects];
        const [moved] = newProjects.splice(fromIdx, 1);
        newProjects.splice(toIdx, 0, moved);
        newOrganizations[orgIdx].projects = newProjects;
        setOrganizations(newOrganizations);

        // 새로운 순서를 백엔드에 전송
        const projectOrders = newProjects.map((p, idx) => ({
          project_id: p.projectId,
          order: idx
        }));
        
        await workspaceProjectOrderAPI.updateOrder({
          workspace_id: org.orgId,
          project_orders: projectOrders
        });
      } catch (e) {
        console.error('프로젝트 순서 변경 실패:', e);
        alert('프로젝트 순서 변경 실패');
        // 실패 시 원래 상태로 복원
        await fetchOrganizations();
      }
    } else {
      // 조직 간 이동
      const destOrg = organizations[destOrgIdx];
      if (!destOrg?.orgId) return;
      
      try {
        // 워크스페이스 간 이동
        await workspaceProjectOrderAPI.removeProject(org.orgId, project.projectId);
        const targetOrder = destOrg.projects.length;
        await workspaceProjectOrderAPI.addProject({
          workspace_id: destOrg.orgId,
          project_id: project.projectId,
          project_order: targetOrder
        });
        
        // 전체 조직 목록 새로고침
        await fetchOrganizations();
      } catch (e) {
        console.error('프로젝트 이동 실패:', e);
        alert('프로젝트 이동 실패');
      }
    }
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

  // Task 업데이트 트리거 함수
  const triggerTaskUpdate = () => {
    setTaskUpdateTrigger(prev => prev + 1);
  };

  return (
    <OrgProjectContext.Provider value={{
      organizations,
      selectedOrgIndex,
      selectedProjectIndex,
      taskUpdateTrigger,
      setOrganizations,
      selectOrganization,
      selectProject,
      addOrganization,
      editOrganization,
      addProject,
      editProject,
      deleteOrganization,
      deleteProject,
      moveOrganization,
      moveProject,
      fetchOrganizations,
      handleSocialLogin,
      triggerTaskUpdate,
    }}>
      {children}
    </OrgProjectContext.Provider>
  );
}
