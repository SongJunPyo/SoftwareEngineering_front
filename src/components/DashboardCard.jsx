 // src/components/DashboardCard.jsx
import React from "react";



// src/components/DashboardCard.jsx
export default function DashboardCard({ title, description }) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition-all">
      <h2 className="text-xl font-bold mb-2">{title}</h2>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

