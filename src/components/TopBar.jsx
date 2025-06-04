import React, { useState, useRef, useEffect } from "react";
import logo from "./planora.png";
import { useLocation, useNavigate } from "react-router-dom";
 
function TopBar({ user, onLogout }) {
  const [showAlerts, setShowAlerts] = useState(false);
  const alertRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
 
  const dummyAlerts = [
    "새로운 댓글이 달렸습니다.",
    "업무 마감일이 다가옵니다.",
    "프로젝트에 새로운 팀원이 추가되었습니다.",
    "미확인 알림이 있습니다.",
    "일정이 곧 시작됩니다.",
  ];
 
  // 바깥 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClickOutside(event) {
      if (alertRef.current && !alertRef.current.contains(event.target)) {
        setShowAlerts(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
 
  // 로그아웃 핸들러 - localStorage 직접 조작 제거
  const handleLogout = () => {
    if (typeof onLogout === 'function') {
      onLogout();
    }
  };
 
  return (
    <header className="bg-white px-6 py-4 flex justify-between items-center relative">
      {/* 로고 이미지 */}
      <img
        src={logo}
        alt="Planora Logo"
        className="h-8 cursor-pointer"
        onClick={() => {
          if (user && user.email) {
            navigate('/main', { replace: true });
          } else {
            navigate('/login', { replace: true });
          }
        }}
      />
 
      {/* 우측 버튼들 */}
      <div className="flex items-center space-x-4 relative">
        {/* 알림 버튼 + 드롭다운 */}
        <div className="relative" ref={alertRef}>
          <button
            className="bg-yellow-100 text-white px-4 py-2 rounded"
            onClick={() => setShowAlerts(prev => !prev)}
          >
            🔔
          </button>
 
          {showAlerts && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded shadow z-50">
              <div className="p-3">
                <h4 className="font-semibold text-sm mb-2">알림</h4>
                <ul className="text-sm space-y-1 max-h-40 overflow-y-auto">
                  {dummyAlerts.slice(0, 5).map((alert, idx) => (
                    <li key={idx} className="border-b pb-1">{alert}</li>
                  ))}
                </ul>
                <div className="text-right mt-2">
                  <span className="text-blue-600 underline text-sm cursor-pointer">
                    전체보기
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
 
        {/* 설정 버튼 */}
        <button
          onClick={() => navigate('/settings')}
          className="bg-yellow-100 text-white px-4 py-2 rounded"
        >⚙️</button>

        {/* 사용자 정보 및 로그아웃 버튼 */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">{user?.name ? `${user.name}님` : user?.email}</span>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
          >
            로그아웃
          </button>
        </div>
      </div>
    </header>
  );
}
 
export default TopBar;
 