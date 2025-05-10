
// import React, { useState } from "react";
// import Calendar from "react-calendar";
// import 'react-calendar/dist/Calendar.css';

// const initialTasks = {
//   "2025-05-06": [
//     { title: "UI 회의", type: "회의", start: "2025-05-06", end: "2025-05-06" }
//   ],
//   "2025-05-08": [
//     { title: "DB 마감일", type: "마감", start: "2025-05-08", end: "2025-05-08" },
//     { title: "API 설계", type: "작업", start: "2025-05-08", end: "2025-05-08" }
//   ]
// };

// function CalendarPage() {
//   const [date, setDate] = useState(new Date());
//   const [showForm, setShowForm] = useState(false);
//   const [newTask, setNewTask] = useState({ title: '', start: '', end: '', type: '작업' });
//   const [tasks, setTasks] = useState(initialTasks);

//   const formatDate = (dateObj) => {
//     return dateObj.toISOString().split('T')[0];
//   };

//   const getColor = (type) => {
//     switch(type) {
//       case "회의": return "bg-blue-200 text-blue-800";
//       case "마감": return "bg-red-200 text-red-800";
//       case "작업": return "bg-green-200 text-green-800";
//       default: return "bg-gray-200 text-gray-800";
//     }
//   };

//   const handleAddTask = () => {
//     const newTasks = { ...tasks };
//     const startDate = new Date(newTask.start);
//     const endDate = new Date(newTask.end);
//     while (startDate <= endDate) {
//       const key = formatDate(startDate);
//       if (!newTasks[key]) newTasks[key] = [];
//       newTasks[key].push({ ...newTask });
//       startDate.setDate(startDate.getDate() + 1);
//     }
//     setTasks(newTasks);
//     setShowForm(false);
//     setNewTask({ title: '', start: '', end: ''});
//   };

//   return (
//     <div className="relative w-full h-screen p-6">
//       <h2 className="text-2xl font-bold mb-2">📅 캘린더</h2>
//       <p className="text-gray-600 mb-4">일정을 확인하고 관리하세요.</p>

//       <div className="w-[full] h-[50%]">
//         <Calendar
//           onChange={setDate}
//           value={date}
//           tileContent={({ date }) => {
//             const key = formatDate(date);
//             return tasks[key] ? (
//               <ul className="mt-1 text-[10px] space-y-0.5">
//                 {tasks[key].map((task, i) => (
//                   <li key={i} className={`rounded px-1 truncate ${getColor(task.type)}`}>{task.title}</li>
//                 ))}
//               </ul>
//             ) : null;
//           }}
//           className="w-full h-full text-sm"
//         />
//         <button onClick={() => setShowForm(true)} className="absolute top-6 right-6 bg-green-500 text-white rounded-full w-10 h-10 text-xl">+</button>
//       </div>

//       {showForm && (
//         <div className="absolute top-20 right-6 bg-white border p-4 rounded shadow-md z-50">
//           <h3 className="text-lg font-bold mb-2">새 일정 추가</h3>
//           <input
//             type="text"
//             placeholder="업무명"
//             value={newTask.title}
//             onChange={e => setNewTask({ ...newTask, title: e.target.value })}
//             className="block w-full mb-2 border p-1"
//           />
//           <input
//             type="date"
//             value={newTask.start}
//             onChange={e => setNewTask({ ...newTask, start: e.target.value })}
//             className="block w-full mb-2 border p-1"
//           />
//           <input
//             type="date"
//             value={newTask.end}
//             onChange={e => setNewTask({ ...newTask, end: e.target.value })}
//             className="block w-full mb-2 border p-1"
//           />
//           {/* <select
//             value={newTask.type}
//             onChange={e => setNewTask({ ...newTask, type: e.target.value })}
//             className="block w-full mb-2 border p-1"
//           >
//             <option value="작업">작업</option>
//             <option value="회의">회의</option>
//             <option value="마감">마감</option>
//           </select> */}
//           <div className="flex justify-end gap-2">
//             <button onClick={handleAddTask} className="bg-blue-500 text-white px-3 py-1 rounded">추가</button>
//             <button onClick={() => setShowForm(false)} className="bg-gray-300 px-3 py-1 rounded">취소</button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default CalendarPage;

import React, { useState } from "react";
import Calendar from "react-calendar";
import 'react-calendar/dist/Calendar.css';

const initialTasks = {
  "2025-05-06": [
    { title: "UI 회의", type: "회의", start: "2025-05-06", end: "2025-05-06" }
  ],
  "2025-05-08": [
    { title: "DB 마감일", type: "마감", start: "2025-05-08", end: "2025-05-08" },
    { title: "API 설계", type: "작업", start: "2025-05-08", end: "2025-05-08" }
  ]
};

function CalendarPage() {
  const [date, setDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', start: '', end: '', type: '작업' });
  const [tasks, setTasks] = useState(initialTasks);

  const formatDate = (dateObj) => {
    return dateObj.toISOString().split('T')[0];
  };

  const getColor = (type) => {
    switch(type) {
      case "회의": return "bg-blue-200 text-blue-800";
      case "마감": return "bg-red-200 text-red-800";
      case "작업": return "bg-green-200 text-green-800";
      default: return "bg-gray-200 text-gray-800";
    }
  };

  const handleAddTask = () => {
    const newTasks = { ...tasks };

    const startDate = new Date(newTask.start);
    const endDate = new Date(newTask.end);

    // ✅ 날짜 밀림 방지
    startDate.setHours(12);
    endDate.setHours(12);

    while (startDate <= endDate) {
      const key = formatDate(startDate);
      if (!newTasks[key]) newTasks[key] = [];
      newTasks[key].push({ ...newTask });
      startDate.setDate(startDate.getDate() + 1);
    }

    setTasks(newTasks);
    setShowForm(false);
    setNewTask({ title: '', start: '', end: '', type: '작업' });
  };

  return (
    <div className="relative w-full h-screen p-6">
      <h2 className="text-2xl font-bold mb-2">📅 캘린더</h2>
      <p className="text-gray-600 mb-4">일정을 확인하고 관리하세요.</p>

      <div className="w-[full] h-[50%]">
        <Calendar
          onChange={setDate}
          value={date}
          tileContent={({ date }) => {
            const key = formatDate(date);
            return tasks[key] ? (
              <ul className="mt-1 text-[10px] space-y-0.5">
                {tasks[key].map((task, i) => (
                  <li key={i} className={`rounded px-1 truncate ${getColor(task.type)}`}>{task.title}</li>
                ))}
              </ul>
            ) : null;
          }}
          className="w-full h-full text-sm"
        />
        <button onClick={() => setShowForm(true)} className="absolute top-6 right-6 bg-green-500 text-white rounded-full w-10 h-10 text-xl">+</button>
      </div>

      {showForm && (
        <div className="absolute top-20 right-6 bg-white border p-4 rounded shadow-md z-50">
          <h3 className="text-lg font-bold mb-2">새 일정 추가</h3>
          <input
            type="text"
            placeholder="업무명"
            value={newTask.title}
            onChange={e => setNewTask({ ...newTask, title: e.target.value })}
            className="block w-full mb-2 border p-1"
          />
          <input
            type="date"
            value={newTask.start}
            onChange={e => setNewTask({ ...newTask, start: e.target.value })}
            className="block w-full mb-2 border p-1"
          />
          <input
            type="date"
            value={newTask.end}
            onChange={e => setNewTask({ ...newTask, end: e.target.value })}
            className="block w-full mb-2 border p-1"
          />
          {/* 타입 선택은 현재 주석 처리 */}
          <div className="flex justify-end gap-2">
            <button onClick={handleAddTask} className="bg-blue-500 text-white px-3 py-1 rounded">추가</button>
            <button onClick={() => setShowForm(false)} className="bg-gray-300 px-3 py-1 rounded">취소</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CalendarPage;
