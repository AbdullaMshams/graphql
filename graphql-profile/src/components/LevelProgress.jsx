import React from 'react';

// NOTE: The ProfilePage is now passing the ACCENT_GREEN color via a prop.
// We should define the fallback or primary colors here, but prioritize the prop.

// --- Level Rank Definitions ---
// We'll update the colors to be slightly more vibrant or use hex codes directly
const RANKS = [
  { level: 0, name: "Aspiring developer", color: "#C9F24D", gradient: "from-blue-400 to-blue-500" },
  { level: 10, name: "Beginner developer", color: "#C9F24D", gradient: "from-emerald-400 to-emerald-500" },
  { level: 20, name: "Apprentice developer", color: "#C9F24D", gradient: "from-amber-400 to-amber-500" },
  { level: 30, name: "Assistant developer", color: "#C9F24D", gradient: "from-red-400 to-red-500" },
  { level: 40, name: "Basic developer", color: "#C9F24D", gradient: "from-purple-400 to-purple-500" },
  { level: 50, name: "Junior developer", color: "#C9F24D", gradient: "from-pink-400 to-pink-500" },
  { level: 55, name: "Confirmed developer", color: "#C9F24D", gradient: "from-sky-300 to-sky-400" },
  { level: 60, name: "Full-Stack developer", color: "#C9F24D", gradient: "from-cyan-500 to-cyan-600" },
];

// Updated to accept accentColor prop from ProfilePage.jsx
export default function LevelProgress({ currentLevel, accentColor }) {
  // Use the passed accent color as the default/master accent, falling back to a default if not passed.
  const PRIMARY_COLOR = accentColor || '#C9F24D'; 

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
    color: PRIMARY_COLOR, // Use the accent color for the final rank
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
  
  // Use the current rank color for the visuals
  const visualColor = currentRank.color; 
  
  // SVG Math for Semi-Circle
  const r = 55;
  const strokeWidth = 12;
  const semiCircumference = Math.PI * r; 
  const filledLength = progressRatio * semiCircumference;
  const pathD = `M 5,${r} a ${r},${r} 0 0 1 ${r * 2},0`;

  return (
    <div className="w-full flex  items-center gap-5 justify-center relative">
      {/* Glow Effect Behind Circle - UPDATED to use visualColor */}
      {/* <div 
        className="absolute top-6 w-40 h-20 blur-3xl opacity-20 rounded-full pointer-events-none"
        style={{ backgroundColor: visualColor }}
      /> */}
      
      {/* Semi-Circle Progress */}
      <div className="relative mb-3" style={{ width: '160px', height: '180px' }}>
        <svg
          className="w-full h-full"
          viewBox="-5 -5 130 80"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* UPDATED GRADIENT: Use the visualColor */}
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={visualColor} stopOpacity="0.8" />
              <stop offset="50%" stopColor={visualColor} stopOpacity="1" />
              <stop offset="100%" stopColor={visualColor} stopOpacity="0.8" />
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
            stroke="rgba(255, 255, 255, 0.08)" // Slightly brighter track for visibility
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
              // Inline style for drop-shadow using the visualColor
              filter: `drop-shadow(0 0 0px ${visualColor})` 
            }}
          />
        </svg>

        {/* Level Number in the Center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 text-center">
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
      <div className="flex flex-col items-center">
        <span className="text-lg font-semibold text-white mt-1">{currentRank.name}</span>
        {totalSpan > 0 && nextRank.level !== 999 && (
          <span className="text-sm text-gray-400 mt-1">
            {levelProgress}/{totalSpan} levels to {nextRank.name} 
          </span>
        )}
      </div>
    </div>
  );
}