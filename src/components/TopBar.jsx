// import React, { useState, useRef, useEffect } from "react";
// import logo from "./planora.png";
// import { useLocation, useNavigate } from "react-router-dom";
 
// function TopBar({ user, onLogout }) {
//   const [showAlerts, setShowAlerts] = useState(false);
//   const alertRef = useRef(null);
//   const location = useLocation();
//   const navigate = useNavigate();
 
//   const dummyAlerts = [
//     "새로운 댓글이 달렸습니다.",
//     "업무 마감일이 다가옵니다.",
//     "프로젝트에 새로운 팀원이 추가되었습니다.",
//     "미확인 알림이 있습니다.",
//     "일정이 곧 시작됩니다.",
//   ];
 
//   // 바깥 클릭 시 드롭다운 닫기
//   useEffect(() => {
//     function handleClickOutside(event) {
//       if (alertRef.current && !alertRef.current.contains(event.target)) {
//         setShowAlerts(false);
//       }
//     }
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, []);
 
//   // 로그아웃 핸들러 - localStorage 직접 조작 제거
//   const handleLogout = () => {
//     if (typeof onLogout === 'function') {
//       onLogout();
//     }
//   };
 
//   return (
//     <header className="bg-white px-6 py-4 flex justify-between items-center relative">
//       {/* 로고 이미지 */}
//       <img
//         src={logo}
//         alt="Planora Logo"
//         className="h-8 cursor-pointer"
//         onClick={() => {
//           if (user && user.email) {
//             navigate('/main', { replace: true });
//           } else {
//             navigate('/login', { replace: true });
//           }
//         }}
//       />
 
//       {/* 우측 버튼들 */}
//       <div className="flex items-center space-x-4 relative">
//         {/* 알림 버튼 + 드롭다운 */}
//         <div className="relative" ref={alertRef}>
//           <button
//             className="bg-yellow-100 text-white px-4 py-2 rounded"
//             onClick={() => setShowAlerts(prev => !prev)}
//           >
//             🔔
//           </button>
 
//           {showAlerts && (
//             <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded shadow z-50">
//               <div className="p-3">
//                 <h4 className="font-semibold text-sm mb-2">알림</h4>
//                 <ul className="text-sm space-y-1 max-h-40 overflow-y-auto">
//                   {dummyAlerts.slice(0, 5).map((alert, idx) => (
//                     <li key={idx} className="border-b pb-1">{alert}</li>
//                   ))}
//                 </ul>
//                 <div className="text-right mt-2">
//                   <span className="text-blue-600 underline text-sm cursor-pointer">
//                     전체보기
//                   </span>
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>
 
//         {/* 설정 버튼 */}
//         <button
//           onClick={() => navigate('/settings')}
//           className="bg-yellow-100 text-white px-4 py-2 rounded"
//         >⚙️</button>

//         {/* 사용자 정보 및 로그아웃 버튼 */}
//         <div className="flex items-center space-x-2">
//           <span className="text-sm text-gray-600">{user?.name ? `${user.name}님` : user?.email}</span>
//           <button
//             onClick={handleLogout}
//             className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
//           >
//             로그아웃
//           </button>
//         </div>
//       </div>
//     </header>
//   );
// }
 
// export default TopBar;
 

import React, { useState, useRef, useEffect } from "react";
import logo from "./planora.png";
import { useLocation, useNavigate } from "react-router-dom";
import { AlertButton, SettingsButton } from "./Button";

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

  // 로그아웃 핸들러 추가
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    localStorage.removeItem('access_token'); // access_token도 삭제
    localStorage.removeItem('refresh_token'); // refresh_token도 삭제
    if (typeof onLogout === 'function') onLogout();
    // 필요하다면 아래 코드로 로그인 페이지로 이동 가능
    // navigate('/login');
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
          <AlertButton onClick={() => setShowAlerts((prev) => !prev)} />

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
        <SettingsButton />


        {/* 사용자 정보 및 로그아웃 버튼 */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">{user?.name ? `${user.name}님` : user?.email}</span>
          {/* <button 
            onClick={handleLogout}
            className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
          >
            로그아웃
          </button> */}
                    <button
            onClick={handleLogout}
            className="
              group flex items-center justify-start w-11 h-11 bg-red-600 
              rounded-full cursor-pointer relative overflow-hidden 
              transition-all duration-200 shadow-lg hover:w-32 
              hover:rounded-lg active:translate-x-1 active:translate-y-1
            "
          >
            <div className="flex items-center justify-center w-full transition-all duration-300 group-hover:justify-start group-hover:px-3">
              <svg
                className="w-4 h-4"
                viewBox="0 0 512 512"
                fill="white"
              >
                <path d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM160 96L96 96c-17.7 0-32 14.3-32 32l0 256c0 17.7 14.3 32 32 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c-53 0-96-43-96-96L0 128C0 75 43 32 96 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32z" />
              </svg>
            </div>
            <div className="
              absolute right-5 transform translate-x-full opacity-0 
              text-white text-lg font-semibold transition-all duration-300 
              group-hover:translate-x-0 group-hover:opacity-100
            ">
              Logout
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}

export default TopBar;
