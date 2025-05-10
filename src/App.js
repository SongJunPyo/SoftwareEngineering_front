// App.js
import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import TopBar from "./components/TopBar";
import Sidebar from "./components/Sidebar";
import ProjectHeader from "./components/ProjectHeader";

import SummaryPage from "./pages/SummaryPage";
import LogPage from "./pages/LogPage";
import BoardPage from "./pages/BoardPage";
import CalendarPage from "./pages/CalendarPage";
import AllTasksPage from "./pages/AllTasksPage";
import LoginPage from "./pages/LoginPage"; // 생성한 로그인 페이지 import

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false); // 로그인 여부

  // 더미 로그인 처리 함수
  const handleLogin = (email, password) => {
    if (email && password) {
      setIsLoggedIn(true); // 이메일/비밀번호 아무거나 입력해도 로그인 성공
    }
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <Router>
      <div className="h-screen flex flex-col">
        <TopBar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto bg-gray-100">
            <ProjectHeader />
            <Routes>
              <Route path="/" element={<SummaryPage />} />
              <Route path="/log" element={<LogPage />} />
              <Route path="/board" element={<BoardPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/all-tasks" element={<AllTasksPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
