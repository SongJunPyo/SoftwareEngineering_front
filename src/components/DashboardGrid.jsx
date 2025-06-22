import React from 'react';
import DashboardCard from "./DashboardCard";
import { FaChartPie, FaUser, FaList, FaTags, FaUsers, FaTasks } from "react-icons/fa";

// 예시 데이터를 별도 컴포넌트로 분리
const SampleDashboard = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
    <DashboardCard title="전체 상태 개요" icon={<FaChartPie className="text-pink-400 text-3xl" />}>
      <div className="flex flex-col items-center">
        <div className="w-32 h-32 rounded-full border-8 border-gray-200 flex items-center justify-center text-2xl font-bold text-gray-700 mb-2">
          0
        </div>
        <div className="flex space-x-4 text-xs mt-2">
          <span className="flex items-center"><span className="w-3 h-3 bg-pink-400 rounded-full mr-1" />해야 할 일: 0</span>
          <span className="flex items-center"><span className="w-3 h-3 bg-orange-400 rounded-full mr-1" />진행 중: 0</span>
          <span className="flex items-center"><span className="w-3 h-3 bg-blue-400 rounded-full mr-1" />완료: 0</span>
        </div>
        <p className="text-sm text-gray-500 mt-4">업무를 추가하여 프로젝트를 시작하세요.</p>
      </div>
    </DashboardCard>
    <DashboardCard title="개인 상태 개요" icon={<FaUser className="text-pink-400 text-3xl" />}>
      <div className="flex flex-col items-center">
        <div className="w-24 h-24 rounded-full border-8 border-gray-200 flex items-center justify-center text-xl font-bold text-gray-700 mb-2">
          0
        </div>
        <div className="flex space-x-4 text-xs mt-2">
          <span className="flex items-center"><span className="w-3 h-3 bg-pink-400 rounded-full mr-1" />해야 할 일: 0</span>
          <span className="flex items-center"><span className="w-3 h-3 bg-orange-400 rounded-full mr-1" />진행 중: 0</span>
          <span className="flex items-center"><span className="w-3 h-3 bg-blue-400 rounded-full mr-1" />완료: 0</span>
        </div>
      </div>
    </DashboardCard>
    <DashboardCard title="최근 활동" icon={<FaList className="text-yellow-400 text-3xl" />}>
        <p className="text-sm text-gray-500 mt-2">프로젝트 활동이 여기에 표시됩니다.</p>
    </DashboardCard>
  </div>
);

// 실제 데이터를 표시하는 컴포넌트
const RealDashboard = ({ data }) => {
    const { status_overview, personal_overview, recent_activities, tag_usage, team_workload, parent_task_progress } = data;

    // 도넛 차트 스타일 계산 함수
    const getDonutStyle = (overview) => {
        const total = overview.total_tasks;
        if (total === 0) return { background: '#e5e7eb' }; // gray-200

        const todo_deg = (overview.todo / total) * 360;
        const in_progress_deg = (overview.in_progress / total) * 360;

        return {
            background: `conic-gradient(
                #f472b6 ${todo_deg}deg, 
                #fb923c ${todo_deg}deg ${todo_deg + in_progress_deg}deg,
                #60a5fa ${todo_deg + in_progress_deg}deg 360deg
            )`
        };
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <DashboardCard title="전체 상태 개요" icon={<FaChartPie className="text-pink-400 text-3xl" />}>
                <div className="flex flex-col items-center">
                    <div style={getDonutStyle(status_overview)} className="w-32 h-32 rounded-full flex items-center justify-center text-2xl font-bold text-gray-700 mb-2">
                        <div className="bg-white w-24 h-24 rounded-full flex items-center justify-center">{status_overview.total_tasks}</div>
                    </div>
                    <div className="flex flex-wrap justify-center gap-x-4 text-xs mt-2">
                        <span className="flex items-center"><span className="w-3 h-3 bg-pink-400 rounded-full mr-1" />해야 할 일: {status_overview.todo}</span>
                        <span className="flex items-center"><span className="w-3 h-3 bg-orange-400 rounded-full mr-1" />진행 중: {status_overview.in_progress}</span>
                        <span className="flex items-center"><span className="w-3 h-3 bg-blue-400 rounded-full mr-1" />완료: {status_overview.complete}</span>
                    </div>
                </div>
            </DashboardCard>
            <DashboardCard title="개인 상태 개요" icon={<FaUser className="text-pink-400 text-3xl" />}>
                <div className="flex flex-col items-center">
                    <div style={getDonutStyle(personal_overview)} className="w-24 h-24 rounded-full flex items-center justify-center text-xl font-bold text-gray-700 mb-2">
                         <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center">{personal_overview.total_tasks}</div>
                    </div>
                    <div className="flex flex-wrap justify-center gap-x-4 text-xs mt-2">
                        <span className="flex items-center"><span className="w-3 h-3 bg-pink-400 rounded-full mr-1" />해야 할 일: {personal_overview.todo}</span>
                        <span className="flex items-center"><span className="w-3 h-3 bg-orange-400 rounded-full mr-1" />진행 중: {personal_overview.in_progress}</span>
                        <span className="flex items-center"><span className="w-3 h-3 bg-blue-400 rounded-full mr-1" />완료: {personal_overview.complete}</span>
                    </div>
                </div>
            </DashboardCard>
            <DashboardCard title="최근 활동" icon={<FaList className="text-yellow-400 text-3xl" />}>
                <ul className="text-sm text-gray-600 space-y-1 mt-2">
                    {recent_activities.length > 0 ? (
                        recent_activities.map((act, index) => <li key={index}>{act.message}</li>)
                    ) : (
                        <li>최근 활동이 없습니다.</li>
                    )}
                </ul>
            </DashboardCard>
            <DashboardCard title="태그 유형" icon={<FaTags className="text-gray-400 text-3xl" />}>
                <div className="space-y-2 mt-2">
                    {tag_usage.length > 0 ? tag_usage.map(tag => (
                        <div key={tag.tag_name}>
                             <div className="flex justify-between text-xs"><span>{tag.tag_name}</span><span>{tag.count}개</span></div>
                             <div className="w-full h-2 bg-gray-200 rounded"><div className="h-2 bg-blue-400 rounded" style={{width:`${(tag.count / status_overview.total_tasks) * 100}%`}} /></div>
                        </div>
                    )) : <p className="text-sm text-gray-500">태그가 없습니다.</p>}
                </div>
            </DashboardCard>
            <DashboardCard title="팀 워크로드" icon={<FaUsers className="text-blue-400 text-3xl" />}>
                <div className="space-y-2 mt-2 text-xs">
                     {team_workload.length > 0 ? team_workload.map(member => (
                        <div key={member.member_name}>
                            <div className="flex justify-between"><span>{member.member_name}</span><span>{member.task_count}개</span></div>
                            <div className="w-full h-2 bg-gray-200 rounded"><div className="h-2 bg-pink-400 rounded" style={{width:`${(member.task_count / status_overview.total_tasks) * 100}%`}} /></div>
                        </div>
                     )) : <p className="text-sm text-gray-500">담당자가 지정된 업무가 없습니다.</p>}
                </div>
            </DashboardCard>
            <DashboardCard title="상위 업무 진행률" icon={<FaTasks className="text-yellow-400 text-3xl" />}>
                <div className="flex flex-col items-center mt-2">
                    <div className="relative w-20 h-20">
                        <svg className="w-full h-full" viewBox="0 0 36 36">
                            <path className="text-gray-200" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                            <path className="text-yellow-400" strokeWidth="3" strokeDasharray={`${parent_task_progress.progress}, 100`} fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        </svg>
                         <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-lg font-bold text-gray-700">
                           {Math.round(parent_task_progress.progress)}%
                        </div>
                    </div>
                    <span className="text-xs text-gray-500 mt-2">{parent_task_progress.completed_parent_tasks} / {parent_task_progress.total_parent_tasks} 완료</span>
                </div>
            </DashboardCard>
        </div>
    );
};

export default function DashboardGrid({ dashboardData }) {
  if (!dashboardData) {
    // 데이터가 로딩 중이거나 없으면 로딩 메시지 또는 예시 대시보드 표시
    return <p>대시보드 데이터를 불러오는 중입니다...</p>;
  }

  // 데이터의 총 업무 수가 0이면 예시 대시보드 표시
  if (dashboardData.status_overview.total_tasks === 0) {
    return <SampleDashboard />;
  }

  // 데이터가 있으면 실제 대시보드 표시
  return <RealDashboard data={dashboardData} />;
}
