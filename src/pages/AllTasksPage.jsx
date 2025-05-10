//업무추가 버튼 클릭 시 이벤트트


import React, { useState } from "react";

const tasksData = [
  {
    id: 1,
    key: "영업 시작",
    summary: "영업 시작",
    status: "해야 할 일",
    assignee: "Taesu Kim",
    dueDate: "2025년 3월 16일"
  },
  {
    id: 2,
    key: "영업 시작",
    summary: "기능 업데이트에 대한 설명서 업데이트",
    status: "진행 중",
    assignee: "Taesu Kim",
    dueDate: "2025년 3월 13일"
  },
  {
    id: 3,
    key: "웹 사이트 및 앱 일러스트레이션",
    summary: "웹 세미나 추적",
    status: "진행 중",
    assignee: "",
    dueDate: ""
  }
];

function AllTasksPage() {
  const [selectedStatus, setSelectedStatus] = useState("전체");
  const [searchText, setSearchText] = useState("");
  const [selectedTasks, setSelectedTasks] = useState([]);

  const filteredTasks = tasksData.filter((task) => {
    const statusMatch = selectedStatus === "전체" || task.status === selectedStatus;
    const searchMatch = task.summary.toLowerCase().includes(searchText.toLowerCase());
    return statusMatch && searchMatch;
  });

  const toggleSelect = (taskId) => {
    setSelectedTasks((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const isNearDeadline = (dateStr) => {
    if (!dateStr) return false;
    const today = new Date();
    const deadline = new Date(dateStr.replace(/년 |월 /g, "-").replace("일", ""));
    const diffTime = deadline - today;
    return diffTime <= 1000 * 60 * 60 * 24 * 7; // 7일 이내
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">📋 모든 업무</h2>

      {/* 필터 및 버튼 영역 */}
      <div className="mb-4 flex flex-wrap md:flex-nowrap items-center justify-between gap-2">
        <div className="flex flex-grow gap-2">
          <input
            type="text"
            placeholder="업무 내용 검색"
            className="border rounded px-3 py-1 w-full md:w-64"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="border rounded px-3 py-1 w-full md:w-40"
          >
            <option value="전체">전체</option>
            <option value="해야 할 일">해야 할 일</option>
            <option value="진행 중">진행 중</option>
            <option value="완료">완료</option>
          </select>
        </div>

        <button
          className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600 ml-auto"
          onClick={() => alert("업무 추가 버튼 클릭됨")}
        >
          + 업무 추가
        </button>
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2"><input type="checkbox" disabled /></th>
              <th className="border p-2">상위 업무</th>
              <th className="border p-2">업무명</th>
              <th className="border p-2">상태</th>
              <th className="border p-2">담당자</th>
              <th className="border p-2">기한</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.map((task) => (
              <tr key={task.id}>
                <td className="border p-2 text-center">
                  <input
                    type="checkbox"
                    checked={selectedTasks.includes(task.id)}
                    onChange={() => toggleSelect(task.id)}
                  />
                </td>
                <td className="border p-2">{task.key}</td>
                <td className="border p-2">{task.summary}</td>
                <td className="border p-2">{task.status}</td>
                <td className="border p-2">{task.assignee}</td>
                <td className="border p-2">
                  <span className={
                    isNearDeadline(task.dueDate)
                      ? "text-red-500 font-semibold"
                      : ""
                  }>
                    {task.dueDate || "-"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AllTasksPage;
