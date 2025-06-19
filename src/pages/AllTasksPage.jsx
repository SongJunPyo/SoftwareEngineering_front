import React, { useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { OrgProjectContext } from '../context/OrgProjectContext';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import TaskDetailPage from './TaskDetailPage';
import Modal from '../components/Task_Modal';

function AllTasksPage() {
  // 1) Context 훅 (항상 최상단)
  const { organizations, selectedOrgIndex, selectedProjectIndex, taskUpdateTrigger } =
    useContext(OrgProjectContext);
  const navigate = useNavigate();

  // 2) State 훅들 (항상 같은 순서로 호출)
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [parentTasks, setParentTasks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [openTaskId, setOpenTaskId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [form, setForm] = useState({
    title: '',
    startDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date().toISOString().slice(0, 10),
    assignee: '',
    parentTask: '',
    priority: 'medium',
    isParentTask: false,
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
    axios
      .get(`http://localhost:8005/api/v1/tasks?project_id=${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setTasks(res.data);
      })
      .catch((err) => {
        console.error('작업 목록 로드 실패:', err);
        if (err.response?.status === 401) {
          localStorage.removeItem('access_token');
          navigate('/login');
        }
      });

    // 7-2) 프로젝트 멤버 목록 호출 (뷰어 제외)
    axios
      .get(`http://localhost:8005/api/v1/project_members?project_id=${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setMembers(res.data);
      })
      .catch((err) => {
        console.error('프로젝트 멤버 목록 로드 실패:', err);
        if (err.response?.status === 401) {
          localStorage.removeItem('access_token');
          navigate('/login');
        }
      });

    // 7-3) 상위업무 목록 호출
    axios
      .get(`http://localhost:8005/api/v1/parent-tasks?project_id=${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setParentTasks(res.data);
      })
      .catch((err) => {
        console.error('상위업무 목록 로드 실패:', err);
        if (err.response?.status === 401) {
          localStorage.removeItem('access_token');
          navigate('/login');
        }
      });
  }, [projectId, navigate, currentProject, taskUpdateTrigger]);

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
      project_id: currentProject.projectId,
      is_parent_task: form.isParentTask,
    };

    // 간단 유효성 검사
    if (!payload.title || !payload.start_date || !payload.due_date) {
      alert('업무명, 시작일, 마감일은 필수 입력 항목입니다.');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      console.log('🚀 Task 생성 API 호출:', payload);
      
      const res = await axios.post(
        'http://localhost:8005/api/v1/tasks',
        payload,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

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
        isParentTask: false,
      });
    } catch (err) {
      console.error('업무 생성 실패:', err);
      alert(err.response?.data?.detail || '업무 생성 중 오류가 발생했습니다.');
      if (err.response?.status === 401) {
        localStorage.removeItem('access_token');
        navigate('/login');
      }
    }
  };

  // 10) Task 삭제 함수
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('정말로 이 업무를 삭제하시겠습니까?')) return;

    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(`http://localhost:8005/api/v1/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // WebSocket 이벤트가 오지 않을 경우를 대비해 즉시 로컬 상태 업데이트
      setTasks(prev => {
        const filtered = prev.filter(task => task.task_id !== taskId);
        console.log('🔄 API 응답으로 Task 즉시 삭제:', taskId);
        return filtered;
      });
      
    } catch (err) {
      console.error('업무 삭제 실패:', err);
      alert(err.response?.data?.detail || '업무 삭제 중 오류가 발생했습니다.');
    }
  };

  // 11) 권한 체크 함수
  const canModifyTask = (task) => {
    return currentUser && task.assignee_id === currentUser.user_id;
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
          <button
            onClick={handleOpenModal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2 shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>업무 추가</span>
          </button>
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
                <p className="text-sm text-gray-600">전체 업무</p>
                <p className="text-2xl font-semibold text-gray-900">{tasks.length}</p>
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
                <p className="text-2xl font-semibold text-gray-900">{tasks.filter(t => t.status === 'In progress').length}</p>
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
                <p className="text-2xl font-semibold text-gray-900">{tasks.filter(t => t.status === 'complete').length}</p>
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
                <p className="text-2xl font-semibold text-gray-900">{tasks.filter(t => t.priority === 'high').length}</p>
              </div>
            </div>
          </div>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">시작일</label>
                  <input
                    type="date"
                    name="startDate"
                    value={form.startDate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  />
                </div>

                {/* 마감일 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">마감일</label>
                  <input
                    type="date"
                    name="dueDate"
                    value={form.dueDate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* 담당자 선택 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">담당자</label>
                  <select
                    name="assignee"
                    value={form.assignee}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  >
                    <option value="">미지정</option>
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
                  기간
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  액션
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="text-gray-400">
                      <svg className="mx-auto h-12 w-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <p className="text-sm font-medium text-gray-500">아직 업무가 없습니다</p>
                      <p className="text-sm text-gray-400">첫 번째 업무를 추가해보세요!</p>
                    </div>
                  </td>
                </tr>
              ) : (
                tasks.map((task) => (
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
                          <div className="flex items-center space-x-2">
                            <div className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                              {task.title}
                            </div>
                            {task.is_parent_task && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                📋 상위업무
                              </span>
                            )}
                          </div>
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
                          <span className="text-sm text-gray-400">미지정</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        task.status === 'complete' ? 'bg-green-100 text-green-800' :
                        task.status === 'In progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {task.status === 'complete' ? '✅ 완료' :
                         task.status === 'In progress' ? '🔄 진행중' :
                         '📋 대기'}
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
    </div>
  );
}

export default AllTasksPage;