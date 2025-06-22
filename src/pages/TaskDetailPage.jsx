import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { OrgProjectContext } from '../context/OrgProjectContext';
import { taskAPI, projectAPI, tagAPI, commentAPI, authAPI } from '../api/api';

export default function TaskDetailPage({
  inner,                // 모달 여부
  taskId: propTaskId,   // 모달에서 전달된 taskId
  onClose,              // 모달 닫기 콜백
}) {
  const params = useParams();
  const navigate = useNavigate();
  const { triggerTaskUpdate } = useContext(OrgProjectContext);

  // URL 파라미터 vs. prop
  const taskId = propTaskId || params.taskId;

  const [task, setTask] = useState(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  
  // 편집 모드 상태
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    assignee_id: '',
    status: '',
    member_ids: [],
    start_date: '',
    due_date: '',
    parent_task_id: '',
    is_parent_task: false,
    tag_names: []
  });
  const [projectMembers, setProjectMembers] = useState([]);
  const [projectTasks, setProjectTasks] = useState([]);
  const [projectTags, setProjectTags] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState(null);

  // 상세 조회
  useEffect(() => {
    const fetchTaskDetails = async () => {
      try {
        const res = await taskAPI.detail(taskId);
        const taskData = res.data;
        
        setTask(taskData);
        setDescription(taskData.description || '');
        setEditForm({
          title: taskData.title || '',
          assignee_id: taskData.assignee_id || '',
          status: taskData.status || '',
          member_ids: taskData.member_ids || [],
          start_date: taskData.start_date ? taskData.start_date.slice(0, 10) : '',
          due_date: taskData.due_date ? taskData.due_date.slice(0, 10) : '',
          parent_task_id: taskData.parent_task_id || '',
          is_parent_task: taskData.is_parent_task || false,
          tag_names: taskData.tag_names || []
        });

        // 연관 데이터 병렬로 가져오기
        await Promise.all([
            fetchProjectMembers(taskData.project_id),
            fetchProjectTasks(taskData.project_id),
            fetchProjectTags(taskData.project_id),
            fetchCurrentUser()
        ]);

      } catch (err) {
        console.error('Task 상세 조회 실패:', err);
        setError(err.response?.data?.detail || '업무 정보를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTaskDetails();
  }, [taskId]);

  // 프로젝트 멤버 목록 가져오기
  const fetchProjectMembers = async (projectId) => {
    try {
      const res = await projectAPI.getMembers(projectId);
      setProjectMembers(res.data.members || []);
      
      if (currentUser) {
        const currentMember = res.data.members.find(member => member.user_id === currentUser.user_id);
        if (currentMember) {
          setCurrentUserRole(currentMember.role);
        }
      }
    } catch (err) {
      console.error('프로젝트 멤버 조회 실패:', err);
    }
  };

  // 프로젝트 업무 목록 가져오기 (상위업무만)
  const fetchProjectTasks = async (projectId) => {
    try {
      const res = await taskAPI.getParentTasks(projectId);
      setProjectTasks(res.data || []);
    } catch (err) {
      console.error('상위업무 목록 조회 실패:', err);
    }
  };

  // 프로젝트 태그 목록 가져오기
  const fetchProjectTags = async (projectId) => {
    try {
      const res = await tagAPI.list(projectId);
      setProjectTags(res.data || []);
    } catch (err) {
      console.error('프로젝트 태그 목록 조회 실패:', err);
    }
  };

  // 현재 사용자 정보 가져오기
  const fetchCurrentUser = async () => {
    try {
      const res = await authAPI.me();
      setCurrentUser(res.data);
    } catch (apiErr) {
      console.error('현재 사용자 정보 조회 실패:', apiErr);
    }
  };

  // 댓글 목록 불러오기
  const fetchComments = async () => {
    try {
      const res = await commentAPI.listByTask(taskId);
      setComments(res.data);
    } catch (err) {
      console.error('댓글 불러오기 실패:', err);
    }
  };

  useEffect(() => {
    if (taskId) fetchComments();
  }, [taskId]);

  // 현재 사용자 역할 업데이트
  useEffect(() => {
    if (currentUser && projectMembers.length > 0) {
      const currentMember = projectMembers.find(member => member.user_id === currentUser.user_id);
      if (currentMember) {
        setCurrentUserRole(currentMember.role);
      }
    }
  }, [currentUser, projectMembers]);

  // 댓글 등록
  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      await commentAPI.create({
        task_id: taskId,
        content: newComment,
      });
      setNewComment('');
      fetchComments();
    } catch (err) {
      alert('댓글 등록에 실패했습니다.');
    }
  };

  const handleDescriptionChange = (e) => setDescription(e.target.value);

  // 편집 모드 시작
  const handleEditStart = () => {
    setIsEditing(true);
    setEditForm({
      title: task.title || '',
      assignee_id: task.assignee_id || '',
      status: task.status || '',
      member_ids: task.member_ids || [],
      start_date: task.start_date ? task.start_date.slice(0, 10) : '',
      due_date: task.due_date ? task.due_date.slice(0, 10) : '',
      parent_task_id: task.parent_task_id || '',
      is_parent_task: task.is_parent_task || false,
      tag_names: task.tag_names || []
    });
  };

  // 편집 모드 취소
  const handleEditCancel = () => {
    setIsEditing(false);
    setEditForm({
      title: task.title || '',
      assignee_id: task.assignee_id || '',
      status: task.status || '',
      member_ids: task.member_ids || [],
      start_date: task.start_date ? task.start_date.slice(0, 10) : '',
      due_date: task.due_date ? task.due_date.slice(0, 10) : '',
      parent_task_id: task.parent_task_id || '',
      is_parent_task: task.is_parent_task || false,
      tag_names: task.tag_names || []
    });
  };

  // 편집 내용 저장
  const handleEditSave = async () => {
    if (!task) return;
    try {
      const res = await taskAPI.update(taskId, editForm);
      setTask(res.data);
      setIsEditing(false);
      triggerTaskUpdate();
    } catch (err) {
      console.error('업무 수정 실패:', err);
      alert(err.response?.data?.detail || '업무 수정에 실패했습니다.');
    }
  };

  const handleSave = async () => {
    if (!task) return;
    try {
      const res = await taskAPI.updateDescription(taskId, { description });
      setTask(res.data);
      setDescription(res.data.description || '');
      triggerTaskUpdate();
    } catch (err) {
      console.error('업무 설명 저장 실패:', err);
      alert(err.response?.data?.detail || '업무 설명 저장에 실패했습니다.');
    }
  };

  // 댓글 수정 시작
  const handleEditComment = (comment) => {
    setEditingCommentId(comment.comment_id);
    setEditingContent(comment.content);
  };
  // 댓글 수정 취소
  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingContent('');
  };
  // 댓글 수정 저장
  const handleSaveEdit = async (comment_id) => {
    try {
      await commentAPI.update(comment_id, editingContent);
      setEditingCommentId(null);
      setEditingContent('');
      fetchComments();
    } catch (err) {
      console.error('댓글 수정 실패:', err);
      alert('댓글 수정에 실패했습니다.');
    }
  };
  // 댓글 삭제
  const handleDeleteComment = async (comment_id) => {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) return;
    try {
      await commentAPI.delete(comment_id);
      fetchComments();
    } catch (err) {
      console.error('댓글 삭제 실패:', err);
      alert('댓글 삭제에 실패했습니다.');
    }
  };

  // 로딩 / 오류 / 빈 데이터 처리
  if (loading) return <div className="p-4 text-center">로딩 중…</div>;
  if (error) {
    return (
      <div className="p-4 text-red-600">
        <p>오류 발생: {error}</p>
        {inner && onClose ? (
          <button onClick={onClose} className="mt-4 btn-gray">닫기</button>
        ) : (
          <button onClick={() => navigate(-1)} className="mt-4 btn-gray">뒤로 가기</button>
        )}
      </div>
    );
  }
  if (!task) {
    return (
      <div className="p-4">
        <p>조회된 Task가 없습니다.</p>
        {inner && onClose ? (
          <button onClick={onClose} className="mt-4 btn-gray">닫기</button>
        ) : (
          <button onClick={() => navigate(-1)} className="mt-4 btn-gray">뒤로 가기</button>
        )}
      </div>
    );
  }

  return (
    <div className={`p-6 max-w-6xl mx-auto ${inner ? '' : 'h-screen flex flex-col'}`}>
      {/* 상단: 모달이면 닫기, 아니면 Breadcrumb */}
      {/* <div className="mb-6">
        {inner && onClose ? (
          <button onClick={onClose} className="text-gray-600 hover:text-gray-800">
            ← 닫기
          </button>
        ) : (
          <Link to="/main" className="flex items-center text-gray-600 hover:text-gray-800">
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span>All Tasks</span>
          </Link>
        )}
      </div> */}

      {/* 본문 + 사이드바 */}
      <div className="flex space-x-8">
        {/* 좌측: 제목 + 설명 */}
        <div className="w-2/3 bg-gradient-to-br from-indigo-50 to-white rounded-lg shadow-lg p-6 border-t-4 border-indigo-500">
          {isEditing ? (
            <input
              type="text"
              value={editForm.title}
              onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
              className="text-4xl font-extrabold mb-4 text-gray-800 bg-transparent border-b-2 border-indigo-500 focus:outline-none w-full"
              placeholder="업무명을 입력하세요"
            />
          ) : (
            <h1 className="text-4xl font-extrabold mb-4 text-gray-800">{task.title}</h1>
          )}
          <div className="flex flex-wrap items-center space-x-3 mb-6">
            {/* Status Badge */}
            <span
              className={`px-3 py-1 rounded-full text-sm font-semibold ${
                task.status === 'todo'
                  ? 'bg-yellow-200 text-yellow-900'
                : task.status === 'in_progress'
                  ? 'bg-blue-200 text-blue-900'
                : 'bg-green-200 text-green-900'
              }`}
            >
              {task.status.toUpperCase()}
            </span>
            {/* Priority Badge */}
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                task.priority === 'high'
                  ? 'bg-red-200 text-red-800'
                : task.priority === 'medium'
                  ? 'bg-orange-200 text-orange-800'
                : 'bg-gray-200 text-gray-800'
              }`}
            >
              {task.priority}
            </span>
          </div>

          <div className="bg-white p-4 rounded-md shadow-inner mb-4">
            <label htmlFor="description" className="block text-lg font-semibold mb-2">
              설명
            </label>
            <textarea
              id="description"
              className={`w-full h-60 border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-indigo-400 resize-none ${currentUserRole === 'viewer' ? 'bg-gray-100' : 'bg-gray-50'}`}
              value={description}
              onChange={handleDescriptionChange}
              placeholder={currentUserRole === 'viewer' ? '뷰어는 설명을 편집할 수 없습니다.' : '업무에 대한 상세 설명을 입력하세요.'}
              readOnly={currentUserRole === 'viewer'}
            />
          </div>
          {currentUserRole !== 'viewer' && (
            <div className="mt-4 text-right">
              <button
                onClick={handleSave}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg shadow-md transition"
              >
                설명 저장
              </button>
            </div>
          )}
          {/* 댓글 작성 및 목록 */}
          <div className="mt-8">
            <h3 className="text-lg font-bold mb-2">댓글</h3>
            {currentUserRole !== 'viewer' ? (
              <div className="flex items-center mb-2">
                <textarea
                  className="flex-1 border border-gray-300 rounded-md p-2 mr-2"
                  rows={2}
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="댓글을 입력하세요."
                />
                <button
                  onClick={handleAddComment}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
                >
                  댓글 등록
                </button>
              </div>
            ) : (
              <div className="mb-2 p-3 bg-gray-50 rounded-md border">
                <p className="text-sm text-gray-600 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  뷰어는 댓글을 작성할 수 없습니다.
                </p>
              </div>
            )}
            <ul className="space-y-2 mt-4">
              {comments.length === 0 ? (
                <li className="text-gray-400">아직 댓글이 없습니다.</li>
              ) : (
                comments.map(c => (
                  <li key={c.comment_id} className="bg-gray-100 rounded-md p-2">
                    {editingCommentId === c.comment_id ? (
                      <div>
                        <textarea
                          className="w-full border border-gray-300 rounded-md p-2 mb-2"
                          rows={2}
                          value={editingContent}
                          onChange={e => setEditingContent(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveEdit(c.comment_id)}
                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md"
                          >
                            저장
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="bg-gray-400 hover:bg-gray-500 text-white px-3 py-1 rounded-md"
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-sm font-medium text-gray-700">{c.user_name || '알 수 없는 사용자'}</span>
                            <span className="text-xs text-gray-500">{new Date(c.updated_at).toLocaleString()} {c.is_updated ? '(수정됨)' : ''}</span>
                          </div>
                          <div className="text-sm text-gray-800">{c.content}</div>
                        </div>
                        {currentUser && c.user_id === currentUser.user_id && currentUserRole !== 'viewer' && (
                          <div className="flex gap-2 ml-2">
                            <button
                              onClick={() => handleEditComment(c)}
                              className="text-blue-500 hover:underline text-xs"
                            >수정</button>
                            <button
                              onClick={() => handleDeleteComment(c.comment_id)}
                              className="text-red-500 hover:underline text-xs"
                            >삭제</button>
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

        {/* 우측: 상세 정보 패널 */}
        <div className="w-1/3">
          <div className="bg-white rounded-lg shadow-lg p-6 space-y-6 border-l-4 border-indigo-300">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">상세 정보</h2>
              {!isEditing ? (
                currentUser && task && currentUser.user_id === task.assignee_id && currentUserRole !== 'viewer' ? (
                  <button
                    onClick={handleEditStart}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-sm"
                  >
                    편집
                  </button>
                ) : (
                  <span className="text-gray-500 text-sm">
                    {currentUserRole === 'viewer' ? '뷰어는 편집할 수 없습니다' : '담당자만 편집 가능'}
                  </span>
                )
              ) : (
                <div className="space-x-2">
                  <button
                    onClick={handleEditSave}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                  >
                    저장
                  </button>
                  <button
                    onClick={handleEditCancel}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
                  >
                    취소
                  </button>
                </div>
              )}
            </div>
            
            {isEditing ? (
              /* 편집 모드 */
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">담당자</label>
                  <select
                    value={editForm.assignee_id}
                    onChange={(e) => setEditForm(prev => ({ ...prev, assignee_id: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-indigo-400"
                  >
                    <option value="">담당자 선택</option>
                    {projectMembers.map(member => (
                      <option key={member.user_id} value={member.user_id}>
                        {member.name} ({member.email})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">상태</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-indigo-400"
                  >
                    <option value="todo">할 일</option>
                    <option value="In progress">진행 중</option>
                    <option value="complete">완료</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">시작일</label>
                  <input
                    type="date"
                    value={editForm.start_date}
                    onChange={(e) => setEditForm(prev => ({ ...prev, start_date: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">마감일</label>
                  <input
                    type="date"
                    value={editForm.due_date}
                    onChange={(e) => setEditForm(prev => ({ ...prev, due_date: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">상위업무 설정</label>
                  <label className="flex items-center mb-3">
                    <input
                      type="checkbox"
                      checked={editForm.is_parent_task}
                      onChange={(e) => setEditForm(prev => ({ 
                        ...prev, 
                        is_parent_task: e.target.checked,
                        parent_task_id: e.target.checked ? '' : prev.parent_task_id // 상위업무로 설정하면 상위업무 선택 초기화
                      }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">이 업무를 상위업무로 설정</span>
                  </label>
                </div>
                
                {!editForm.is_parent_task && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">상위 업무</label>
                    <select
                      value={editForm.parent_task_id}
                      onChange={(e) => setEditForm(prev => ({ ...prev, parent_task_id: e.target.value }))}
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-indigo-400"
                    >
                      <option value="">상위 업무 없음</option>
                      {projectTasks
                        .filter(t => t.task_id !== task.task_id) // 자기 자신 제외
                        .map(t => (
                          <option key={t.task_id} value={t.task_id}>
                            {t.title}
                          </option>
                        ))}
                    </select>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">업무 멤버</label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {projectMembers.map(member => (
                      <label key={member.user_id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={editForm.member_ids.includes(member.user_id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditForm(prev => ({
                                ...prev,
                                member_ids: [...prev.member_ids, member.user_id]
                              }));
                            } else {
                              setEditForm(prev => ({
                                ...prev,
                                member_ids: prev.member_ids.filter(id => id !== member.user_id)
                              }));
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm">{member.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">태그</label>
                  {projectTags.length === 0 ? (
                    <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded">
                      아직 태그가 없습니다.
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {projectTags.map(tag => (
                        <button
                          key={tag.tag_name}
                          type="button"
                          onClick={() => {
                            if (editForm.tag_names.includes(tag.tag_name)) {
                              setEditForm(prev => ({
                                ...prev,
                                tag_names: prev.tag_names.filter(name => name !== tag.tag_name)
                              }));
                            } else {
                              setEditForm(prev => ({
                                ...prev,
                                tag_names: [...prev.tag_names, tag.tag_name]
                              }));
                            }
                          }}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            editForm.tag_names.includes(tag.tag_name)
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {tag.tag_name}
                        </button>
                      ))}
                    </div>
                  )}
                  {editForm.tag_names.length > 0 && (
                    <div className="mt-2 text-xs text-gray-600">
                      선택된 태그: {editForm.tag_names.join(', ')}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* 보기 모드 */
              <div className="space-y-4">
                {[
                  ['담당자', task.assignee_name || '없음'],
                  ['상태', task.status || '없음'],
                  ['업무 유형', task.is_parent_task ? '📋 상위업무' : '📝 일반업무'],
                  ['상위 업무', task.parent_task_id ? 
                    (task.parent_task_title ? `${task.parent_task_title}(${task.parent_task_id})` : `업무 ID: ${task.parent_task_id}`) 
                    : '없음'],
                  ['시작일', task.start_date?.slice(0, 10) || 'N/A'],
                  ['마감일', task.due_date?.slice(0, 10) || 'N/A'],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">{label}</span>
                    <span className="text-sm text-gray-800">{value}</span>
                  </div>
                ))}
                
                {/* 생성/수정일 표시 */}
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">생성/수정일</span>
                  <span className="text-sm text-gray-800">
                    {task.updated_at?.slice(0, 10) || 'N/A'}
                  </span>
                </div>
                
                {task.member_ids && task.member_ids.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">업무 멤버</span>
                    <div className="mt-1 space-y-1">
                      {task.member_ids.map(memberId => {
                        const member = projectMembers.find(m => m.user_id === memberId);
                        return member ? (
                          <div key={memberId} className="text-sm text-gray-800">
                            {member.name}
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
                
                <div>
                  <span className="text-sm font-medium text-gray-600">태그</span>
                  <div className="mt-1">
                    {task.tag_names && task.tag_names.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {task.tag_names.map(tagName => (
                          <span
                            key={tagName}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {tagName}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">태그 없음</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 
