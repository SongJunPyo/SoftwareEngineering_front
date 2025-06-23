import React from 'react';
import DashboardCard from "./DashboardCard";
import { FaChartPie, FaUser, FaList, FaTags, FaUsers, FaTasks } from "react-icons/fa";
import { STATUS_CONFIG_CALENDAR } from '../constants/taskStatus';

// 예시 데이터를 별도 컴포넌트로 분리
const SampleDashboard = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
    <DashboardCard title="전체 상태 개요" icon={<FaChartPie className="text-pink-400 text-3xl" />}>
      <div className="flex flex-col items-center">
        <div className="w-32 h-32 rounded-full border-8 border-gray-200 flex items-center justify-center text-2xl font-bold text-gray-700 mb-2">
          0
        </div>
        <div className="flex flex-wrap justify-center gap-x-2 text-xs mt-2">
          <span className="flex items-center"><span className="w-3 h-3 bg-gray-400 rounded-full mr-1" />할일: 0</span>
          <span className="flex items-center"><span className="w-3 h-3 bg-blue-400 rounded-full mr-1" />진행중: 0</span>
          <span className="flex items-center"><span className="w-3 h-3 bg-yellow-400 rounded-full mr-1" />대기: 0</span>
          <span className="flex items-center"><span className="w-3 h-3 bg-green-400 rounded-full mr-1" />완료: 0</span>
        </div>
        <p className="text-sm text-gray-500 mt-4">업무를 추가하여 프로젝트를 시작하세요.</p>
      </div>
    </DashboardCard>
    <DashboardCard title="개인 상태 개요" icon={<FaUser className="text-pink-400 text-3xl" />}>
      <div className="flex flex-col items-center">
        <div className="w-24 h-24 rounded-full border-8 border-gray-200 flex items-center justify-center text-xl font-bold text-gray-700 mb-2">
          0
        </div>
        <div className="flex flex-wrap justify-center gap-x-2 text-xs mt-2">
          <span className="flex items-center"><span className="w-3 h-3 bg-gray-400 rounded-full mr-1" />할일: 0</span>
          <span className="flex items-center"><span className="w-3 h-3 bg-blue-400 rounded-full mr-1" />진행중: 0</span>
          <span className="flex items-center"><span className="w-3 h-3 bg-yellow-400 rounded-full mr-1" />대기: 0</span>
          <span className="flex items-center"><span className="w-3 h-3 bg-green-400 rounded-full mr-1" />완료: 0</span>
        </div>
      </div>
    </DashboardCard>
    <DashboardCard title="최근 활동" icon={<FaList className="text-yellow-400 text-3xl" />}>
        <p className="text-sm text-gray-500 mt-2">프로젝트 활동이 여기에 표시됩니다.</p>
    </DashboardCard>
    <DashboardCard title="태그 유형" icon={<FaTags className="text-gray-400 text-3xl" />}>
        <p className="text-sm text-gray-500 mt-2">태그가 없습니다.</p>
    </DashboardCard>
    <DashboardCard title="팀 워크로드" icon={<FaUsers className="text-blue-400 text-3xl" />}>
        <p className="text-sm text-gray-500 mt-2">담당자가 지정된 업무가 없습니다.</p>
    </DashboardCard>
    <DashboardCard title="상위 업무 진행률" icon={<FaTasks className="text-yellow-400 text-3xl" />}>
        <p className="text-sm text-gray-500 text-center mt-2">상위 업무가 없습니다.</p>
    </DashboardCard>
  </div>
);

// 실제 데이터를 표시하는 컴포넌트
const RealDashboard = ({ data }) => {
    const { status_overview, personal_overview, recent_activities, tag_usage, team_workload, parent_task_progress } = data;

    // 도넛 차트 스타일 계산 함수 (4가지 상태)
    const getDonutStyle = (overview) => {
        const total = overview.total_tasks;
        if (total === 0) return { background: '#e5e7eb' }; // gray-200

        const todo_deg = (overview.todo / total) * 360;
        const in_progress_deg = (overview.in_progress / total) * 360;
        const pending_deg = (overview.pending / total) * 360;
        const complete_deg = (overview.complete / total) * 360;

        let current_deg = 0;
        const todo_end = current_deg + todo_deg;
        current_deg = todo_end;
        const in_progress_end = current_deg + in_progress_deg;
        current_deg = in_progress_end;
        const pending_end = current_deg + pending_deg;
        current_deg = pending_end;
        const complete_end = current_deg + complete_deg;

        return {
            background: `conic-gradient(
                #6b7280 0deg ${todo_end}deg,
                #3b82f6 ${todo_end}deg ${in_progress_end}deg,
                #f59e0b ${in_progress_end}deg ${pending_end}deg,
                #10b981 ${pending_end}deg 360deg
            )`
        };
    };

    // 상태별 진행바 컴포넌트
    const StatusProgressBar = ({ data, total }) => {
        if (total === 0) return <div className="w-full h-3 bg-gray-200 rounded" />;
        
        const todoPercent = (data.todo / total) * 100;
        const inProgressPercent = (data.in_progress / total) * 100;
        const pendingPercent = (data.pending / total) * 100;
        const completePercent = (data.complete / total) * 100;
        
        return (
            <div className="w-full h-3 bg-gray-200 rounded overflow-hidden flex">
                {todoPercent > 0 && <div className="h-full bg-gray-400" style={{width: `${todoPercent}%`}} />}
                {inProgressPercent > 0 && <div className="h-full bg-blue-400" style={{width: `${inProgressPercent}%`}} />}
                {pendingPercent > 0 && <div className="h-full bg-yellow-400" style={{width: `${pendingPercent}%`}} />}
                {completePercent > 0 && <div className="h-full bg-green-400" style={{width: `${completePercent}%`}} />}
            </div>
        );
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <DashboardCard title="전체 상태 개요" icon={<FaChartPie className="text-pink-400 text-3xl" />}>
                <div className="flex flex-col items-center">
                    <div style={getDonutStyle(status_overview)} className="w-32 h-32 rounded-full flex items-center justify-center text-2xl font-bold text-gray-700 mb-2">
                        <div className="bg-white w-24 h-24 rounded-full flex items-center justify-center">{status_overview.total_tasks}</div>
                    </div>
                    <div className="flex flex-wrap justify-center gap-x-2 text-xs mt-2">
                        <span className="flex items-center"><span className="w-3 h-3 bg-gray-400 rounded-full mr-1" />할일: {status_overview.todo}</span>
                        <span className="flex items-center"><span className="w-3 h-3 bg-blue-400 rounded-full mr-1" />진행중: {status_overview.in_progress}</span>
                        <span className="flex items-center"><span className="w-3 h-3 bg-yellow-400 rounded-full mr-1" />대기: {status_overview.pending}</span>
                        <span className="flex items-center"><span className="w-3 h-3 bg-green-400 rounded-full mr-1" />완료: {status_overview.complete}</span>
                    </div>
                </div>
            </DashboardCard>
            <DashboardCard title="개인 상태 개요" icon={<FaUser className="text-pink-400 text-3xl" />}>
                <div className="flex flex-col items-center">
                    <div style={getDonutStyle(personal_overview)} className="w-24 h-24 rounded-full flex items-center justify-center text-xl font-bold text-gray-700 mb-2">
                         <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center">{personal_overview.total_tasks}</div>
                    </div>
                    <div className="flex flex-wrap justify-center gap-x-2 text-xs mt-2">
                        <span className="flex items-center"><span className="w-3 h-3 bg-gray-400 rounded-full mr-1" />할일: {personal_overview.todo}</span>
                        <span className="flex items-center"><span className="w-3 h-3 bg-blue-400 rounded-full mr-1" />진행중: {personal_overview.in_progress}</span>
                        <span className="flex items-center"><span className="w-3 h-3 bg-yellow-400 rounded-full mr-1" />대기: {personal_overview.pending}</span>
                        <span className="flex items-center"><span className="w-3 h-3 bg-green-400 rounded-full mr-1" />완료: {personal_overview.complete}</span>
                    </div>
                </div>
            </DashboardCard>
            <DashboardCard title="최근 활동" icon={<FaList className="text-yellow-400 text-3xl" />}>
                <div className="space-y-2 mt-2 max-h-32 overflow-y-auto">
                    {recent_activities.length > 0 ? (
                        recent_activities.map((act, index) => (
                            <div key={index} className="flex items-start space-x-2 text-xs">
                                <div className="w-2 h-2 bg-yellow-400 rounded-full mt-1 flex-shrink-0"></div>
                                <div className="flex-1">
                                    <p className="text-gray-700">{act.message}</p>
                                    <p className="text-gray-400 text-xs">
                                        {new Date(act.created_at).toLocaleDateString('ko-KR', {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-gray-500">최근 활동이 없습니다.</p>
                    )}
                </div>
            </DashboardCard>
            <DashboardCard title="태그 유형" icon={<FaTags className="text-gray-400 text-3xl" />}>
                <div className="space-y-3 mt-2">
                    {tag_usage.length > 0 ? tag_usage.map(tag => (
                        <div key={tag.tag_name}>
                             <div className="flex justify-between text-xs mb-1"><span>{tag.tag_name}</span><span>{tag.total_count}개</span></div>
                             <StatusProgressBar data={tag} total={tag.total_count} />
                             <div className="flex justify-between text-xs mt-1">
                                <span className="text-gray-600">할일: {tag.todo}</span>
                                <span className="text-blue-600">진행: {tag.in_progress}</span>
                                <span className="text-yellow-600">대기: {tag.pending}</span>
                                <span className="text-green-600">완료: {tag.complete}</span>
                             </div>
                        </div>
                    )) : <p className="text-sm text-gray-500">태그가 없습니다.</p>}
                </div>
            </DashboardCard>
            <DashboardCard title="팀 워크로드" icon={<FaUsers className="text-blue-400 text-3xl" />}>
                <div className="space-y-3 mt-2 text-xs">
                     {team_workload.length > 0 ? team_workload.map(member => (
                        <div key={member.member_name}>
                            <div className="flex justify-between mb-1"><span>{member.member_name}</span><span>{member.total_count}개</span></div>
                            <StatusProgressBar data={member} total={member.total_count} />
                            <div className="flex justify-between mt-1">
                                <span className="text-gray-600">할일: {member.todo}</span>
                                <span className="text-blue-600">진행: {member.in_progress}</span>
                                <span className="text-yellow-600">대기: {member.pending}</span>
                                <span className="text-green-600">완료: {member.complete}</span>
                            </div>
                        </div>
                     )) : <p className="text-sm text-gray-500">담당자가 지정된 업무가 없습니다.</p>}
                </div>
            </DashboardCard>
            <DashboardCard title="상위 업무 진행률" icon={<FaTasks className="text-yellow-400 text-3xl" />}>
                <div className="space-y-3 mt-2">
                    {parent_task_progress.length > 0 ? parent_task_progress.map(parentTask => (
                        <div key={parentTask.parent_task_name}>
                             <div className="flex justify-between text-xs mb-1">
                                <span className="truncate max-w-32" title={parentTask.parent_task_name}>
                                    {parentTask.parent_task_name}
                                </span>
                                <span>{parentTask.total_count}개</span>
                             </div>
                             <StatusProgressBar data={parentTask} total={parentTask.total_count} />
                             <div className="flex justify-between text-xs mt-1">
                                <span className="text-gray-600">할일: {parentTask.todo}</span>
                                <span className="text-blue-600">진행: {parentTask.in_progress}</span>
                                <span className="text-yellow-600">대기: {parentTask.pending}</span>
                                <span className="text-green-600">완료: {parentTask.complete}</span>
                             </div>
                        </div>
                    )) : <p className="text-sm text-gray-500 text-center">상위 업무가 없습니다.</p>}
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