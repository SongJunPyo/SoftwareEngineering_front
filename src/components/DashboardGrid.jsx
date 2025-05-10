import DashboardCard from "./DashboardCard";

const cards = [
  { title: "전체 상태 개요", description: "모든 업무에 대한 상태를 확인합니다." },
  { title: "최근 활동", description: "프로젝트 전반에서 일어나는 최신 정보" },
  { title: "개인 상태 개요", description: "개인이 할당받은 업무의 상태를 확인합니다." },
  { title: "태그 유형", description: "유형별로 업무의 분석 결과를 확인합니다." },
  { title: "팀 워크로드", description: "모든 팀원의 작업 수용량을 모니터링합니다." },
  { title: "상위 업무 진행률", description: "전체 상위 업무의 진행률을 확인합니다." },
];

export default function DashboardGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-2 gap-6 p-4">
      {cards.map((card, index) => (
        <DashboardCard key={index} title={card.title} description={card.description} />
      ))}
    </div>
  );
}
