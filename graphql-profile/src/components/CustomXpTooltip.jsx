// components/CustomXpTooltip.jsx
import React from "react";

const CustomXpTooltip = ({ active, payload, label, ACCENT_GREEN }) => {
  if (active && payload && payload.length) {
    const xpValue = payload[0].value;
    const formattedDate = new Date(label).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    return (
      <div className="bg-gray-800/95 border border-gray-700 rounded-lg p-3 shadow-xl backdrop-blur-sm">
        <p className="text-gray-400 text-xs mb-1">{formattedDate}</p>
        <div className="flex items-center justify-between gap-4">
          <span className={`text-[${ACCENT_GREEN}] text-sm font-semibold`}>
            XP Gained
          </span>
          <span className="text-white font-bold">{xpValue.toFixed(2)}k</span>
        </div>
      </div>
    );
  }
  return null;
};

export default CustomXpTooltip;