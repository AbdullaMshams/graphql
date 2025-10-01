import React from 'react';

// --- Level Rank Definitions ---
const RANKS = [
  { level: 0, name: "Aspiring developer", color: "#60A5FA" },
  { level: 10, name: "Beginner developer", color: "#34D399" },
  { level: 20, name: "Apprentice developer", color: "#FBBF24" },
  { level: 30, name: "Assistant developer", color: "#F87171" },
  { level: 40, name: "Basic developer", color: "#A78BFA" },
  { level: 50, name: "Junior developer", color: "#F472B6" },
  { level: 55, name: "Confirmed developer", color: "#7DD3FC" },
  { level: 60, name: "Confirmed developer", color: "#06B6D4" },
];


export default function LevelProgress({ currentLevel }) {
  // 1. Find the current and next rank thresholds (IMPROVED LOGIC)
  
  // Find the highest rank the user has achieved (level <= currentLevel)
  const currentRank = RANKS.reduce((bestRank, current) => {
    return current.level <= currentLevel && current.level > bestRank.level
      ? current 
      : bestRank;
  }, { level: -1, name: "Unranked" }); // Start with a safe, low default rank

  // Find the next rank the user is progressing toward (level > currentLevel)
  // We filter to only include ranks higher than the current one, sort them by level, and pick the lowest one.
  const nextRank = RANKS
    .filter(rank => rank.level > currentLevel)
    .sort((a, b) => a.level - b.level)[0] || {
    level: 999, // Represents the maximum possible rank if no higher rank is found
    name: "Master Developer",
    color: "#84cc16"
  };

  // 2. Calculate Progress
  const startLevel = currentRank.level;
  const endLevel = nextRank.level;
  const totalSpan = endLevel - startLevel;
  const levelProgress = currentLevel - startLevel;

  // Progress ratio from 0 to 1 (clamped between 0 and 1 for safety)
  let progressRatio = 0;
  if (totalSpan > 0) {
    progressRatio = levelProgress / totalSpan;
  } else if (currentLevel >= endLevel) {
    progressRatio = 1; // Already reached max level / next rank
  }
  
  // 3. SVG Math for Semi-Circle
  const r = 50; // Radius
  const strokeWidth = 10;
  const semiCircumference = Math.PI * r; 
  const filledLength = progressRatio * semiCircumference;
  const pathD = `M 0,${r} a ${r},${r} 0 0 1 ${r * 2},0`;


return (
  <div className="bg-gray-900 rounded-2xl shadow-lg p-6 flex flex-col items-center ">
    {/* Semi-Circle Progress */}
    <div className="relative">
      <svg
        className="w-full h-full transform origin-center"
        viewBox="0 0 100 55"
      >
        {/* Base Track (Unfilled) */}
        <path
          d={pathD}
          fill="none"
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={strokeWidth}
        />

        {/* Progress Bar (Filled) */}
        <path
          d={pathD}
          fill="none"
          stroke={currentRank.color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${filledLength} ${semiCircumference}`}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out drop-shadow-[0_0_6px_rgba(0,0,0,0.6)]"
        />
      </svg>

      {/* Level Number in the Center */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[45%] text-center">
        <span className="text-4xl font-extrabold text-white drop-shadow-sm">
          {currentLevel}
        </span>
      </div>
    </div>

    {/* Rank Name and Progress Text */}
    <div className="mt-3 text-center">
      <h3
        className="text-lg font-semibold"
        style={{ color: currentRank.color }}
      >
        {currentRank.name}
      </h3>
      <p className="text-sm text-gray-400">
        {endLevel === 999
          ? "Max rank achieved!"
          : `${nextRank.level - currentLevel} levels to ${nextRank.name}`}
      </p>
    </div>
  </div>
);

};