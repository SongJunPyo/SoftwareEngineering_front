import DashboardCard from "./DashboardCard";
import { FaChartPie, FaUser, FaList, FaTags, FaUsers, FaTasks } from "react-icons/fa";

export default function DashboardGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <DashboardCard title="전체 상태 개요" icon={<FaChartPie className="text-pink-400 text-3xl" />}>
        {/* 도넛 차트 샘플 */}
        <div className="flex flex-col items-center">
          <div className="w-32 h-32 rounded-full border-8 border-pink-400 border-t-orange-400 border-b-blue-400 flex items-center justify-center text-2xl font-bold text-gray-700 mb-2">
            15
          </div>
          <div className="flex space-x-4 text-xs mt-2">
            <span className="flex items-center"><span className="w-3 h-3 bg-pink-400 rounded-full mr-1" />해야 할 일: 12</span>
            <span className="flex items-center"><span className="w-3 h-3 bg-orange-400 rounded-full mr-1" />진행 중: 1</span>
            <span className="flex items-center"><span className="w-3 h-3 bg-blue-400 rounded-full mr-1" />완료: 2</span>
          </div>
        </div>
      </DashboardCard>
      <DashboardCard title="개인 상태 개요" icon={<FaUser className="text-pink-400 text-3xl" />}>
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 rounded-full border-8 border-pink-400 border-t-orange-400 flex items-center justify-center text-xl font-bold text-gray-700 mb-2">
            5
          </div>
          <div className="flex space-x-4 text-xs mt-2">
            <span className="flex items-center"><span className="w-3 h-3 bg-pink-400 rounded-full mr-1" />해야 할 일: 4</span>
            <span className="flex items-center"><span className="w-3 h-3 bg-orange-400 rounded-full mr-1" />진행 중: 1</span>
            <span className="flex items-center"><span className="w-3 h-3 bg-blue-400 rounded-full mr-1" />완료: 0</span>
          </div>
        </div>
      </DashboardCard>
      <DashboardCard title="최근 활동" icon={<FaList className="text-yellow-400 text-3xl" />}>
        <ul className="text-sm text-gray-600 space-y-1 mt-2">
          <li>업무1이 완료되었습니다.</li>
          <li>새로운 태스크가 추가되었습니다.</li>
          <li>팀원이 초대되었습니다.</li>
        </ul>
      </DashboardCard>
      <DashboardCard title="태그 유형" icon={<FaTags className="text-gray-400 text-3xl" />}>
        <div className="space-y-2 mt-2">
          <div className="flex justify-between text-xs"><span>마케팅</span><span>73%</span></div>
          <div className="w-full h-2 bg-gray-200 rounded"><div className="h-2 bg-gray-400 rounded" style={{width:'73%'}} /></div>
          <div className="flex justify-between text-xs"><span>개발</span><span>50%</span></div>
          <div className="w-full h-2 bg-blue-200 rounded"><div className="h-2 bg-blue-400 rounded" style={{width:'50%'}} /></div>
        </div>
      </DashboardCard>
      <DashboardCard title="팀 워크로드" icon={<FaUsers className="text-blue-400 text-3xl" />}>
        <div className="space-y-2 mt-2 text-xs">
          <div className="flex justify-between"><span>홍길동</span><span>53%</span></div>
          <div className="w-full h-2 bg-gray-200 rounded"><div className="h-2 bg-pink-400 rounded" style={{width:'53%'}} /></div>
          <div className="flex justify-between"><span>송표</span><span>33%</span></div>
          <div className="w-full h-2 bg-gray-200 rounded"><div className="h-2 bg-orange-400 rounded" style={{width:'33%'}} /></div>
        </div>
      </DashboardCard>
      <DashboardCard title="상위 업무 진행률" icon={<FaTasks className="text-yellow-400 text-3xl" />}>
        <div className="flex flex-col items-center mt-2">
          <div className="w-20 h-20 rounded-full border-8 border-yellow-400 flex items-center justify-center text-lg font-bold text-gray-700 mb-2">
            80%
          </div>
          <span className="text-xs text-gray-500">상위 업무의 진행률</span>
        </div>
      </DashboardCard>
    </div>
  );
}
