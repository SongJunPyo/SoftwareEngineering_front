import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { OrgProjectContext } from '../context/OrgProjectContext';
import { taskAPI, projectAPI, authAPI, commentAPI, tagAPI } from '../api/api';
import { useTaskRealtime, useCommentRealtime } from '../websocket/useWebSocket';

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
  
  // 멘션 기능 상태
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionSuggestions, setMentionSuggestions] = useState([]);
  const [cursorPosition, setCursorPosition] = useState(0);
  
  // 편집 모드 상태
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    assignee_id: '',
    status: '',
    priority: '',
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
    const token = localStorage.getItem('access_token');
    if (!token) {
      alert('로그인 후 이용해주세요.');
      navigate('/login');
      return;
    }

    taskAPI
      .detail(taskId)
      .then((res) => {
        setTask(res.data);
        setDescription(res.data.description || '');
        // 편집 폼 초기화
        setEditForm({
          title: res.data.title || '',
          assignee_id: res.data.assignee_id || '',
          status: res.data.status || '',
          priority: res.data.priority || '',
          member_ids: res.data.member_ids || [],
          start_date: res.data.start_date ? res.data.start_date.slice(0, 10) : '',
          due_date: res.data.due_date ? res.data.due_date.slice(0, 10) : '',
          parent_task_id: res.data.parent_task_id || '',
          is_parent_task: res.data.is_parent_task || false,
          tag_names: res.data.tag_names || []
        });
        setLoading(false);
        // 프로젝트 멤버 목록 가져오기
        fetchProjectMembers(res.data.project_id);
        // 프로젝트 업무 목록 가져오기 (상위 업무 선택용)
        fetchProjectTasks(res.data.project_id);
        // 프로젝트 태그 목록 가져오기
        fetchProjectTags(res.data.project_id);
        // 현재 사용자 정보 가져오기
        fetchCurrentUser();
      })
      .catch((err) => {
        console.error('Task 상세 조회 실패:', err);
        setError(err.response?.data?.detail || '업무 정보를 불러오는 중 오류가 발생했습니다.');
        setLoading(false);
      });
  }, [taskId, navigate]);

  // 프로젝트 멤버 목록 가져오기
  const fetchProjectMembers = async (projectId) => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    
    try {
      const res = await projectAPI.getMembers(projectId);
      const members = res.data.members || [];
      setProjectMembers(members);
      console.log('👥 프로젝트 멤버 로드됨:', members);
      
      // 현재 사용자의 역할 찾기
      if (currentUser) {
        const currentMember = members.find(member => member.user_id === currentUser.user_id);
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
    const token = localStorage.getItem('access_token');
    if (!token) return;
    
    try {
      const res = await taskAPI.getParentTasks(projectId);
      setProjectTasks(res.data || []);
    } catch (err) {
      console.error('상위업무 목록 조회 실패:', err);
    }
  };

  // 프로젝트 태그 목록 가져오기
  const fetchProjectTags = async (projectId) => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    
    try {
      const res = await tagAPI.list(projectId);
      setProjectTags(res.data || []);
    } catch (err) {
      console.error('프로젝트 태그 목록 조회 실패:', err);
    }
  };

  // 현재 사용자 정보 가져오기
  const fetchCurrentUser = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    
    try {
      // API를 통해 완전한 사용자 정보 가져오기
      const res = await authAPI.me();
      setCurrentUser(res.data);
    } catch (err) {
      console.error('현재 사용자 정보 조회 실패:', err);
      try {
        // 폴백: JWT 토큰에서 user_id만 추출
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUser({ user_id: parseInt(payload.sub) });
      } catch (tokenErr) {
        console.error('토큰에서 사용자 정보 추출 실패:', tokenErr);
      }
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

  // 실시간 Task 업데이트 처리
  useTaskRealtime(task?.project_id, (update) => {
    if (update.task.task_id === parseInt(taskId)) {
      switch (update.type) {
        case 'updated':
          setTask(prevTask => ({
            ...prevTask,
            ...update.task,
            // 날짜 필드 처리
            start_date: update.task.start_date ? update.task.start_date.slice(0, 10) : prevTask.start_date,
            due_date: update.task.due_date ? update.task.due_date.slice(0, 10) : prevTask.due_date
          }));
          setDescription(update.task.description || '');
          break;
        case 'status_changed':
          setTask(prevTask => ({
            ...prevTask,
            status: update.task.new_status || update.task.status
          }));
          break;
        case 'deleted':
          // Task가 삭제된 경우 페이지 이동
          if (inner && onClose) {
            onClose();
          } else {
            navigate('/main');
          }
          break;
      }
    }
  });

  // 실시간 Comment 업데이트 처리
  useCommentRealtime(task?.project_id, (update) => {
    if (update.comment.task_id === parseInt(taskId)) {
      switch (update.type) {
        case 'created':
          setComments(prevComments => [...prevComments, {
            ...update.comment,
            user_name: update.comment.author_name
          }]);
          break;
        case 'updated':
          setComments(prevComments => 
            prevComments.map(comment =>
              comment.comment_id === update.comment.comment_id
                ? { ...comment, content: update.comment.content, is_updated: 1 }
                : comment
            )
          );
          break;
        case 'deleted':
          setComments(prevComments => 
            prevComments.filter(comment => comment.comment_id !== update.comment.comment_id)
          );
          break;
      }
    }
  });

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
    const token = localStorage.getItem('access_token');
    if (!token) {
      alert('로그인 후 이용해주세요.');
      navigate('/login');
      return;
    }
    try {
      await commentAPI.create({
        task_id: parseInt(taskId),
        content: newComment,
      });
      setNewComment('');
      // fetchComments() 제거 - 실시간 업데이트로 처리됨
    } catch (err) {
      console.error('댓글 등록 실패:', err);
      alert('댓글 등록에 실패했습니다.');
    }
  };

  const handleDescriptionChange = (e) => setDescription(e.target.value);

  // 멘션 처리 함수
  const handleCommentChange = (e) => {
    const value = e.target.value;
    console.log('🔥 댓글 변경 감지됨:', value);
    
    setNewComment(value);
    
    // @ 기호로 멘션 감지 (단순화)
    if (value.includes('@')) {
      console.log('@ 기호 감지됨!');
      console.log('프로젝트 멤버 수:', projectMembers.length);
      console.log('현재 사용자:', currentUser);
      
      // 현재 커서 위치 기반 멘션 감지
      const cursorPos = e.target.selectionStart;
      const beforeCursor = value.substring(0, cursorPos);
      const lastAtIndex = beforeCursor.lastIndexOf('@');
      
      if (lastAtIndex !== -1) {
        const query = beforeCursor.substring(lastAtIndex + 1).toLowerCase();
        console.log('멘션 쿼리:', query);
        
        const filtered = projectMembers.filter(member => 
          member.name && member.name.toLowerCase().includes(query)
        );
        console.log('필터링된 멤버:', filtered);
        
        setMentionSuggestions(filtered);
        setShowMentionSuggestions(filtered.length > 0);
      }
    } else {
      setShowMentionSuggestions(false);
      setMentionSuggestions([]);
    }
  };

  // 멘션 선택 처리
  const handleMentionSelect = (member) => {
    console.log('🎯 멘션 선택됨:', member);
    
    // 마지막 @ 위치 찾기
    const lastAtIndex = newComment.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const before = newComment.substring(0, lastAtIndex);
      const after = newComment.substring(lastAtIndex).replace(/@\w*/, `@${member.name} `);
      const newValue = before + after;
      setNewComment(newValue);
    }
    
    setShowMentionSuggestions(false);
    setMentionSuggestions([]);
  };

  // 댓글 내용에서 멘션 하이라이트
  const renderCommentContent = (content) => {
    const mentionRegex = /@(\w+)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      // 멘션 이전 텍스트
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index));
      }
      
      // 멘션 텍스트 (하이라이트)
      parts.push(
        <span key={match.index} className="bg-blue-100 text-blue-800 px-1 rounded font-medium">
          {match[0]}
        </span>
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    // 나머지 텍스트
    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }
    
    return parts;
  };

  // 댓글 수정 시작
  const handleEditComment = (comment) => {
    setEditingCommentId(comment.comment_id);
    setEditingContent(comment.content);
  };

  // 댓글 수정 저장
  const handleSaveEdit = async (commentId) => {
    if (!editingContent.trim()) return;
    try {
      await commentAPI.update(commentId, editingContent);
      setEditingCommentId(null);
      setEditingContent('');
      // fetchComments() 제거 - 실시간 업데이트로 처리됨
    } catch (err) {
      console.error('댓글 수정 실패:', err);
      alert('댓글 수정에 실패했습니다.');
    }
  };

  // 댓글 수정 취소
  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingContent('');
  };

  // 댓글 삭제
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) return;
    try {
      await commentAPI.delete(commentId);
      // fetchComments() 제거 - 실시간 업데이트로 처리됨
    } catch (err) {
      console.error('댓글 삭제 실패:', err);
      alert('댓글 삭제에 실패했습니다.');
    }
  };

  // 편집 모드 시작
  const handleEditStart = () => {
    setIsEditing(true);
    setEditForm({
      title: task.title || '',
      assignee_id: task.assignee_id || '',
      status: task.status || '',
      priority: task.priority || '',
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
      priority: task.priority || '',
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
    const token = localStorage.getItem('access_token');
    if (!token) {
      alert('로그인 후 이용해주세요.');
      navigate('/login');
      return;
    }
    
    try {
      const updateData = {};
      
      // 변경된 필드만 포함
      if (editForm.title !== task.title) {
        updateData.title = editForm.title;
      }
      if (parseInt(editForm.assignee_id) !== task.assignee_id) {
        updateData.assignee_id = parseInt(editForm.assignee_id);
      }
      if (editForm.status !== task.status) {
        updateData.status = editForm.status;
      }
      if (editForm.priority !== task.priority) {
        updateData.priority = editForm.priority;
      }
      if (editForm.start_date && editForm.start_date !== task.start_date?.slice(0, 10)) {
        updateData.start_date = editForm.start_date + 'T00:00:00.000Z';
      }
      if (editForm.due_date && editForm.due_date !== task.due_date?.slice(0, 10)) {
        updateData.due_date = editForm.due_date + 'T00:00:00.000Z';
      }
      if (parseInt(editForm.parent_task_id) !== task.parent_task_id || (!editForm.parent_task_id && task.parent_task_id)) {
        updateData.parent_task_id = editForm.parent_task_id ? parseInt(editForm.parent_task_id) : null;
      }
      if (editForm.is_parent_task !== task.is_parent_task) {
        updateData.is_parent_task = editForm.is_parent_task;
      }
      
      // 멤버는 항상 업데이트 (배열 비교가 복잡하므로)
      updateData.member_ids = editForm.member_ids.map(id => parseInt(id));
      
      // 태그도 항상 업데이트 (배열 비교가 복잡하므로)
      updateData.tag_names = editForm.tag_names;
      
      const patchResponse = await taskAPI.update(taskId, updateData);
      
      console.log('🔄 Task 수정 완료:', patchResponse.data);
      alert('업무 정보가 저장되었습니다.');
      
      // AllTasksPage 업데이트 트리거
      triggerTaskUpdate();
      
      // 페이지 데이터 재로드
      setLoading(true);
      const res = await taskAPI.detail(taskId);
      setTask(res.data);
      setDescription(res.data.description || '');
      setEditForm({
        title: res.data.title || '',
        assignee_id: res.data.assignee_id || '',
        status: res.data.status || '',
        priority: res.data.priority || '',
        member_ids: res.data.member_ids || [],
        start_date: res.data.start_date ? res.data.start_date.slice(0, 10) : '',
        due_date: res.data.due_date ? res.data.due_date.slice(0, 10) : '',
        parent_task_id: res.data.parent_task_id || '',
        tag_names: res.data.tag_names || []
      });
      setIsEditing(false);
      setLoading(false);
    } catch (err) {
      console.error('저장 실패:', err);
      alert(err.response?.data?.detail || '업무 정보 저장 중 오류가 발생했습니다.');
    }
  };

  const handleSave = async () => {
    if (!task) return;
    const token = localStorage.getItem('access_token');
    if (!token) {
      alert('로그인 후 이용해주세요.');
      navigate('/login');
      return;
    }
    try {
      const patchResponse = await taskAPI.updateDescription(taskId, { description });
      
      console.log('🔄 TaskDetailPage에서 Task 수정 완료:', patchResponse.data);
      alert('설명이 저장되었습니다.');
      
      // AllTasksPage 업데이트 트리거
      triggerTaskUpdate();
      
      setLoading(true);
      const res = await taskAPI.detail(taskId);
      setTask(res.data);
      setDescription(res.data.description || '');
      setLoading(false);
    } catch (err) {
      console.error('저장 실패:', err);
      alert(err.response?.data?.detail || '업무 정보 저장 중 오류가 발생했습니다.');
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
              <div className="relative">
                <div className="flex items-center mb-2">
                  <div className="flex-1 relative mr-2">
                    <textarea
                      className="w-full border border-gray-300 rounded-md p-2 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={2}
                      value={newComment}
                      onChange={handleCommentChange}
                      placeholder="댓글을 입력하세요. @사용자명 으로 멘션할 수 있습니다."
                    />
                    {/* 멘션 제안 목록 */}
                    {showMentionSuggestions && mentionSuggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                        {mentionSuggestions.map((member) => (
                          <div
                            key={member.user_id}
                            className="px-3 py-2 cursor-pointer hover:bg-gray-100 flex items-center"
                            onClick={() => handleMentionSelect(member)}
                          >
                            <span className="text-sm font-medium">@{member.name}</span>
                            <span className="text-xs text-gray-500 ml-2">({member.role})</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleAddComment}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
                  >
                    댓글 등록
                  </button>
                </div>
                {/* 멘션 도움말 */}
                <div className="text-xs text-gray-500 mb-2">
                  💡 @사용자명을 입력하면 해당 사용자에게 알림이 전송됩니다.
                </div>
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
                            <span className="text-sm font-medium text-gray-700">{c.user_name || '알 수 없음 (탈퇴)'}</span>
                            <span className="text-xs text-gray-500">{new Date(c.updated_at).toLocaleString()} {c.is_updated ? '(수정됨)' : ''}</span>
                          </div>
                          <div className="text-sm text-gray-800">{renderCommentContent(c.content)}</div>
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
                currentUser && task && (
                  (currentUser.user_id === task.assignee_id) || 
                  (currentUserRole === 'owner' || currentUserRole === 'admin')
                ) && currentUserRole !== 'viewer' ? (
                  <button
                    onClick={handleEditStart}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-sm"
                  >
                    편집
                  </button>
                ) : (
                  <span className="text-gray-500 text-sm">
                    {currentUserRole === 'viewer' ? '뷰어는 편집할 수 없습니다' : '담당자이거나 소유자/관리자만 편집 가능'}
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
                    <option value="todo">📝 할 일</option>
                    <option value="in_progress">🔄 진행중</option>
                    <option value="pending">⏸️ 대기</option>
                    <option value="complete">✅ 완료</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">우선순위</label>
                  <select
                    value={editForm.priority}
                    onChange={(e) => setEditForm(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-indigo-400"
                  >
                    <option value="low">🟢 낮음</option>
                    <option value="medium">🟡 보통</option>
                    <option value="high">🔴 높음</option>
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
                  ['담당자', task.assignee_name || '알 수 없음 (탈퇴)'],
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
