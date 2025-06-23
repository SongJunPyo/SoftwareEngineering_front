 // src/components/DashboardCard.jsx
import React from "react";

export default function DashboardCard({ title, icon, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6 hover:shadow-xl transition-all min-h-[220px] flex flex-col">
      <div className="flex items-center mb-3 space-x-2">
        {icon && <span>{icon}</span>}
        <h2 className="text-lg font-bold">{title}</h2>
      </div>
      <div className="flex-1 flex flex-col justify-center">
        {children}
      </div>
    </div>
  );
}

