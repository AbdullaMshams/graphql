import React from "react";

export const ProfileGrid = ({ children, cols = 4, gap = "1.5rem" }) => {
  return (
    <div
      className="grid"
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        gap: gap,
      }}
    >
      {children}
    </div>
  );
};

export const ProfileCard = ({ title, value, description, colSpan = 1, rowSpan = 1 }) => {
  return (
    <div
      className="rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 p-6 shadow-md hover:shadow-lg transition"
      style={{
        gridColumn: `span ${colSpan} / span ${colSpan}`,
        gridRow: `span ${rowSpan} / span ${rowSpan}`,
      }}
    >
      <h3 className="text-sm text-gray-400 mb-1">{title}</h3>
      <p className="text-2xl font-bold text-white">{value}</p>
      {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
    </div>
  );
};
