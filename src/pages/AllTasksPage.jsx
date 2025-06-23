import React, { useContext, useState, useEffect } from 'react';
import { OrgProjectContext } from '../context/OrgProjectContext';
import { useNavigate } from 'react-router-dom';
import { taskAPI, projectAPI, authAPI, tagAPI } from '../api/api';
import { Link } from 'react-router-dom';
import TaskDetailPage from './TaskDetailPage';
import Modal from '../components/Task_Modal';
import TagManagementModal from '../components/TagManagementModal';
import { FiSearch } from 'react-icons/fi';
import { useTaskRealtime } from '../websocket/useWebSocket';
import { 
  TASK_STATUS, 
  STATUS_FILTER_OPTIONS, 
  STATUS_FORM_OPTIONS, 
  STATUS_TABLE_STYLES, 
  getStatusLabel 
} from '../constants/taskStatus';

function AllTasksPage() {
  // 1) Context 훅 (항상 최상단)
  const { organizations, selectedOrgIndex, selectedProjectIndex, taskUpdateTrigger } =
    useContext(OrgProjectContext);
  const navigate = useNavigate();

  // 2) State 훅들 (항상 같은 순서로 호출)
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [parentTasks, setParentTasks] = useState([]);
  const [projectTags, setProjectTags] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [openTaskId, setOpenTaskId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  
  // 정렬 및 필터링 상태
  const [sortBy, setSortBy] = useState('task_id'); // ID, updated_at, start_date, due_date
  const [sortOrder, setSortOrder] = useState('desc'); // asc, desc
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterTaskType, setFilterTaskType] = useState(''); // parent, sub, none
  const [form, setForm] = useState({
    title: '',
    startDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date().toISOString().slice(0, 10),
    assignee: '',
    parentTask: '',
    priority: 'medium',
    status: 'todo',
    isParentTask: false,
    selectedTags: [],
  });

  // 3) currentOrg / currentProject 계산
  const currentOrg = organizations?.[selectedOrgIndex];
  const currentProject = currentOrg?.projects?.[selectedProjectIndex];
  const projectId = currentProject?.projectId ?? null;

  // 4) 현재 사용자 정보 가져오기
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) return;

        const response = await authAPI.me();
        setCurrentUser(response.data);
      } catch (error) {
        console.error('현재 사용자 정보 가져오기 실패:', {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        });
      }
    };

    fetchCurrentUser();
  }, []);


  // 5) 프로젝트가 바뀔 때마다 Tasks, Members를 불러오기
  useEffect(() => {
    if (!currentProject || !projectId) return;

    const token = localStorage.getItem('access_token');
    if (!token) {
      alert('로그인 후 이용하세요.');
      navigate('/login');
      return;
    }

    // 7-1) 작업 목록 호출
    taskAPI
      .list({ project_id: projectId })
      .then((res) => {
        console.log('🔍 AllTasksPage API에서 온 실제 업무 데이터:');
        res.data.forEach(task => {
          console.log(`ID: ${task.task_id}, 제목: ${task.title}, 상태: "${task.status}" (타입: ${typeof task.status})`);
        });
        console.log('🔍 AllTasksPage 고유한 상태값들:', [...new Set(res.data.map(task => task.status))]);
        setTasks(res.data);
      })
      .catch((err) => {
        console.error('작업 목록 로드 실패:', {
          message: err.message,
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data
        });
        if (err.response?.status === 401) {
          localStorage.removeItem('access_token');
          navigate('/login');
        }
      });

    // 7-2) 프로젝트 멤버 목록 호출 (role 정보 포함)
    projectAPI
      .getMembers(projectId)
      .then((res) => {
        setMembers(res.data.members || res.data);
        // 현재 사용자의 역할 찾기
        if (currentUser) {
          const memberList = res.data.members || res.data;
          const currentMember = memberList.find(member => member.user_id === currentUser.user_id);
          if (currentMember) {
            setCurrentUserRole(currentMember.role);
          }
        }
      })
      .catch((err) => {
        console.error('프로젝트 멤버 목록 로드 실패:', {
          message: err.message,
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data
        });
        if (err.response?.status === 401) {
          localStorage.removeItem('access_token');
          navigate('/login');
        }
      });

    // 7-3) 상위업무 목록 호출
    taskAPI
      .getParentTasks(projectId)
      .then((res) => {
        setParentTasks(res.data);
      })
      .catch((err) => {
        console.error('상위업무 목록 로드 실패:', {
          message: err.message,
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data
        });
        if (err.response?.status === 401) {
          localStorage.removeItem('access_token');
          navigate('/login');
        }
      });

    // 7-4) 프로젝트 태그 목록 호출
    tagAPI
      .list(projectId)
      .then((res) => {
        setProjectTags(res.data);
      })
      .catch((err) => {
        console.error('프로젝트 태그 목록 로드 실패:', {
          message: err.message,
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data
        });
        if (err.response?.status === 401) {
          localStorage.removeItem('access_token');
          navigate('/login');
        }
      });
  }, [projectId, navigate, currentProject, taskUpdateTrigger]);

  // 5-1) currentUser가 변경되면 역할 다시 확인
  useEffect(() => {
    if (currentUser && members.length > 0) {
      const currentMember = members.find(member => member.user_id === currentUser.user_id);
      if (currentMember) {
        setCurrentUserRole(currentMember.role);
      }
    }
  }, [currentUser, members]);

  // 실시간 Task 업데이트 처리
  useTaskRealtime(projectId, (update) => {
    switch (update.type) {
      case 'created':
        setTasks(prevTasks => {
          // 중복 방지 체크
          const exists = prevTasks.find(task => task.task_id === update.task.task_id);
          if (exists) return prevTasks;
          return [...prevTasks, update.task];
        });
        break;
        
      case 'updated':
        setTasks(prevTasks => 
          prevTasks.map(task =>
            task.task_id === update.task.task_id
              ? { ...task, ...update.task }
              : task
          )
        );
        break;
        
      case 'status_changed':
        setTasks(prevTasks => 
          prevTasks.map(task =>
            task.task_id === update.task.task_id
              ? { 
                  ...task, 
                  status: update.task.new_status || update.task.status,
                  updated_at: new Date().toISOString()
                }
              : task
          )
        );
        break;
        
      case 'deleted':
        setTasks(prevTasks => 
          prevTasks.filter(task => task.task_id !== update.task.task_id)
        );
        break;
    }
  });

  // 6) 조기 리턴: 아직 프로젝트가 선택되지 않았거나 로딩 중이면
  if (!currentOrg || !currentProject) {
    return <div>프로젝트를 선택하거나, 로딩 중입니다…</div>;
  }

  // 7) 모달 열기/닫기 핸들러
  const handleOpenModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);

  // 8) 폼 입력 변화 핸들러
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // 8-1) 태그 선택/해제 핸들러
  const handleTagToggle = (tagName) => {
    setForm(prev => ({
      ...prev,
      selectedTags: prev.selectedTags.includes(tagName)
        ? prev.selectedTags.filter(tag => tag !== tagName)
        : [...prev.selectedTags, tagName]
    }));
  };

  // 9) 폼 제출 (업무 생성)
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 숫자로 변환하거나 null 처리
    const assigneeId = form.assignee ? Number(form.assignee) : null;
    const parentTaskId = form.parentTask ? Number(form.parentTask) : null;

    const payload = {
      title: form.title,
      start_date: form.startDate.length === 10 ? form.startDate + 'T00:00:00' : form.startDate,
      due_date: form.dueDate.length === 10 ? form.dueDate + 'T00:00:00' : form.dueDate,
      assignee_id: assigneeId,
      parent_task_id: parentTaskId,
      priority: form.priority,
      status: form.status,
      project_id: currentProject.projectId,
      is_parent_task: form.isParentTask,
      tag_names: form.selectedTags,
    };

    // 간단 유효성 검사
    if (!payload.title || !payload.start_date || !payload.due_date) {
      alert('업무명, 시작일, 마감일은 필수 입력 항목입니다.');
      return;
    }

    // 담당자 필수 검증
    if (!payload.assignee_id) {
      alert('담당자를 지정해주세요.');
      return;
    }

    // 날짜 유효성 검증
    const startDate = new Date(payload.start_date);
    const dueDate = new Date(payload.due_date);
    if (startDate > dueDate) {
      alert('시작일은 마감일보다 늦을 수 없습니다.');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      
      // 순환 참조 문제를 피하기 위해 안전한 객체 생성
      const safePayload = {
        title: String(payload.title),
        start_date: String(payload.start_date),
        due_date: String(payload.due_date),
        assignee_id: payload.assignee_id,
        parent_task_id: payload.parent_task_id,
        priority: String(payload.priority),
        status: String(payload.status || 'todo'), // 기본값 추가
        project_id: Number(payload.project_id),
        is_parent_task: Boolean(payload.is_parent_task),
        tag_names: Array.isArray(payload.tag_names) ? [...payload.tag_names] : []
      };
      
      console.log('🚀 Task 생성 API 호출:', {
        title: safePayload.title,
        start_date: safePayload.start_date,
        due_date: safePayload.due_date,
        assignee_id: safePayload.assignee_id,
        parent_task_id: safePayload.parent_task_id,
        priority: safePayload.priority,
        status: safePayload.status,
        project_id: safePayload.project_id,
        is_parent_task: safePayload.is_parent_task,
        tag_names: safePayload.tag_names
      });
      
      const res = await taskAPI.create(safePayload);

      console.log('✅ Task 생성 API 응답:', res.data);
      
      // WebSocket 이벤트가 오지 않을 경우를 대비해 즉시 로컬 상태 업데이트
      const newTask = res.data;
      setTasks(prev => {
        const exists = prev.some(task => task.task_id === newTask.task_id);
        if (!exists) {
          console.log('🔄 API 응답으로 Task 즉시 추가:', newTask.title);
          return [...prev, newTask];
        }
        return prev;
      });
      
      handleCloseModal();

      // 폼 초기화
      setForm({
        title: '',
        startDate: new Date().toISOString().slice(0, 10),
        dueDate: new Date().toISOString().slice(0, 10),
        assignee: '',
        parentTask: '',
        priority: 'medium',
        status: 'todo',
        isParentTask: false,
        selectedTags: [],
      });
    } catch (err) {
      console.error('업무 생성 실패:', {
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data
      });
      alert(err.response?.data?.detail || '업무 생성 중 오류가 발생했습니다.');
      if (err.response?.status === 401) {
        localStorage.removeItem('access_token');
        navigate('/login');
      }
    }
  };

  // 10) Task 삭제 함수
  const handleDeleteTask = async (taskId) => {
    // 삭제할 업무 찾기
    const taskToDelete = tasks.find(task => task.task_id === taskId);
    if (!taskToDelete) {
      alert('업무를 찾을 수 없습니다.');
      return;
    }

    // 상위업무인 경우 하위업무 존재 확인
    if (taskToDelete.is_parent_task) {
      const childTasks = tasks.filter(task => task.parent_task_id === taskId);
      if (childTasks.length > 0) {
        const childTaskNames = childTasks.map(task => task.title).join(', ');
        alert('⚠️ 하위업무가 있는 상위업무는 삭제할 수 없습니다.\n\n하위업무: ' + childTaskNames + '\n\n먼저 하위업무들을 삭제하거나 다른 상위업무로 이동해주세요.');
        return;
      }
    }

    if (!window.confirm('정말로 이 업무를 삭제하시겠습니까?')) return;

    try {
      const token = localStorage.getItem('access_token');
      await taskAPI.delete(taskId);
      
      // WebSocket 이벤트가 오지 않을 경우를 대비해 즉시 로컬 상태 업데이트
      setTasks(prev => {
        const filtered = prev.filter(task => task.task_id !== taskId);
        console.log('🔄 API 응답으로 Task 즉시 삭제:', taskId);
        return filtered;
      });
      
    } catch (err) {
      console.error('업무 삭제 실패:', {
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data
      });
      alert(err.response?.data?.detail || '업무 삭제 중 오류가 발생했습니다.');
    }
  };

  // 11) 권한 체크 함수
  const canModifyTask = (task) => {
    if (!currentUser) return false;
    
    // 뷰어는 아무것도 수정할 수 없음
    if (currentUserRole === 'viewer') return false;
    
    // 담당자는 자신의 업무를 수정할 수 있음
    if (task.assignee_id === currentUser.user_id) return true;
    
    // 소유자와 관리자는 모든 업무를 수정할 수 있음
    if (currentUserRole === 'owner' || currentUserRole === 'admin') return true;
    
    // 일반 멤버는 자신이 담당한 업무만 수정 가능 (위에서 이미 체크됨)
    return false;
  };

  // 12) 정렬 및 필터링 처리
  const getFilteredAndSortedTasks = () => {
    let filteredTasks = [...tasks];

    // 검색 필터링
    if (searchTerm) {
      filteredTasks = filteredTasks.filter(task => 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.assignee_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 필터링
    if (filterAssignee) {
      filteredTasks = filteredTasks.filter(task => task.assignee_id === parseInt(filterAssignee));
    }
    if (filterTag) {
      filteredTasks = filteredTasks.filter(task => 
        task.tag_names && task.tag_names.includes(filterTag)
      );
    }
    if (filterStatus) {
      filteredTasks = filteredTasks.filter(task => task.status === filterStatus);
    }
    if (filterPriority) {
      filteredTasks = filteredTasks.filter(task => task.priority === filterPriority);
    }
    if (filterTaskType) {
      if (filterTaskType === 'parent') {
        filteredTasks = filteredTasks.filter(task => task.is_parent_task === true);
      } else if (filterTaskType === 'sub') {
        filteredTasks = filteredTasks.filter(task => task.parent_task_id !== null && task.parent_task_id !== undefined);
      } else if (filterTaskType === 'none') {
        filteredTasks = filteredTasks.filter(task => task.is_parent_task === false && (!task.parent_task_id || task.parent_task_id === null));
      }
    }

    // 정렬
    filteredTasks.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'task_id':
          aValue = a.task_id;
          bValue = b.task_id;
          break;
        case 'updated_at':
          aValue = new Date(a.updated_at || 0);
          bValue = new Date(b.updated_at || 0);
          break;
        case 'start_date':
          aValue = new Date(a.start_date || 0);
          bValue = new Date(b.start_date || 0);
          break;
        case 'due_date':
          aValue = new Date(a.due_date || 0);
          bValue = new Date(b.due_date || 0);
          break;
        default:
          aValue = a.task_id;
          bValue = b.task_id;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filteredTasks;
  };

  // 13) 필터 초기화
  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterAssignee('');
    setFilterTag('');
    setFilterStatus('');
    setFilterPriority('');
    setFilterTaskType('');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 헤더 섹션 */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">All Tasks</h1>
            <p className="text-gray-600 mt-1">프로젝트의 모든 업무를 관리하세요</p>
          </div>
          <div className="flex space-x-3">
            {/* 뷰어가 아닌 경우에만 태그 관리 버튼 표시 */}
            {currentUserRole !== 'viewer' && (
              <button
                onClick={() => setShowTagModal(true)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2 shadow-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <span>태그 관리</span>
              </button>
            )}
            {/* 뷰어가 아닌 경우에만 업무 추가 버튼 표시 */}
            {currentUserRole !== 'viewer' && (
              <button
                onClick={handleOpenModal}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2 shadow-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>업무 추가</span>
              </button>
            )}
            {/* 뷰어인 경우 안내 메시지 표시 */}
            {currentUserRole === 'viewer' && (
              <div className="text-gray-500 text-sm flex items-center px-4 py-3">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                뷰어 권한으로 조회만 가능합니다
              </div>
            )}
          </div>
        </div>
        
        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">
                  {(searchTerm || filterAssignee || filterTag || filterStatus || filterPriority || filterTaskType) ? '필터된 업무' : '전체 업무'}
                </p>
                <p className="text-2xl font-semibold text-gray-900">{getFilteredAndSortedTasks().length}</p>
                {(searchTerm || filterAssignee || filterTag || filterStatus || filterPriority || filterTaskType) && (
                  <p className="text-xs text-gray-400">전체: {tasks.length}</p>
                )}
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">진행중</p>
                <p className="text-2xl font-semibold text-gray-900">{getFilteredAndSortedTasks().filter(t => t.status === 'in_progress').length}</p>
                {(searchTerm || filterAssignee || filterTag || filterStatus || filterPriority || filterTaskType) && (
                  <p className="text-xs text-gray-400">전체: {tasks.filter(t => t.status === 'in_progress').length}</p>
                )}
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">완료</p>
                <p className="text-2xl font-semibold text-gray-900">{getFilteredAndSortedTasks().filter(t => t.status === 'complete').length}</p>
                {(searchTerm || filterAssignee || filterTag || filterStatus || filterPriority || filterTaskType) && (
                  <p className="text-xs text-gray-400">전체: {tasks.filter(t => t.status === 'complete').length}</p>
                )}
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">높은 우선순위</p>
                <p className="text-2xl font-semibold text-gray-900">{getFilteredAndSortedTasks().filter(t => t.priority === 'high').length}</p>
                {(searchTerm || filterAssignee || filterTag || filterStatus || filterPriority || filterTaskType) && (
                  <p className="text-xs text-gray-400">전체: {tasks.filter(t => t.priority === 'high').length}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 검색, 정렬 및 필터링 컨트롤 */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-4">
          {/* 검색 및 정렬을 한 줄에 */}
          <div className="p-3 border-b border-gray-100">
            <div className="flex items-center gap-3 flex-wrap">
              {/* 검색 바 */}
              <div className="relative flex-1 min-w-64">
                <FiSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="작업 또는 담당자 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                />
              </div>
              
              {/* 정렬 컨트롤 */}
              <div className="flex items-center gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-2 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 text-sm"
                >
                  <option value="task_id">ID순</option>
                  <option value="updated_at">수정일순</option>
                  <option value="start_date">시작일순</option>
                  <option value="due_date">마감일순</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="p-2 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                  title={sortOrder === 'asc' ? '오름차순' : '내림차순'}
                >
                  <svg className={`w-4 h-4 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </button>
              </div>

              {/* 초기화 버튼 */}
              <button
                onClick={handleResetFilters}
                className="px-3 py-2 text-gray-600 hover:text-gray-800 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors text-sm"
              >
                초기화
              </button>
            </div>
          </div>

          {/* 필터 섹션 */}
          <div className="p-3">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
              {/* 담당자 필터 */}
              <select
                value={filterAssignee}
                onChange={(e) => setFilterAssignee(e.target.value)}
                className="px-2 py-1.5 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 text-sm"
              >
                <option value="">담당자</option>
                {members.map(member => (
                  <option key={member.user_id} value={member.user_id}>
                    {member.name}
                  </option>
                ))}
              </select>

              {/* 태그 필터 */}
              <select
                value={filterTag}
                onChange={(e) => setFilterTag(e.target.value)}
                className="px-2 py-1.5 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 text-sm"
              >
                <option value="">태그</option>
                {projectTags.map(tag => (
                  <option key={tag.tag_name} value={tag.tag_name}>
                    {tag.tag_name}
                  </option>
                ))}
              </select>

              {/* 상태 필터 */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-2 py-1.5 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 text-sm"
              >
                {STATUS_FILTER_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {/* 우선순위 필터 */}
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-2 py-1.5 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 text-sm"
              >
                <option value="">우선순위</option>
                <option value="high">높음</option>
                <option value="medium">보통</option>
                <option value="low">낮음</option>
              </select>

              {/* 업무 유형 필터 */}
              <select
                value={filterTaskType}
                onChange={(e) => setFilterTaskType(e.target.value)}
                className="px-2 py-1.5 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 text-sm"
              >
                <option value="">유형</option>
                <option value="parent">상위업무</option>
                <option value="sub">하위업무</option>
                <option value="none">독립업무</option>
              </select>
            </div>
          </div>


          {/* 활성 필터 표시 */}
          {(searchTerm || filterAssignee || filterTag || filterStatus || filterPriority || filterTaskType) && (
            <div className="px-3 pb-2 border-t border-gray-100">
              <div className="flex items-center flex-wrap gap-1 pt-2">
                <span className="text-xs text-gray-500 mr-1">활성:</span>
                {searchTerm && (
                  <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">
                    검색: {searchTerm}
                  </span>
                )}
                {filterAssignee && (
                  <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">
                    {members.find(m => m.user_id === parseInt(filterAssignee))?.name}
                  </span>
                )}
                {filterTag && (
                  <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs">
                    {filterTag}
                  </span>
                )}
                {filterStatus && (
                  <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-xs">
                    {getStatusLabel(filterStatus)}
                  </span>
                )}
                {filterPriority && (
                  <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs">
                    {filterPriority === 'high' ? '높음' : filterPriority === 'medium' ? '보통' : '낮음'}
                  </span>
                )}
                {filterTaskType && (
                  <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs">
                    {filterTaskType === 'parent' ? '상위업무' : filterTaskType === 'sub' ? '하위업무' : '독립업무'}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 모달 창 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">새 업무 추가</h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              {/* 업무명 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  업무명<span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  placeholder="업무명을 입력하세요"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* 시작일 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    시작일<span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={form.startDate}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  />
                </div>

                {/* 마감일 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    마감일<span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="date"
                    name="dueDate"
                    value={form.dueDate}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* 담당자 선택 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    담당자<span className="text-red-500 ml-1">*</span>
                  </label>
                  <select
                    name="assignee"
                    value={form.assignee}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  >
                    <option value="">담당자를 선택하세요</option>
                    {members.map(member => (
                      <option
                        key={member.user_id}
                        value={member.user_id}
                      >
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 우선순위 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">우선순위</label>
                  <select
                    name="priority"
                    value={form.priority}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  >
                    <option value="low">🟢 낮음</option>
                    <option value="medium">🟡 보통</option>
                    <option value="high">🔴 높음</option>
                  </select>
                </div>
              </div>

              {/* 상태 선택 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">상태</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                >
                  {STATUS_FORM_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 상위업무로 설정 체크박스 */}
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isParentTask"
                    checked={form.isParentTask}
                    onChange={(e) => setForm(prev => ({ ...prev, isParentTask: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">상위업무로 설정</span>
                </label>
              </div>

              {/* 상위 업무 선택 (상위업무가 아닌 경우에만 표시) */}
              {!form.isParentTask && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">상위 업무</label>
                  <select
                    name="parentTask"
                    value={form.parentTask}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  >
                    <option value="">없음</option>
                    {parentTasks.map(task => (
                      <option
                        key={task.task_id}
                        value={task.task_id}
                      >
                        {task.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* 태그 선택 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">태그</label>
                {projectTags.length === 0 ? (
                  <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded-lg">
                    아직 태그가 없습니다. '태그 관리' 버튼을 눌러 태그를 먼저 생성해주세요.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {projectTags.map(tag => (
                      <button
                        key={tag.tag_name}
                        type="button"
                        onClick={() => handleTagToggle(tag.tag_name)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          form.selectedTags.includes(tag.tag_name)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {tag.tag_name}
                      </button>
                    ))}
                  </div>
                )}
                {form.selectedTags.length > 0 && (
                  <div className="mt-2 text-xs text-gray-600">
                    선택된 태그: {form.selectedTags.join(', ')}
                  </div>
                )}
              </div>

              {/* 취소/저장 버튼 */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                >
                  업무 생성
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 업무 테이블 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  업무명
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  담당자
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  우선순위
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  태그
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  기간
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  액션
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {getFilteredAndSortedTasks().length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <div className="text-gray-400">
                      <svg className="mx-auto h-12 w-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <p className="text-sm font-medium text-gray-500">
                        {tasks.length === 0 ? '아직 업무가 없습니다' : '필터 조건에 맞는 업무가 없습니다'}
                      </p>
                      <p className="text-sm text-gray-400">
                        {tasks.length === 0 ? '첫 번째 업무를 추가해보세요!' : '다른 필터 조건을 시도해보세요.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                getFilteredAndSortedTasks().map((task) => (
                  <tr 
                    key={task.task_id} 
                    className="hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                    onClick={() => setOpenTaskId(task.task_id)}
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-mono text-gray-900">
                        #{task.task_id}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                            {task.title}
                          </div>
                          {task.is_parent_task && (
                            <div className="text-xs text-gray-500 mt-1">
                              📋 상위업무
                            </div>
                          )}
                          {task.parent_task_id && (
                            <div className="text-xs text-gray-500 mt-1">
                              📎 하위 업무 → {task.parent_task_title ? `${task.parent_task_title}(#${task.parent_task_id})` : `#${task.parent_task_id}`}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {task.assignee_name ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">
                                {task.assignee_name.charAt(0)}
                              </span>
                            </div>
                            <span className="text-sm text-gray-900">{task.assignee_name}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">알 수 없음 (탈퇴)</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_TABLE_STYLES[task.status] || STATUS_TABLE_STYLES[TASK_STATUS.TODO]}`}>
                        {getStatusLabel(task.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        task.priority === 'high' ? 'bg-red-100 text-red-800' :
                        task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {task.priority === 'high' ? '🔴 높음' :
                         task.priority === 'medium' ? '🟡 보통' :
                         '🟢 낮음'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {task.tag_names && task.tag_names.length > 0 ? (
                          task.tag_names.map(tagName => (
                            <span
                              key={tagName}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {tagName}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">태그 없음</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <span>📅</span>
                          <span>{task.start_date?.slice(0, 10) || 'N/A'}</span>
                          <span>→</span>
                          <span>{task.due_date?.slice(0, 10) || 'N/A'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setOpenTaskId(task.task_id)}
                          className="text-blue-600 hover:text-blue-900 text-sm font-medium hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                        >
                          상세
                        </button>
                        {canModifyTask(task) && (
                          <button
                            onClick={() => handleDeleteTask(task.task_id)}
                            className="text-red-600 hover:text-red-900 text-sm font-medium hover:bg-red-50 px-2 py-1 rounded transition-colors"
                          >
                            삭제
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Task 상세 모달 */}
      {openTaskId && (
        <Modal onClose={() => setOpenTaskId(null)}>
          <TaskDetailPage
            taskId={openTaskId}
            onClose={() => setOpenTaskId(null)}
          />
        </Modal>
      )}

      {/* 태그 관리 모달 */}
      {showTagModal && (
        <TagManagementModal
          projectId={projectId}
          onClose={() => setShowTagModal(false)}
          onTagChange={() => {
            // 태그가 변경되면 프로젝트 태그 목록을 새로고침
            const token = localStorage.getItem('access_token');
            tagAPI.list(projectId).then((res) => {
              setProjectTags(res.data);
            }).catch((err) => {
              console.error('프로젝트 태그 목록 새로고침 실패:', {
                message: err.message,
                status: err.response?.status,
                statusText: err.response?.statusText,
                data: err.response?.data
              });
            });
          }}
        />
      )}
    </div>
  );
}

export default AllTasksPage;