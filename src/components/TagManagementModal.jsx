import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function TagManagementModal({ projectId, onClose, onTagChange }) {
  const [tags, setTags] = useState([]);
  const [newTagName, setNewTagName] = useState('');
  const [editingTag, setEditingTag] = useState(null);
  const [editingTagName, setEditingTagName] = useState('');
  const [loading, setLoading] = useState(false);

  // 태그 목록 조회
  const fetchTags = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`http://localhost:8005/api/v1/projects/${projectId}/tags`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTags(response.data);
    } catch (error) {
      console.error('태그 목록 조회 실패:', error);
      alert(error.response?.data?.detail || '태그 목록을 불러오는데 실패했습니다.');
    }
  };

  // 컴포넌트 마운트 시 태그 목록 조회
  useEffect(() => {
    if (projectId) {
      fetchTags();
    }
  }, [projectId]);

  // 새 태그 추가
  const handleAddTag = async (e) => {
    e.preventDefault();
    if (!newTagName.trim()) {
      alert('태그명을 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      await axios.post(`http://localhost:8005/api/v1/projects/${projectId}/tags`, {
        tag_name: newTagName.trim(),
        project_id: projectId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setNewTagName('');
      await fetchTags(); // 목록 새로고침
      onTagChange && onTagChange(); // 부모 컴포넌트에 변경 알림
    } catch (error) {
      console.error('태그 추가 실패:', error);
      alert(error.response?.data?.detail || '태그 추가에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 태그 수정 시작
  const startEditTag = (tag) => {
    setEditingTag(tag.tag_name);
    setEditingTagName(tag.tag_name);
  };

  // 태그 수정 완료
  const handleUpdateTag = async (oldTagName) => {
    if (!editingTagName.trim()) {
      alert('태그명을 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      await axios.put(`http://localhost:8005/api/v1/projects/${projectId}/tags/${encodeURIComponent(oldTagName)}`, {
        tag_name: editingTagName.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setEditingTag(null);
      setEditingTagName('');
      await fetchTags(); // 목록 새로고침
      onTagChange && onTagChange(); // 부모 컴포넌트에 변경 알림
    } catch (error) {
      console.error('태그 수정 실패:', error);
      alert(error.response?.data?.detail || '태그 수정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 태그 수정 취소
  const cancelEditTag = () => {
    setEditingTag(null);
    setEditingTagName('');
  };

  // 태그 삭제
  const handleDeleteTag = async (tagName) => {
    if (!window.confirm(`'${tagName}' 태그를 삭제하시겠습니까?\n이 태그가 할당된 모든 작업에서 제거됩니다.`)) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(`http://localhost:8005/api/v1/projects/${projectId}/tags/${encodeURIComponent(tagName)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      await fetchTags(); // 목록 새로고침
      onTagChange && onTagChange(); // 부모 컴포넌트에 변경 알림
    } catch (error) {
      console.error('태그 삭제 실패:', error);
      alert(error.response?.data?.detail || '태그 삭제에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">태그 관리</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {/* 새 태그 추가 폼 */}
          <form onSubmit={handleAddTag} className="mb-6">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="새 태그명 입력"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !newTagName.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg transition-colors font-medium"
              >
                추가
              </button>
            </div>
          </form>

          {/* 태그 목록 */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            <h3 className="text-sm font-medium text-gray-700 mb-3">현재 태그 목록</h3>
            {tags.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                <p className="text-sm">아직 태그가 없습니다.</p>
                <p className="text-xs text-gray-400">첫 번째 태그를 추가해보세요!</p>
              </div>
            ) : (
              tags.map((tag) => (
                <div key={tag.tag_name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  {editingTag === tag.tag_name ? (
                    <div className="flex items-center space-x-2 flex-1">
                      <input
                        type="text"
                        value={editingTagName}
                        onChange={(e) => setEditingTagName(e.target.value)}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        autoFocus
                      />
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleUpdateTag(tag.tag_name)}
                          disabled={loading}
                          className="p-1 text-green-600 hover:text-green-800 disabled:text-gray-400"
                          title="저장"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        <button
                          onClick={cancelEditTag}
                          disabled={loading}
                          className="p-1 text-gray-600 hover:text-gray-800 disabled:text-gray-400"
                          title="취소"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {tag.tag_name}
                        </span>
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => startEditTag(tag)}
                          disabled={loading}
                          className="p-1 text-gray-600 hover:text-blue-600 disabled:text-gray-400 transition-colors"
                          title="수정"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteTag(tag.tag_name)}
                          disabled={loading}
                          className="p-1 text-gray-600 hover:text-red-600 disabled:text-gray-400 transition-colors"
                          title="삭제"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* 푸터 */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}