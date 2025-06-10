import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';

export default function TaskDetailPage({
  inner,                // 모달 여부
  taskId: propTaskId,   // 모달에서 전달된 taskId
  onClose,              // 모달 닫기 콜백
}) {
  const params = useParams();
  const navigate = useNavigate();

  // URL 파라미터 vs. prop
  const taskId = propTaskId || params.taskId;

  const [task, setTask] = useState(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 상세 조회
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      alert('로그인 후 이용해주세요.');
      navigate('/login');
      return;
    }

    axios
      .get(`http://localhost:8005/api/v1/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setTask(res.data);
        setDescription(res.data.description || '');
        setLoading(false);
      })
      .catch((err) => {
        console.error('Task 상세 조회 실패:', err);
        setError(err.response?.data?.detail || '불러오는 중 오류가 발생했습니다.');
        setLoading(false);
      });
  }, [taskId, navigate]);

  const handleDescriptionChange = (e) => setDescription(e.target.value);

  const handleSave = async () => {
    if (!task) return;
    const token = localStorage.getItem('access_token');
    if (!token) {
      alert('로그인 후 이용해주세요.');
      navigate('/login');
      return;
    }
    try {
      await axios.patch(
        `http://localhost:8005/api/v1/tasks/${taskId}`,
        { description },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('설명이 저장되었습니다.');
      setLoading(true);
      const res = await axios.get(
        `http://localhost:8005/api/v1/tasks/${taskId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTask(res.data);
      setDescription(res.data.description || '');
      setLoading(false);
    } catch (err) {
      console.error('저장 실패:', err);
      alert(err.response?.data?.detail || '저장 중 오류가 발생했습니다.');
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
          <h1 className="text-4xl font-extrabold mb-4 text-gray-800">{task.title}</h1>
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
              className="w-full h-60 border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-indigo-400 resize-none bg-gray-50"
              value={description}
              onChange={handleDescriptionChange}
              placeholder="업무에 대한 상세 설명을 입력하세요."
            />
          </div>
          <div className="mt-4 text-right">
            <button
              onClick={handleSave}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg shadow-md transition"
            >
              설명 저장
            </button>
          </div>
        </div>

        {/* 우측: 상세 정보 패널 */}
        <div className="w-1/3">
          <div className="bg-white rounded-lg shadow-lg p-6 space-y-6 border-l-4 border-indigo-300">
            <h2 className="text-xl font-bold mb-2">상세 정보</h2>
            {/* 담당자, 상위 업무, 시작일, 마감일, 생성일, 수정일 */}
            {[
              ['담당자', task.assignee_name || '없음'],
              ['상위 업무 ID', task.parent_task_id || '없음'],
              ['시작일', task.start_date.slice(0, 10)],
              ['마감일', task.due_date.slice(0, 10)],
              ['생성일', task.created_at?.slice(0, 10) || 'N/A'],
              ['수정일', task.updated_at?.slice(0, 10) || 'N/A'],
            ].map(([label, value]) => (
                <div key={label} className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">{label}</span>
                    <span className="text-sm text-gray-800">{value}</span>
                </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 
