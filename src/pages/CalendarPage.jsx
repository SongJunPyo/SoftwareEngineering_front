import React, { useContext, useRef, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { OrgProjectContext } from "../context/OrgProjectContext";
import { taskAPI, projectAPI, authAPI, tagAPI } from '../api/api';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import TaskDetailPage from './TaskDetailPage';
import Modal from '../components/Task_Modal';
import { 
  TASK_STATUS, 
  STATUS_CONFIG_CALENDAR, 
  STATUS_FILTER_OPTIONS 
} from '../constants/taskStatus';

function CalendarContent() {
  const { organizations, selectedOrgIndex, selectedProjectIndex, taskUpdateTrigger, triggerTaskUpdate } = useContext(OrgProjectContext);
  const navigate = useNavigate();
  const calendarRef = useRef(null);
  const [calendarView] = useState('dayGridMonth');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  
  // 업무 데이터 상태
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [projectTags, setProjectTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  
  // 모달 상태
  const [openTaskId, setOpenTaskId] = useState(null);
  
  // 필터 상태
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterTaskType, setFilterTaskType] = useState('');

  // 현재 프로젝트 정보
  const org = organizations[selectedOrgIndex];
  const project = org ? org.projects[selectedProjectIndex] : null;
  const projectId = project?.projectId;

  // 상태별 설정 (공통 상수 사용)
  const statusConfig = STATUS_CONFIG_CALENDAR;

  // 우선순위별 색상
  const priorityColors = {
    high: "#ef4444",
    medium: "#f59e0b", 
    low: "#10b981"
  };

  // 현재 사용자 정보 로드
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) return;

        const response = await authAPI.me();
        setCurrentUser(response.data);
      } catch (error) {
        console.error('현재 사용자 정보 가져오기 실패:', error);
      }
    };

    fetchCurrentUser();
  }, []);

  // 업무 데이터 로드
  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }
    
    const loadData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('access_token');
        if (!token) {
          navigate('/login');
          return;
        }

        // 병렬로 데이터 로드
        const [tasksRes, membersRes, memberRolesRes, tagsRes] = await Promise.all([
          taskAPI.list({ project_id: projectId }),
          projectAPI.getMembers(projectId),
          projectAPI.getMembers(projectId),
          tagAPI.list(projectId)
        ]);

        setTasks(tasksRes.data);
        setMembers(membersRes.data.members || membersRes.data);
        setProjectTags(tagsRes.data);

        // 현재 사용자 역할 설정
        if (currentUser) {
          const memberList = memberRolesRes.data.members || memberRolesRes.data;
          const currentMember = memberList.find(member => member.user_id === currentUser.user_id);
          if (currentMember) {
            setCurrentUserRole(currentMember.role);
          }
        }
      } catch (error) {
        console.error('데이터 로드 실패:', error);
        if (error.response?.status === 401) {
          localStorage.removeItem('access_token');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [projectId, navigate, currentUser, taskUpdateTrigger]);

  // currentUser가 변경되면 역할 다시 확인
  useEffect(() => {
    if (currentUser && members.length > 0) {
      const currentMember = members.find(member => member.user_id === currentUser.user_id);
      if (currentMember) {
        setCurrentUserRole(currentMember.role);
      }
    }
  }, [currentUser, members]);

  // 권한 체크 함수
  const canModifyTask = (task) => {
    if (!currentUser) return false;
    
    // 뷰어는 아무것도 수정할 수 없음
    if (currentUserRole === 'viewer') return false;
    
    // 담당자는 자신의 업무를 수정할 수 있음
    if (task.assignee_id === currentUser.user_id) return true;
    
    // 소유자와 관리자는 모든 업무를 수정할 수 있음
    if (currentUserRole === 'owner' || currentUserRole === 'admin') return true;
    
    // 일반 멤버는 자신이 담당한 업무만 수정 가능
    return false;
  };

  // 필터링된 업무 목록
  const getFilteredTasks = () => {
    let filteredTasks = [...tasks];

    // 검색 필터링
    if (searchTerm) {
      filteredTasks = filteredTasks.filter(task => 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.assignee_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 담당자 필터
    if (filterAssignee) {
      filteredTasks = filteredTasks.filter(task => task.assignee_id === parseInt(filterAssignee));
    }

    // 태그 필터
    if (filterTag) {
      filteredTasks = filteredTasks.filter(task => 
        task.tag_names && task.tag_names.includes(filterTag)
      );
    }

    // 상태 필터
    if (filterStatus) {
      filteredTasks = filteredTasks.filter(task => task.status === filterStatus);
    }

    // 우선순위 필터
    if (filterPriority) {
      filteredTasks = filteredTasks.filter(task => task.priority === filterPriority);
    }

    // 업무 타입 필터
    if (filterTaskType) {
      if (filterTaskType === 'parent') {
        filteredTasks = filteredTasks.filter(task => task.is_parent_task === true);
      } else if (filterTaskType === 'sub') {
        filteredTasks = filteredTasks.filter(task => task.parent_task_id !== null && task.parent_task_id !== undefined);
      } else if (filterTaskType === 'none') {
        filteredTasks = filteredTasks.filter(task => task.is_parent_task === false && (!task.parent_task_id || task.parent_task_id === null));
      }
    }

    return filteredTasks;
  };

  // 업무를 캘린더 이벤트로 변환
  const getCalendarEvents = () => {
    const filteredTasks = getFilteredTasks();
    
    return filteredTasks.map(task => {
      const startDate = task.start_date ? task.start_date.slice(0, 10) : null;
      const dueDate = task.due_date ? task.due_date.slice(0, 10) : null;
      
      // 시작일과 마감일이 다르면 기간 이벤트로 표시
      if (startDate && dueDate && startDate !== dueDate) {
        return {
          id: `task-${task.task_id}`,
          title: `${task.title} (${task.assignee_name || '알 수 없음 (탈퇴)'})`,
          start: startDate,
          end: dueDate,
          backgroundColor: priorityColors[task.priority] || '#6b7280',
          borderColor: priorityColors[task.priority] || '#6b7280',
          extendedProps: {
            taskId: task.task_id,
            priority: task.priority,
            status: task.status,
            assignee: task.assignee_name,
            tags: task.tag_names,
            description: task.description,
            isParent: task.is_parent_task,
            parentId: task.parent_task_id
          }
        };
      }
      
      // 마감일만 있으면 마감일에 표시
      const eventDate = dueDate || startDate;
      if (eventDate) {
        return {
          id: `task-${task.task_id}`,
          title: `${task.title} (${task.assignee_name || '알 수 없음 (탈퇴)'})`,
          start: eventDate,
          backgroundColor: priorityColors[task.priority] || '#6b7280',
          borderColor: priorityColors[task.priority] || '#6b7280',
          extendedProps: {
            taskId: task.task_id,
            priority: task.priority,
            status: task.status,
            assignee: task.assignee_name,
            tags: task.tag_names,
            description: task.description,
            isParent: task.is_parent_task,
            parentId: task.parent_task_id
          }
        };
      }
      
      return null;
    }).filter(Boolean);
  };

  // 월 이동
  const handlePrevMonth = () => {
    if (calendarRef.current) {
      calendarRef.current.getApi().prev();
    }
  };

  const handleNextMonth = () => {
    if (calendarRef.current) {
      calendarRef.current.getApi().next();
    }
  };

  // 현재 월 포맷
  const getMonthLabel = (date) => {
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${year}/${month}`;
  };

  // 해당 날짜의 업무 목록
  const getTasksForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    const filteredTasks = getFilteredTasks();
    
    return filteredTasks.filter(task => {
      const startDate = task.start_date?.slice(0, 10);
      const dueDate = task.due_date?.slice(0, 10);
      
      // 시작일부터 마감일 사이의 날짜에 포함되는지 확인
      if (startDate && dueDate) {
        return dateStr >= startDate && dateStr <= dueDate;
      }
      
      // 마감일 또는 시작일과 일치하는지 확인
      return dateStr === dueDate || dateStr === startDate;
    });
  };

  // 필터 초기화
  const clearFilters = () => {
    setSearchTerm('');
    setFilterAssignee('');
    setFilterTag('');
    setFilterStatus('');
    setFilterPriority('');
    setFilterTaskType('');
  };

  if (!project) {
    return (
      <div className="relative w-full h-screen p-6 flex items-center justify-center">
        <div className="text-gray-500">프로젝트를 선택해주세요.</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="relative w-full h-screen p-6 flex items-center justify-center">
        <div className="text-gray-500">업무 데이터를 로드 중입니다...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen p-6">
      {/* 필터 섹션 */}
      <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-wrap gap-4 items-center mb-4">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="업무명 또는 담당자 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <select
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">모든 담당자</option>
            {members.map(member => (
              <option key={member.user_id} value={member.user_id}>
                {member.name}
              </option>
            ))}
          </select>

          <select
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">모든 태그</option>
            {projectTags.map(tag => (
              <option key={tag.tag_name} value={tag.tag_name}>
                {tag.tag_name}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">모든 상태</option>
            <option value="todo">📝 할 일</option>
            <option value="in_progress">🔄 진행중</option>
            <option value="complete">✅ 완료</option>
            <option value="pending">⏸️ 대기</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">모든 우선순위</option>
            <option value="high">🔴 높음</option>
            <option value="medium">🟡 보통</option>
            <option value="low">🟢 낮음</option>
          </select>

          <select
            value={filterTaskType}
            onChange={(e) => setFilterTaskType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">모든 업무 타입</option>
            <option value="parent">📋 상위업무</option>
            <option value="sub">📎 하위업무</option>
            <option value="none">📄 일반업무</option>
          </select>

          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
          >
            필터 초기화
          </button>
        </div>

        <div className="text-sm text-gray-600">
          총 {tasks.length}개 업무 중 {getFilteredTasks().length}개 표시
        </div>
      </div>

      {/* 캘린더 헤더 */}
      <div className="flex items-center gap-4 mb-4">
        <button onClick={handlePrevMonth} className="text-2xl px-2 hover:bg-gray-100 rounded">
          &#8592;
        </button>
        <span className="text-xl font-bold w-20 text-center">
          {getMonthLabel(currentDate)}
        </span>
        <button onClick={handleNextMonth} className="text-2xl px-2 hover:bg-gray-100 rounded">
          &#8594;
        </button>
        
        {/* 범례 */}
        <div className="ml-auto flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>높은 우선순위</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span>보통 우선순위</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>낮은 우선순위</span>
          </div>
        </div>
      </div>

      {/* 캘린더 */}
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView={calendarView}
        headerToolbar={false}
        height="auto"
        events={getCalendarEvents()}
        initialDate={currentDate}
        datesSet={arg => setCurrentDate(new Date(arg.view.currentStart))}
        dateClick={info => setSelectedDate(new Date(info.dateStr))}
        eventClick={info => {
          const taskId = info.event.extendedProps.taskId;
          if (taskId) {
            setOpenTaskId(taskId);
          }
        }}
        dayCellDidMount={info => {
          // 일요일: 0, 토요일: 6
          if (info.date.getDay() === 0) {
            info.el.style.backgroundColor = '#ffeaea'; // 연한 빨간색
          } else if (info.date.getDay() === 6) {
            info.el.style.backgroundColor = '#eaf1ff'; // 연한 파란색
          }
        }}
        eventDidMount={info => {
          // 툴팁 추가
          info.el.title = `${info.event.title}\n우선순위: ${info.event.extendedProps.priority}\n상태: ${statusConfig[info.event.extendedProps.status]?.label}`;
        }}
      />
      
      {/* 선택된 날짜의 업무 목록 */}
      {selectedDate && (
        <div className="mt-6 p-4 bg-gray-50 rounded shadow">
          <div className="font-bold mb-2 flex items-center justify-between">
            <span>{selectedDate.toLocaleDateString('ko-KR')}</span>
            <button 
              onClick={() => setSelectedDate(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          {getTasksForDate(selectedDate).length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {getTasksForDate(selectedDate).map((task) => (
                <div 
                  key={task.task_id} 
                  className="p-3 rounded border bg-white cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setOpenTaskId(task.task_id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-gray-900">{task.title}</div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      task.priority === 'high' ? 'bg-red-100 text-red-800' :
                      task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {task.priority === 'high' ? '🔴 높음' :
                       task.priority === 'medium' ? '🟡 보통' :
                       '🟢 낮음'}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                    <span>{statusConfig[task.status]?.label}</span>
                    <span>•</span>
                    <span>{task.assignee_name || '알 수 없음 (탈퇴)'}</span>
                    {task.is_parent_task && (
                      <>
                        <span>•</span>
                        <span>📋 상위업무</span>
                      </>
                    )}
                    {task.parent_task_id && (
                      <>
                        <span>•</span>
                        <span>📎 하위업무</span>
                      </>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <span>📅</span>
                    <span>{task.start_date?.slice(0, 10) || 'N/A'}</span>
                    <span>→</span>
                    <span>{task.due_date?.slice(0, 10) || 'N/A'}</span>
                  </div>
                  
                  {task.tag_names && task.tag_names.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {task.tag_names.map(tagName => (
                        <span
                          key={tagName}
                          className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {tagName}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-400">이 날에는 업무가 없습니다.</div>
          )}
        </div>
      )}

      {/* Task 상세 모달 */}
      {openTaskId && (
        <Modal onClose={() => setOpenTaskId(null)}>
          <TaskDetailPage
            taskId={openTaskId}
            onClose={() => {
              setOpenTaskId(null);
              triggerTaskUpdate(); // 모달이 닫힐 때 업무 데이터 새로고침
            }}
            currentUser={currentUser}
            currentUserRole={currentUserRole}
            canModify={canModifyTask(tasks.find(t => t.task_id === openTaskId) || {})}
          />
        </Modal>
      )}
    </div>
  );
}

export default function CalendarPage({ inner }) {
  const { organizations, selectedOrgIndex, selectedProjectIndex } = useContext(OrgProjectContext);
  const org = organizations[selectedOrgIndex];
  const project = org ? org.projects[selectedProjectIndex] : null;

  if (inner) {
    return <CalendarContent />;
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
            <span className="py-2 px-1 border-b-2 border-yellow-400 font-bold text-gray-900 cursor-pointer">calendar</span>
            <span className="py-2 px-1 text-gray-500 cursor-pointer">tasks</span>
            <span className="py-2 px-1 text-gray-500 cursor-pointer">log</span>
          </nav>
        </div>
        <CalendarContent />
      </main>
    </div>
  );
}