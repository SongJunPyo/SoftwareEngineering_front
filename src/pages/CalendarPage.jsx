import React, { useContext, useRef } from "react";
import Sidebar from "../components/Sidebar";
import { OrgProjectContext } from "../context/OrgProjectContext";
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

const initialTasks = {
  "2025-05-06": [
    { title: "UI 회의", type: "회의", start: "2025-05-06", end: "2025-05-06" }
  ],
  "2025-05-08": [
    { title: "DB 마감일", type: "마감", start: "2025-05-08", end: "2025-05-08" },
    { title: "API 설계", type: "작업", start: "2025-05-08", end: "2025-05-08" }
  ]
};

function CalendarContent() {
  const calendarRef = useRef(null);
  const [calendarView] = React.useState('dayGridMonth');
  const [events] = React.useState([
    { title: 'UI 회의', start: '2025-05-06', end: '2025-05-06', type: '회의', description: 'UI 관련 회의입니다.' },
    { title: 'DB 마감일', start: '2025-05-08', end: '2025-05-08', type: '마감', description: 'DB 작업 마감일입니다.' },
    { title: 'API 설계', start: '2025-05-08', end: '2025-05-08', type: '작업', description: 'API 설계 작업.' },
  ]);
  const [currentDate, setCurrentDate] = React.useState(new Date('2025-05-01'));
  const [selectedDate, setSelectedDate] = React.useState(null);

  // 현재 월(25/05) 포맷
  const getMonthLabel = (date) => {
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${year}/${month}`;
  };

  // 월 이동
  const handlePrevMonth = () => {
    if (calendarRef.current) {
      calendarRef.current.getApi().prev();
    }
  };
  const handleNextMonth = () => {
    if (calendarRef.current) {
      calendarRef.current.getApi().next();
    }
  };

  // 해당 날짜의 이벤트 목록
  const getEventsForDate = (date) => {
    const key = date.toISOString().split('T')[0];
    return events.filter(ev => ev.start === key);
  };

  return (
    <div className="relative w-full h-screen p-6">
      <div className="flex items-center gap-4 mb-4">
        <button onClick={handlePrevMonth} className="text-2xl px-2">&#8592;</button>
        <span className="text-xl font-bold w-20 text-center">{getMonthLabel(currentDate)}</span>
        <button onClick={handleNextMonth} className="text-2xl px-2">&#8594;</button>
      </div>
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView={calendarView}
        headerToolbar={false}
        height="auto"
        events={events}
        initialDate={currentDate}
        datesSet={arg => setCurrentDate(new Date(arg.view.currentStart))}
        dateClick={info => setSelectedDate(new Date(info.dateStr))}
        dayCellDidMount={info => {
          // 일요일: 0, 토요일: 6
          if (info.date.getDay() === 0) {
            info.el.style.backgroundColor = '#ffeaea'; // 연한 빨간색
          } else if (info.date.getDay() === 6) {
            info.el.style.backgroundColor = '#eaf1ff'; // 연한 파란색
          }
        }}
      />
      {selectedDate && (
        <div className="mt-6 p-4 bg-gray-50 rounded shadow">
          <div className="font-bold mb-2">{selectedDate.toLocaleDateString('ko-KR')}</div>
          {getEventsForDate(selectedDate).length > 0 ? (
            <ul className="space-y-2">
              {getEventsForDate(selectedDate).map((ev, idx) => (
                <li key={idx} className="p-2 rounded border bg-white">
                  <div className="font-semibold">{ev.title}</div>
                  <div className="text-xs text-gray-500">{ev.type}</div>
                  <div className="text-sm mt-1">{ev.description}</div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-gray-400">이 날에는 일정이 없습니다.</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CalendarPage({ inner }) {
  const { organizations, selectedOrgIndex, selectedProjectIndex } = useContext(OrgProjectContext);
  const org = organizations[selectedOrgIndex];
  const project = org ? org.projects[selectedProjectIndex] : null;

  if (inner) {
    return <CalendarContent />;
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
            <span className="py-2 px-1 border-b-2 border-yellow-400 font-bold text-gray-900 cursor-pointer">callendar</span>
            <span className="py-2 px-1 text-gray-500 cursor-pointer">tasks</span>
            <span className="py-2 px-1 text-gray-500 cursor-pointer">log</span>
          </nav>
        </div>
        <CalendarContent />
      </main>
    </div>
  );
}
