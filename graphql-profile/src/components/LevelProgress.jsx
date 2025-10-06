import React from 'react';

// --- Level Rank Definitions ---
const RANKS = [
  { level: 0, name: "Aspiring developer", color: "#60A5FA", gradient: "from-blue-400 to-blue-500" },
  { level: 10, name: "Beginner developer", color: "#34D399", gradient: "from-emerald-400 to-emerald-500" },
  { level: 20, name: "Apprentice developer", color: "#FBBF24", gradient: "from-amber-400 to-amber-500" },
  { level: 30, name: "Assistant developer", color: "#F87171", gradient: "from-red-400 to-red-500" },
  { level: 40, name: "Basic developer", color: "#A78BFA", gradient: "from-purple-400 to-purple-500" },
  { level: 50, name: "Junior developer", color: "#F472B6", gradient: "from-pink-400 to-pink-500" },
  { level: 55, name: "Confirmed developer", color: "#7DD3FC", gradient: "from-sky-300 to-sky-400" },
  { level: 60, name: "Confirmed developer", color: "#06B6D4", gradient: "from-cyan-500 to-cyan-600" },
];

export default function LevelProgress({ currentLevel }) {
  // Find the current and next rank thresholds
  const currentRank = RANKS.reduce((bestRank, current) => {
    return current.level <= currentLevel && current.level > bestRank.level
      ? current 
      : bestRank;
  }, { level: -1, name: "Unranked", color: "#6B7280", gradient: "from-gray-500 to-gray-600" });

  const nextRank = RANKS
    .filter(rank => rank.level > currentLevel)
    .sort((a, b) => a.level - b.level)[0] || {
    level: 999,
    name: "Master Developer",
    color: "#84cc16",
    gradient: "from-lime-500 to-lime-600"
  };

  // Calculate Progress
  const startLevel = currentRank.level;
  const endLevel = nextRank.level;
  const totalSpan = endLevel - startLevel;
  const levelProgress = currentLevel - startLevel;

  let progressRatio = 0;
  if (totalSpan > 0) {
    progressRatio = levelProgress / totalSpan;
  } else if (currentLevel >= endLevel) {
    progressRatio = 1;
  }
  
  // SVG Math for Semi-Circle
  const r = 55;
  const strokeWidth = 12;
  const semiCircumference = Math.PI * r; 
  const filledLength = progressRatio * semiCircumference;
  const pathD = `M 5,${r} a ${r},${r} 0 0 1 ${r * 2},0`;

  return (
    <div className="w-full flex flex-col items-center justify-center relative">
      {/* Glow Effect Behind Circle */}
      <div 
        className="absolute top-6 w-40 h-20 blur-3xl opacity-20 rounded-full pointer-events-none"
        style={{ backgroundColor: currentRank.color }}
      />
      
      {/* Semi-Circle Progress */}
      <div className="relative mb-3" style={{ width: '160px', height: '180px' }}>
        <svg
          className="w-full h-full"
          viewBox="-5 -5 130 80"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={currentRank.color} stopOpacity="0.6" />
              <stop offset="50%" stopColor={currentRank.color} stopOpacity="1" />
              <stop offset="100%" stopColor={currentRank.color} stopOpacity="0.8" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Base Track (Unfilled) */}
          <path
            d={pathD}
            fill="none"
            stroke="rgba(255, 255, 255, 0.06)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Progress Bar (Filled) */}
          <path
            d={pathD}
            fill="none"
            stroke="url(#progressGradient)"
            strokeWidth={strokeWidth}
            strokeDasharray={`${filledLength} ${semiCircumference}`}
            strokeLinecap="round"
            filter="url(#glow)"
            className="transition-all duration-1000 ease-out"
            style={{
              filter: `drop-shadow(0 0 8px ${currentRank.color})`
            }}
          />
          
          {/* Animated Endpoint Dot */}
          
        </svg>

        {/* Level Number in the Center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 text-center" style={{ marginTop: '-8px' }}>
          <div className="relative">
            <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-300 drop-shadow-lg tracking-tight leading-none">
              {currentLevel}
            </span>
            <div className="text-[10px] font-semibold text-gray-400 mt-0.5 tracking-widest uppercase">
              Level
            </div>
          </div>
        </div>
      </div>

      {/* Rank Name and Progress */}
      </div>
  );
}