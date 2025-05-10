
import React, { useState } from "react";

const initialColumns = [
  {
    title: "영업 시작",
    tasks: [
      { title: "영업 시작", dueDate: "2025-03-02", tags: ["영업"], participant: "김태수" },
      { title: "기능 업데이트에 대한 설명서 업데이트", dueDate: "2025-03-21", tags: ["콘텐츠"], participant: "이예나" },
    ],
  },
  {
    title: "진행 중",
    tasks: [
      { title: "웹 사이트 및 앱 일러스트레이션", dueDate: "2025-03-04", tags: ["디자인"], participant: "성기영" },
      { title: "웹 세미나 추적", dueDate: "2025-03-27", tags: ["디자인", "마케팅"], participant: "송준표" },
    ],
  },
  {
    title: "시작 준비 완료",
    tasks: [
      { title: "월간 기능 업데이트 공지 블로그", dueDate: "2025-03-26", tags: ["마케팅", "제품"], participant: "이예나" },
    ],
  },
];

const tagColorMap = {
  영업: "bg-red-200 text-red-800",
  콘텐츠: "bg-purple-200 text-purple-800",
  디자인: "bg-pink-200 text-pink-800",
  마케팅: "bg-blue-200 text-blue-800",
  제품: "bg-green-200 text-green-800",
};

const participantEmojiMap = {
  김태수: "🧑‍💼",
  이예나: "👩‍💻",
  성기영: "👨‍🎨",
  송준표: "🥷",
};


// function TaskCard({ title, dueDate, tags }) {
//   return (
//     <div className="bg-white rounded-xl shadow p-3 space-y-2">
//       <h4 className="font-semibold text-sm">{title}</h4>
//       <div className="text-xs text-gray-500">📅 {dueDate}</div>
//       <div className="flex flex-wrap gap-1">
//         {tags.map((tag, idx) => (
//           <span
//             key={idx}
//             className={`px-2 py-0.5 rounded-full text-xs font-medium ${tagColorMap[tag] || "bg-gray-200 text-gray-700"}`}
//           >
//             {tag}
//           </span>
//         ))}
//       </div>
//     </div>
//   );
// }

function TaskCard({ title, dueDate, tags, participant }) {
  return (
    <div className="bg-white rounded-xl shadow p-3 space-y-2">
      <h4 className="font-semibold text-sm">{title}</h4>
      <div className="text-xs text-gray-500">📅 {dueDate}</div>
      <div className="flex flex-wrap gap-1">
        {tags.map((tag, idx) => (
          <span
            key={idx}
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${tagColorMap[tag] || "bg-gray-200 text-gray-700"}`}
          >
            {tag}
          </span>
        ))}
      </div>
      {/* 참여자 표시 */}
      <div className="text-xs text-gray-600 mt-1">
        {participantEmojiMap[participant] || ""} {participant}
      </div>
    </div>
  );
}

function BoardPage() {
  const [columns, setColumns] = useState(initialColumns);
  const [filterVisible, setFilterVisible] = useState(false);
  const [filter, setFilter] = useState({ tag: '', participant: '' });

  const filterTasks = (tasks) => {
    return tasks.filter(task => {
      return (!filter.tag || task.tags.includes(filter.tag)) &&
             (!filter.participant || task.participant === filter.participant);
    });
  };

  const uniqueTags = Array.from(new Set(columns.flatMap(col => col.tasks.flatMap(t => t.tags))));
  const uniqueParticipants = Array.from(new Set(columns.flatMap(col => col.tasks.map(t => t.participant))));

  return (
    <div className="p-6 overflow-x-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold mb-6">🗂️ 보드</h2>
        <button
          className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
          onClick={() => setFilterVisible(!filterVisible)}
        >
          필터
        </button>
      </div>

      {filterVisible && (
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
          <label>
            레이블:
            <select
              value={filter.tag}
              onChange={(e) => setFilter({ ...filter, tag: e.target.value })}
              className="ml-2 border rounded p-1"
            >
              <option value="">전체</option>
              {uniqueTags.map((tag, idx) => (
                <option key={idx} value={tag}>{tag}</option>
              ))}
            </select>
          </label>
          <label>
            참여자:
            <select
              value={filter.participant}
              onChange={(e) => setFilter({ ...filter, participant: e.target.value })}
              className="ml-2 border rounded p-1"
            >
              <option value="">전체</option>
              {uniqueParticipants.map((p, idx) => (
                <option key={idx} value={p}>{p}</option>
              ))}
            </select>
          </label>
          {/* <label>
            상위업무:
            <select
              value={filter.level}
              onChange={(e) => setFilter({ ...filter, level: e.target.value })}
              className="ml-2 border rounded p-1"
            >
              <option value="">전체</option>
              {uniquelevel.map((p, idx) => (
                <option key={idx} value={l}>{l}</option>
              ))}
            </select>
          </label> */}
        </div>
      )}

      <div className="flex gap-6 min-w-[900px]">
        {columns.map((col, colIndex) => (
          <div key={colIndex} className="w-80 flex-shrink-0 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-bold mb-4 border-b pb-2">{col.title}</h3>
            <div className="space-y-3">
              {filterTasks(col.tasks).map((task, taskIndex) => (
                <TaskCard key={taskIndex} {...task} />
              ))}
              <button className="w-full mt-2 text-blue-500 text-sm hover:underline">
                + 만들기
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BoardPage;