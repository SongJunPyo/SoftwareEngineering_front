import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import LogList from './components/LogList';

function App() {
  return (
    <Router>
      <div>
        <nav>
          <ul>
            <li><Link to="/">홈</Link></li>
            <li><Link to="/logs">로그</Link></li>
          </ul>
        </nav>

        <Routes>
          <Route path="/" element={<div>홈페이지</div>} />
          <Route path="/logs" element={<LogList />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App; 