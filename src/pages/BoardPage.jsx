import React, { useContext, useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import axios from "axios";
import { OrgProjectContext } from "../context/OrgProjectContext";
import { useNavigate } from "react-router-dom";
import { FiPlus, FiSearch, FiFilter, FiUser, FiCalendar, FiClock, FiTag, FiMoreHorizontal, FiEdit3, FiTrash2 } from "react-icons/fi";
import TaskDetailPage from './TaskDetailPage';
import Modal from '../components/Task_Modal';
import TagManagementModal from '../components/TagManagementModal';

const statusConfig = {
  todo: {
    label: "📝 할 일",
    color: "bg-gray-100",
    textColor: "text-gray-700",
    borderColor: "border-gray-300",
    bgColor: "bg-gray-50",
    headerColor: "bg-gray-200"
  },
  in_progress: {
    label: "🔄 진행중",
    color: "bg-blue-100", 
    textColor: "text-blue-700",
    borderColor: "border-blue-300",
    bgColor: "bg-blue-50",
    headerColor: "bg-blue-100"
  },
  pending: {
    label: "⏸️ 대기",
    color: "bg-yellow-100", 
    textColor: "text-yellow-700",
    borderColor: "border-yellow-300",
    bgColor: "bg-yellow-50",
    headerColor: "bg-yellow-100"
  },
  complete: {
    label: "✅ 완료",
    color: "bg-green-100",
    textColor: "text-green-700", 
    borderColor: "border-green-300",
    bgColor: "bg-green-50",
    headerColor: "bg-green-100"
  }
};

const priorityConfig = {
  low: { label: "🟢 낮음", color: "bg-gray-100 text-gray-700" },
  medium: { label: "🟡 보통", color: "bg-yellow-100 text-yellow-700" },
  high: { label: "🔴 높음", color: "bg-red-100 text-red-700" }
};

function TaskCard({ task, index, onEdit, onDelete, canModify, onClick }) {
  const [showMenu, setShowMenu] = useState(false);
  const priority = priorityConfig[task.priority] || priorityConfig.medium;
  
  const isOverdue = new Date(task.due_date) < new Date() && task.status !== 'complete';
  
  // 업무 유형 판별
  const getTaskType = () => {
    if (task.is_parent_task) {
      return { label: '상위업무', color: 'bg-purple-100 text-purple-700', icon: '📋' };
    } else if (task.parent_task_id) {
      return { label: '하위업무', color: 'bg-orange-100 text-orange-700', icon: '📝' };
    }
    return { label: '독립업무', color: 'bg-gray-100 text-gray-600', icon: '📄' };
  };
  
  const taskType = getTaskType();
  
  return (
    <Draggable draggableId={task.task_id.toString()} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-white rounded-lg shadow-sm border-2 p-4 mb-3 cursor-pointer hover:shadow-md transition-shadow ${
            snapshot.isDragging ? 'rotate-2 shadow-lg' : ''
          } ${isOverdue ? 'border-red-200' : 'border-gray-200'}`}
          onClick={() => onClick(task)}
        >
          {/* 업무 제목과 메뉴 */}
          <div className="flex justify-between items-start mb-3">
            <h4 className="font-medium text-sm text-gray-900 flex-1 pr-2">
              {task.title}
            </h4>
            {canModify && (
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(!showMenu);
                  }}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <FiMoreHorizontal size={16} />
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1 min-w-[120px]">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(task);
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <FiEdit3 size={14} /> 수정
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(task.task_id);
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <FiTrash2 size={14} /> 삭제
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* 업무 유형과 우선순위 */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${taskType.color} flex items-center gap-1`}>
                <span>{taskType.icon}</span>
                {taskType.label}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${priority.color}`}>
                {priority.label}
              </span>
            </div>
            {isOverdue && (
              <span className="text-xs text-red-500 font-medium flex items-center gap-1">
                <FiClock size={12} /> 지연
              </span>
            )}
          </div>
          
          {/* 담당자와 일정 정보 */}
          <div className="flex items-center text-xs text-gray-600 gap-3 mb-2">
            <div className="flex items-center gap-1">
              <FiUser size={12} />
              <span>{task.assignee_name || "미지정"}</span>
            </div>
            <div className="flex items-center gap-1">
              <FiCalendar size={12} />
              <span>{task.due_date?.slice(0, 10) || 'N/A'}</span>
            </div>
          </div>
          
          {/* 상위 업무 정보 (하위업무인 경우) */}
          {task.parent_task_id && task.parent_task_title && (
            <div className="mb-2">
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <span>↳</span>
                <span>상위: {task.parent_task_title}</span>
              </div>
            </div>
          )}
          
          {/* 태그 */}
          {task.tag_names && task.tag_names.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {task.tag_names.slice(0, 3).map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs"
                >
                  <FiTag size={10} />
                  {tag}
                </span>
              ))}
              {task.tag_names.length > 3 && (
                <span className="text-xs text-gray-500">+{task.tag_names.length - 3}</span>
              )}
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}

function Column({ status, config, tasks, onAddTask, onTaskClick, canAddTask, onTaskDelete, canModifyTask }) {
  return (
    <div className={`flex-1 ${config.bgColor} rounded-lg p-4 border ${config.borderColor}`}>
      <div className={`${config.headerColor} rounded-lg p-3 mb-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${config.color.replace('bg-', 'bg-')}`}></div>
            <h3 className={`font-semibold ${config.textColor}`}>
              {config.label}
            </h3>
            <span className="bg-white/50 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
              {tasks.length}
            </span>
          </div>
          {canAddTask && (
            <button
              onClick={() => onAddTask(status)}
              className={`p-1 ${config.textColor} hover:bg-white/30 rounded transition-colors`}
              title="업무 추가"
            >
              <FiPlus size={16} />
            </button>
          )}
        </div>
      </div>
      
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`min-h-[200px] transition-colors rounded-lg ${
              snapshot.isDraggingOver ? 'bg-white/30' : ''
            }`}
          >
            {tasks.map((task, index) => (
              <TaskCard
                key={task.task_id}
                task={task}
                index={index}
                onEdit={() => {}} // 상세 페이지에서 수정
                onDelete={onTaskDelete} // 삭제 기능 활성화
                canModify={canModifyTask(task)} // 담당자에게 수정/삭제 권한 부여
                onClick={onTaskClick}
              />
            ))}
            {provided.placeholder}
            
            {tasks.length === 0 && (
              <div className="text-center text-gray-500 text-sm py-8 bg-white/30 rounded-lg">
                작업이 없습니다
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}

export default function BoardPage() {
  // Context 훅
  const { organizations, selectedOrgIndex, selectedProjectIndex, taskUpdateTrigger } =
    useContext(OrgProjectContext);
  const navigate = useNavigate();

  // State 훅들
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [parentTasks, setParentTasks] = useState([]);
  const [projectTags, setProjectTags] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [openTaskId, setOpenTaskId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  
  // 정렬 및 필터링 상태
  const [sortBy, setSortBy] = useState('task_id');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterTaskType, setFilterTaskType] = useState('');
  
  const [form, setForm] = useState({
    title: '',
    startDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date().toISOString().slice(0, 10),
    assignee: '',
    parentTask: '',
    priority: 'medium',
    isParentTask: false,
    selectedTags: [],
    status: 'todo', // 기본 상태
  });

  // currentOrg / currentProject 계산
  const currentOrg = organizations?.[selectedOrgIndex];
  const currentProject = currentOrg?.projects?.[selectedProjectIndex];
  const projectId = currentProject?.projectId ?? null;

  // 현재 사용자 정보 가져오기
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) return;

        const response = await axios.get('http://localhost:8005/api/v1/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCurrentUser(response.data);
      } catch (error) {
        console.error('현재 사용자 정보 가져오기 실패:', error);
      }
    };

    fetchCurrentUser();
  }, []);

  // 프로젝트가 바뀔 때마다 Tasks, Members를 불러오기
  useEffect(() => {
    if (!currentProject || !projectId) return;

    const token = localStorage.getItem('access_token');
    if (!token) {
      alert('로그인 후 이용하세요.');
      navigate('/login');
      return;
    }

    // 작업 목록 호출
    fetchTasks();
    
    // 프로젝트 멤버 목록 호출 (뷰어 제외)
    fetchMembers();

    // 상위 업무 목록 호출 (업무 생성 시 필요)
    fetchParentTasks();

    // 프로젝트 태그 목록 호출
    fetchProjectTags();

    // 현재 사용자 역할 확인
    fetchCurrentUserRole();
  }, [projectId, navigate, taskUpdateTrigger]);

  // currentUser가 변경되면 역할 다시 확인
  useEffect(() => {
    if (currentUser && projectId) {
      fetchCurrentUserRole();
    }
  }, [currentUser, projectId]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`http://localhost:8005/api/v1/tasks?project_id=${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('🔍 API에서 온 실제 업무 데이터:');
      response.data.forEach(task => {
        console.log(`ID: ${task.task_id}, 제목: ${task.title}, 상태: "${task.status}" (타입: ${typeof task.status})`);
      });
      console.log('🔍 고유한 상태값들:', [...new Set(response.data.map(task => task.status))]);
      setTasks(response.data);
    } catch (error) {
      console.error('작업 목록 로드 실패:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('access_token');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`http://localhost:8005/api/v1/project_members?project_id=${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMembers(response.data.filter(member => member.role !== 'viewer'));
    } catch (error) {
      console.error('멤버 목록 로드 실패:', error);
    }
  };

  const fetchParentTasks = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`http://localhost:8005/api/v1/parent-tasks?project_id=${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setParentTasks(response.data);
    } catch (error) {
      console.error('상위 업무 목록 로드 실패:', error);
    }
  };

  const fetchProjectTags = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`http://localhost:8005/api/v1/projects/${projectId}/tags`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProjectTags(response.data);
    } catch (error) {
      console.error('태그 목록 로드 실패:', error);
    }
  };

  const fetchCurrentUserRole = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`http://localhost:8005/api/v1/projects/${projectId}/members`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (currentUser) {
        const memberList = response.data.members || response.data;
        const userMember = memberList.find(member => member.user_id === currentUser.user_id);
        setCurrentUserRole(userMember?.role || null);
      }
    } catch (error) {
      console.error('사용자 역할 확인 실패:', error);
    }
  };

  // 드래그 앤 드롭 핸들러
  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    
    const { source, destination, draggableId } = result;
    const taskId = parseInt(draggableId);
    const newStatus = destination.droppableId;
    
    // 같은 컬럼 내에서 이동하는 경우
    if (source.droppableId === destination.droppableId) {
      return;
    }
    
    // 1. 권한 확인
    const taskToMove = tasks.find(task => task.task_id === taskId);
    if (!taskToMove) {
      alert('❌ 업무를 찾을 수 없습니다.');
      return;
    }

    // 뷰어 권한 확인
    if (currentUserRole === 'viewer') {
      alert('⛔ 권한이 없습니다.\n뷰어 권한으로는 업무 상태를 변경할 수 없습니다.');
      return;
    }

    // 2. 비즈니스 로직 검증
    const oldStatusLabel = statusConfig[source.droppableId]?.label;
    const newStatusLabel = statusConfig[newStatus]?.label;

    // 완료된 업무를 다시 되돌리는 경우 확인
    if (source.droppableId === 'complete' && newStatus !== 'complete') {
      const confirm = window.confirm(`⚠️ 상태 변경 확인\n\n업무: ${taskToMove.title}\n${oldStatusLabel} → ${newStatusLabel}\n\n완료된 업무를 다시 진행 상태로 되돌리시겠습니까?`);
      if (!confirm) return;
    }

    // 3. 상태 변경 시도
    try {
      const token = localStorage.getItem("access_token");
      await axios.patch(
        `http://localhost:8005/api/v1/tasks/${taskId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // UI 업데이트
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.task_id === taskId ? { ...task, status: newStatus } : task
        )
      );
      
    } catch (error) {
      console.error('작업 상태 변경 실패:', error);
      
      if (error.response?.status === 401) {
        alert('🔒 로그인이 필요합니다.');
        localStorage.removeItem('access_token');
        navigate('/login');
      } else if (error.response?.status === 403) {
        alert('⛔ 권한이 없습니다.\n이 업무의 상태를 변경할 권한이 없습니다.');
      } else if (error.response?.status === 404) {
        alert('❌ 업무를 찾을 수 없습니다.');
      } else {
        alert('❌ 업무 상태 변경에 실패했습니다.\n\n네트워크 연결을 확인하고 다시 시도해주세요.');
      }
    }
  };

  // 업무 추가 모달 열기
  const [selectedStatus, setSelectedStatus] = useState('todo');
  
  const handleOpenModal = (status = 'todo') => {
    setSelectedStatus(status);
    setForm({
      title: '',
      startDate: new Date().toISOString().slice(0, 10),
      dueDate: new Date().toISOString().slice(0, 10),
      assignee: '',
      parentTask: '',
      priority: 'medium',
      isParentTask: false,
      selectedTags: [],
      status: status, // 선택된 상태로 초기화
    });
    setShowModal(true);
  };

  // 업무 추가 모달 닫기
  const handleCloseModal = () => {
    setShowModal(false);
  };

  // 폼 입력 변화 핸들러
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // 태그 선택/해제 핸들러
  const handleTagToggle = (tagName) => {
    setForm(prev => ({
      ...prev,
      selectedTags: prev.selectedTags.includes(tagName)
        ? prev.selectedTags.filter(tag => tag !== tagName)
        : [...prev.selectedTags, tagName]
    }));
  };

  // 업무 추가
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. 입력값 검증 및 변환
    const trimmedTitle = form.title.trim();
    if (!trimmedTitle) {
      alert('⚠️ 업무명을 입력해주세요.');
      return;
    }

    if (trimmedTitle.length > 100) {
      alert('⚠️ 업무명은 100자 이내로 입력해주세요.');
      return;
    }

    if (!form.startDate || !form.dueDate) {
      alert('⚠️ 시작일과 마감일을 모두 선택해주세요.');
      return;
    }

    if (!form.assignee) {
      alert('⚠️ 담당자를 선택해주세요.');
      return;
    }

    // 2. 날짜 유효성 검증
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const startDate = new Date(form.startDate);
    const dueDate = new Date(form.dueDate);
    
    if (startDate > dueDate) {
      alert('⚠️ 시작일은 마감일보다 늦을 수 없습니다.\n시작일: ' + form.startDate + '\n마감일: ' + form.dueDate);
      return;
    }

    if (dueDate < today) {
      const confirm = window.confirm('⚠️ 마감일이 오늘보다 이전입니다.\n정말로 이 날짜로 업무를 생성하시겠습니까?\n\n마감일: ' + form.dueDate);
      if (!confirm) return;
    }

    // 3. 상위업무-하위업무 관계 검증
    if (form.isParentTask && form.parentTask) {
      alert('⚠️ 상위업무로 설정된 경우 다른 상위업무를 가질 수 없습니다.');
      return;
    }

    // 4. 태그 개수 제한
    if (form.selectedTags.length > 5) {
      alert('⚠️ 태그는 최대 5개까지만 선택할 수 있습니다.');
      return;
    }

    // 숫자로 변환하거나 null 처리
    const assigneeId = form.assignee ? Number(form.assignee) : null;
    const parentTaskId = form.parentTask ? Number(form.parentTask) : null;

    const payload = {
      title: trimmedTitle,
      start_date: form.startDate.length === 10 ? form.startDate + 'T00:00:00' : form.startDate,
      due_date: form.dueDate.length === 10 ? form.dueDate + 'T00:00:00' : form.dueDate,
      assignee_id: assigneeId,
      parent_task_id: parentTaskId,
      priority: form.priority,
      project_id: projectId,
      is_parent_task: form.isParentTask,
      tag_names: form.selectedTags,
      status: form.status,
    };

    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.post(
        'http://localhost:8005/api/v1/tasks',
        payload,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const newTask = res.data;
      
      setTasks(prev => {
        const exists = prev.some(task => task.task_id === newTask.task_id);
        if (!exists) {
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
        isParentTask: false,
        selectedTags: [],
        status: 'todo',
      });
    } catch (err) {
      console.error('업무 생성 실패:', err);
      
      if (err.response?.status === 400) {
        const errorDetail = err.response?.data?.detail || '입력값이 올바르지 않습니다.';
        alert('❌ 업무 생성 실패\n\n' + errorDetail);
      } else if (err.response?.status === 401) {
        alert('🔒 로그인이 필요합니다. 로그인 페이지로 이동합니다.');
        localStorage.removeItem('access_token');
        navigate('/login');
      } else if (err.response?.status === 403) {
        alert('⛔ 권한이 없습니다. 이 프로젝트에서 업무를 생성할 권한이 없습니다.');
      } else if (err.response?.status === 500) {
        alert('🔧 서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      } else {
        alert('❌ 업무 생성에 실패했습니다.\n\n네트워크 연결을 확인하고 다시 시도해주세요.');
      }
    }
  };

  // 업무 삭제
  const handleDeleteTask = async (taskId) => {
    // 1. 삭제할 업무 정보 찾기
    const taskToDelete = tasks.find(task => task.task_id === taskId);
    if (!taskToDelete) {
      alert('❌ 삭제할 업무를 찾을 수 없습니다.');
      return;
    }

    // 2. 권한 확인
    if (!canModifyTask(taskToDelete)) {
      alert('⛔ 권한이 없습니다.\n자신이 담당자인 업무만 삭제할 수 있습니다.');
      return;
    }

    // 3. 상위업무인 경우 하위업무 존재 확인
    if (taskToDelete.is_parent_task) {
      const childTasks = tasks.filter(task => task.parent_task_id === taskId);
      if (childTasks.length > 0) {
        const childTaskNames = childTasks.map(task => task.title).join(', ');
        alert('⚠️ 하위업무가 있는 상위업무는 삭제할 수 없습니다.\n\n하위업무: ' + childTaskNames + '\n\n먼저 하위업무들을 삭제하거나 다른 상위업무로 이동해주세요.');
        return;
      }
    }

    // 4. 삭제 확인
    const confirmMessage = `🗑️ 업무 삭제 확인\n\n업무명: ${taskToDelete.title}\n담당자: ${taskToDelete.assignee_name}\n상태: ${statusConfig[taskToDelete.status]?.label}\n\n정말로 이 업무를 삭제하시겠습니까?\n삭제된 업무는 복구할 수 없습니다.`;
    
    if (!window.confirm(confirmMessage)) return;

    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(`http://localhost:8005/api/v1/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setTasks(prev => {
        const filtered = prev.filter(task => task.task_id !== taskId);
        return filtered;
      });
      
      alert('✅ 업무가 성공적으로 삭제되었습니다.');
      
    } catch (err) {
      console.error('업무 삭제 실패:', err);
      
      if (err.response?.status === 400) {
        const errorDetail = err.response?.data?.detail || '삭제할 수 없는 업무입니다.';
        alert('❌ 업무 삭제 실패\n\n' + errorDetail);
      } else if (err.response?.status === 401) {
        alert('🔒 로그인이 필요합니다.');
        localStorage.removeItem('access_token');
        navigate('/login');
      } else if (err.response?.status === 403) {
        alert('⛔ 권한이 없습니다. 이 업무를 삭제할 권한이 없습니다.');
      } else if (err.response?.status === 404) {
        alert('❌ 업무를 찾을 수 없습니다. 이미 삭제되었거나 존재하지 않는 업무입니다.');
        // UI에서도 제거
        setTasks(prev => prev.filter(task => task.task_id !== taskId));
      } else {
        alert('❌ 업무 삭제에 실패했습니다.\n\n네트워크 연결을 확인하고 다시 시도해주세요.');
      }
    }
  };

  // 권한 체크 함수
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

  // 필터링 및 정렬된 작업 목록
  const getFilteredTasks = () => {
    let filteredTasks = [...tasks];

    // 필터링
    if (searchTerm) {
      filteredTasks = filteredTasks.filter(task => 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.assignee_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterAssignee) {
      filteredTasks = filteredTasks.filter(task => task.assignee_id === parseInt(filterAssignee));
    }

    if (filterTag) {
      filteredTasks = filteredTasks.filter(task => 
        task.tag_names && task.tag_names.includes(filterTag)
      );
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
          aValue = new Date(a.updated_at);
          bValue = new Date(b.updated_at);
          break;
        case 'start_date':
          aValue = new Date(a.start_date);
          bValue = new Date(b.start_date);
          break;
        case 'due_date':
          aValue = new Date(a.due_date);
          bValue = new Date(b.due_date);
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

  // 필터 초기화
  const handleResetFilters = () => {
    setSortBy('task_id');
    setSortOrder('desc');
    setSearchTerm('');
    setFilterAssignee('');
    setFilterTag('');
    setFilterPriority('');
    setFilterTaskType('');
  };

  // 상태별로 작업 그룹화
  const filteredTasks = getFilteredTasks();
  const tasksByStatus = Object.keys(statusConfig).reduce((acc, status) => {
    acc[status] = filteredTasks.filter(task => task.status === status);
    return acc;
  }, {});

  // 업무 상세 페이지 열기
  const handleTaskClick = (task) => {
    setOpenTaskId(task.task_id);
  };

  // 업무 상세 페이지 닫기
  const handleTaskDetailClose = () => {
    setOpenTaskId(null);
    // 업무 목록 새로고침
    fetchTasks();
  };

  // 로딩 중일 때 표시
  if (loading) {
    return (
      <div className="h-full bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">업무 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50">
      {/* 업무 상세 페이지 모달 */}
      {openTaskId && (
        <Modal onClose={handleTaskDetailClose}>
          <TaskDetailPage taskId={openTaskId} onClose={handleTaskDetailClose} />
        </Modal>
      )}

      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">칸반 보드</h1>
          <div className="flex space-x-3">
            {/* 뷰어가 아닌 경우에만 태그 관리 버튼 표시 */}
            {currentUserRole !== 'viewer' && (
              <button
                onClick={() => setShowTagModal(true)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2 shadow-sm"
              >
                <FiTag size={16} />
                <span>태그 관리</span>
              </button>
            )}
            {/* 뷰어가 아닌 경우에만 업무 추가 버튼 표시 */}
            {currentUserRole !== 'viewer' && (
              <button
                onClick={handleOpenModal}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2"
              >
                <FiPlus size={18} /> 업무 추가
              </button>
            )}
            {/* 뷰어인 경우 안내 메시지 표시 */}
            {currentUserRole === 'viewer' && (
              <div className="text-gray-500 text-sm flex items-center px-4 py-2">
                <FiUser className="mr-2" size={16} />
                뷰어 권한으로 조회만 가능합니다
              </div>
            )}
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
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

          {/* 활성 필터 및 정렬 표시 */}
          {(searchTerm || filterAssignee || filterTag || filterPriority || filterTaskType || sortBy !== 'task_id' || sortOrder !== 'desc') && (
            <div className="px-3 pb-2 border-t border-gray-100">
              <div className="flex items-center flex-wrap gap-1 pt-2">
                <span className="text-xs text-gray-500 mr-1">활성:</span>
                {(sortBy !== 'task_id' || sortOrder !== 'desc') && (
                  <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs">
                    {sortBy === 'task_id' ? 'ID' : sortBy === 'updated_at' ? '수정일' : sortBy === 'start_date' ? '시작일' : '마감일'} ({sortOrder === 'asc' ? '오름차순' : '내림차순'})
                  </span>
                )}
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
      
      {/* 칸반 보드 */}
      <div className="flex-1 p-6 overflow-auto">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-6 h-full">
            {Object.entries(statusConfig).map(([status, config]) => (
              <Column
                key={status}
                status={status}
                config={config}
                tasks={tasksByStatus[status]}
                onAddTask={handleOpenModal}
                canAddTask={currentUserRole !== 'viewer'}
                onTaskClick={handleTaskClick}
                onTaskDelete={handleDeleteTask}
                canModifyTask={canModifyTask}
              />
            ))}
          </div>
        </DragDropContext>
      </div>
      
      {/* 업무 생성 모달 */}
      {showModal && (
        <Modal onClose={handleCloseModal}>
          <div className="max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              새 업무 추가 {selectedStatus && `(${statusConfig[selectedStatus]?.label})`}
            </h2>
            
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
                  <option value="todo">📝 할 일</option>
                  <option value="in_progress">🔄 진행중</option>
                  <option value="pending">⏸️ 대기</option>
                  <option value="complete">✅ 완료</option>
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
        </Modal>
      )}

      {/* 태그 관리 모달 */}
      {showTagModal && (
        <TagManagementModal
          projectId={projectId}
          projectTags={projectTags}
          setProjectTags={setProjectTags}
          onClose={() => setShowTagModal(false)}
        />
      )}
    </div>
  );
}