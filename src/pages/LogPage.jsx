import React, { useEffect, useState, useContext } from "react";
import Sidebar from "../components/Sidebar";
import { OrgProjectContext } from "../context/OrgProjectContext";
import axios from "axios";

function LogContent() {
  const { organizations, selectedOrgIndex, selectedProjectIndex } = useContext(OrgProjectContext);
  const org = organizations[selectedOrgIndex];
  const project = org ? org.projects[selectedProjectIndex] : null;
  
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 필터 상태
  const [filters, setFilters] = useState({
    entity_type: '',
    action: '',
    user_id: '',
    start_date: '',
    end_date: '',
    search: ''
  });
  
  // 페이지네이션
  const [pagination, setPagination] = useState({
    limit: 20,
    offset: 0,
    hasMore: true
  });

  // 로그 데이터 가져오기
  const fetchLogs = async (reset = false) => {
    if (!project) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      
      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: reset ? '0' : pagination.offset.toString()
      });

      // 필터 추가
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await axios.get(`/api/v1/logs/${project.projectId}?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (reset) {
        setLogs(response.data);
        setPagination(prev => ({ ...prev, offset: response.data.length }));
      } else {
        setLogs(prev => [...prev, ...response.data]);
        setPagination(prev => ({ ...prev, offset: prev.offset + response.data.length }));
      }
      
      // 받은 데이터가 limit보다 적으면 더 이상 로드할 데이터가 없음
      setPagination(prev => ({ ...prev, hasMore: response.data.length === pagination.limit }));
      
    } catch (err) {
      console.error('로그 가져오기 실패:', err);
      setError('로그를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 통계 데이터 가져오기
  const fetchStats = async () => {
    if (!project) return;
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`/api/v1/logs/${project.projectId}/stats?days=7`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (err) {
      console.error('통계 가져오기 실패:', err);
    }
  };

  // 프로젝트가 변경되거나 필터가 변경될 때 로그 다시 가져오기
  useEffect(() => {
    if (project) {
      fetchLogs(true);
      fetchStats();
    }
  }, [project, filters]);

  // 더 많은 로그 로드
  const loadMore = () => {
    if (!loading && pagination.hasMore) {
      fetchLogs(false);
    }
  };

  // 필터 변경 핸들러
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, offset: 0 }));
  };

  // 필터 초기화
  const resetFilters = () => {
    setFilters({
      entity_type: '',
      action: '',
      user_id: '',
      start_date: '',
      end_date: '',
      search: ''
    });
  };

  // 액션과 엔티티 타입에 따른 메시지 생성
  const getActionMessage = (log) => {
    const actionMap = {
      'task': {
        'create': '업무를 생성했습니다',
        'update': '업무를 수정했습니다',
        'delete': '업무를 삭제했습니다',
        'assign': '업무를 할당했습니다',
        'status_change': '업무 상태를 변경했습니다'
      },
      'comment': {
        'create': '댓글을 남겼습니다',
        'update': '댓글을 수정했습니다',
        'delete': '댓글을 삭제했습니다'
      },
      'project': {
        'create': '프로젝트를 생성했습니다',
        'update': '프로젝트를 수정했습니다',
        'delete': '프로젝트를 삭제했습니다'
      }
    };

    return actionMap[log.entity_type]?.[log.action] || `${log.entity_type}에 ${log.action} 작업을 수행했습니다`;
  };

  // 엔티티 타입에 따른 아이콘
  const getEntityIcon = (entityType) => {
    const iconMap = {
      'task': '📝',
      'comment': '💬',
      'project': '📁',
      'tag': '🏷️',
      'file': '📎'
    };
    return iconMap[entityType] || '🧩';
  };

  if (!project) {
    return (
      <div className="p-6 text-center text-gray-500">
        프로젝트를 선택해주세요.
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">🧮 활동 로그</h2>
        <button
          onClick={resetFilters}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          필터 초기화
        </button>
      </div>

      {/* 통계 섹션 */}
      {stats && (
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold mb-2">최근 7일 활동 통계</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">총 활동: </span>
              <span className="font-semibold">{stats.total_activities}회</span>
            </div>
            {stats.action_stats.slice(0, 3).map(stat => (
              <div key={stat.action}>
                <span className="text-gray-600">{stat.action}: </span>
                <span className="font-semibold">{stat.count}회</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 필터 섹션 */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="font-semibold mb-3">필터</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <select
            value={filters.entity_type}
            onChange={(e) => handleFilterChange('entity_type', e.target.value)}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="">모든 유형</option>
            <option value="task">업무</option>
            <option value="comment">댓글</option>
            <option value="project">프로젝트</option>
          </select>
          
          <select
            value={filters.action}
            onChange={(e) => handleFilterChange('action', e.target.value)}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="">모든 액션</option>
            <option value="create">생성</option>
            <option value="update">수정</option>
            <option value="delete">삭제</option>
          </select>

          <input
            type="date"
            value={filters.start_date}
            onChange={(e) => handleFilterChange('start_date', e.target.value)}
            className="border rounded px-3 py-2 text-sm"
            placeholder="시작일"
          />

          <input
            type="date"
            value={filters.end_date}
            onChange={(e) => handleFilterChange('end_date', e.target.value)}
            className="border rounded px-3 py-2 text-sm"
            placeholder="종료일"
          />

          <input
            type="text"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="border rounded px-3 py-2 text-sm"
            placeholder="검색어"
          />
        </div>
      </div>

      {/* 로그 목록 */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="border-l-2 border-gray-300 ml-4">
        {logs.length === 0 && !loading ? (
          <div className="text-center text-gray-500 py-8">
            활동 로그가 없습니다.
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.log_id} className="relative pl-6 mb-6">
              <div className="absolute -left-3 top-1 w-6 h-6 bg-white border-2 border-blue-500 rounded-full flex items-center justify-center text-sm">
                {getEntityIcon(log.entity_type)}
              </div>
              <div className="text-gray-600 text-sm mb-1">
                {new Date(log.timestamp).toLocaleString('ko-KR', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
              <div className="bg-gray-100 rounded-lg p-4 shadow-sm">
                <p className="font-semibold">
                  <span className="text-blue-600">
                    {log.user_name || '알 수 없는 사용자'}
                  </span>님이 {getActionMessage(log)}
                </p>
                {log.details && (
                  <p className="text-sm text-gray-700 mt-1 bg-white rounded px-2 py-1">
                    "{log.details}"
                  </p>
                )}
                <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                  <span>ID: {log.entity_id}</span>
                  {log.project_name && <span>프로젝트: {log.project_name}</span>}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 더 로드하기 버튼 */}
      {pagination.hasMore && (
        <div className="text-center mt-6">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? '로딩 중...' : '더 보기'}
          </button>
        </div>
      )}

      {loading && logs.length === 0 && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-600">로그를 불러오는 중...</p>
        </div>
      )}
    </div>
  );
}

export default function LogPage({ inner }) {
  const { organizations, selectedOrgIndex, selectedProjectIndex } = useContext(OrgProjectContext);
  const org = organizations[selectedOrgIndex];
  const project = org ? org.projects[selectedProjectIndex] : null;

  if (inner) {
    return <LogContent />;
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
            <span className="py-2 px-1 text-gray-500 cursor-pointer">callendar</span>
            <span className="py-2 px-1 text-gray-500 cursor-pointer">tasks</span>
            <span className="py-2 px-1 border-b-2 border-yellow-400 font-bold text-gray-900 cursor-pointer">log</span>
          </nav>
        </div>
        <LogContent />
      </main>
    </div>
  );
}
