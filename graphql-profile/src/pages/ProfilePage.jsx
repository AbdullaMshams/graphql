// ProfilePage.jsx - CLEANED VERSION

import React, { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { useNavigate } from "react-router-dom";

// --- Custom Imports (New Structure) ---
import useProfileData from "../hooks/useProfileData.js";
import LoadingOverlay from "../components/LoadingOverlay";
import WelcomeOverlay from "../components/WelcomeOverlay";
import CustomXpTooltip from "../components/CustomXpTooltip";

// Existing Component Imports
import DragToLogout from "../components/DragToLogout";
import { HeroGeometric } from "../components/ui/shadcn-io/shape-landing-hero/index";
import SpotlightCard from "../components/SpotlightCard";
import AuditRadialChart from "../components/AuditStackedBarChart";
import AnimatedList from "../components/AnimatedList";
import { SlidingNumber } from "../components/ui/shadcn-io/sliding-number";
import LevelProgress from "../components/LevelProgress";

export default function ProfilePage({onAuthChange}) {
  const { data, error, isFetching, showWelcome, progress } = useProfileData();
  const navigate = useNavigate();

  // State to control the exit animation
  const [isExiting, setIsExiting] = useState(false);

  // --- Theme Constants ---
  const CARD_BG = "#212122";
  const ACCENT_GREEN = "#c9f24d";
  const DEFAULT_SPOTLIGHT_COLOR = `rgba(201, 242, 77, 0.1)`;
  const LOGOUT_SPOTLIGHT_COLOR = "rgba(255, 0, 0, 0.2)";

  const cardClass = `
    bg-[${CARD_BG}] 
    rounded-2xl 
    shadow-lg 
    transition-all duration-300 ease-in-out 
    hover:translate-y-[-2px] 
    hover:shadow-xl 
    flex flex-col 
    p-6 
    text-white
  `;

  // Function to handle the smooth logout transition
  const handleLogout = () => {
    // 1. Set state to trigger the fade-out animation
    
    setIsExiting(true);
    // 2. Wait 500ms for the animation to complete
    setTimeout(() => {
      // 3. Clear token and navigate
      localStorage.removeItem("JWT");
      if (onAuthChange) onAuthChange();
      // navigate("/login");
      
    }, 500); // Must match the duration-500 class below
  };


  if (error)
    return (
      <div className="text-red-500 text-center text-xl mt-20">{error}</div>
    );

  if (!data && !isFetching) return null;

  return (
    // APPLY FADE-OUT TRANSITION TO THE ROOT DIV
    <div
      className={`
            relative min-h-screen overflow-hidden 
            transition-opacity duration-500 ease-in-out 
            ${isExiting ? 'opacity-0' : 'opacity-100'}
        `}
    >
      <HeroGeometric className="absolute inset-0 z-0" />

      {/* 1. Loading Overlay */}
      <LoadingOverlay isFetching={isFetching} progress={progress} />

      {/* 2. Welcome Overlay */}
      {data && (
        <WelcomeOverlay showWelcome={showWelcome} username={data.username} />
      )}

      {/* Foreground content - Dashboard Grid */}
      {data && (
        <div className="relative z-10 flex items-center justify-center min-h-screen px-6 py-12">
          {/* Grid Definition */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-5 auto-rows-[170px] gap-6 max-w-7xl w-full">
            {/* Row 1: Header/Welcome Banner */}
            <div className="col-span-full items-start row-span-1 flex flex-col justify-center px-4 pt-4 pb-2">
              <div className="flex items-center justify-between w-full">
                <div>
                  <h3 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-2 pt-5 tracking-wide">
                    Welcome, {data.name}
                  </h3>
                  <h5 className="text-2xl text-gray-400">{data.username}</h5>
                </div>
                <span
                  className={`px-3 py-1 text-sm font-semibold rounded-full`}
                  style={{
                    backgroundColor: "rgba(201, 242, 77, 0.1)",
                    color: ACCENT_GREEN,
                  }}
                >
                  {data.cohort}
                </span>
              </div>
            </div>

            {/* Row 2, Col 1-2: LEVEL PROGRESS */}
            <SpotlightCard
              className={`flex col-span-full sm:col-span-2 xl:col-span-2 row-span-1 gap-30 justify-center items-center`}
              spotlightColor={DEFAULT_SPOTLIGHT_COLOR}
            >
              <LevelProgress
                currentLevel={data.level}
                accentColor={ACCENT_GREEN}
              />
            </SpotlightCard>

            {/* Current Project Card */}
            <SpotlightCard
              className={`${cardClass} col-span-full sm:col-span-1 row-span-1 items-start justify-start`}
              spotlightColor={DEFAULT_SPOTLIGHT_COLOR}
            >
              <div className="text-sm text-gray-400 mb-1">Current Project</div>
              <div className="flex flex-1 w-full justify-center items-center">
                <span className="text-xl font-bold text-white text-center">
                  {data.currentProject}
                </span>
              </div>
            </SpotlightCard>

            {/* Audit Ratio Card */}
            <SpotlightCard
              className={`${cardClass} col-span-full sm:col-span-3 xl:col-span-2 row-span-1 flex-col justify-between items-start z-5000`}
              spotlightColor={DEFAULT_SPOTLIGHT_COLOR}
            >
              <div className="text-sm text-gray-400 mb-3 ">Audit Ratio</div>
              <div className="h-[150px] w-full">
                <AuditRadialChart
                  auditChartData={data.auditChart}
                  accentColor={ACCENT_GREEN}
                />
              </div>
            </SpotlightCard>

            {/* XP Progression Card */}
            <SpotlightCard
              className={`${cardClass} col-span-full sm:col-span-2 lg:col-span-2 xl:col-span-2 row-span-1 flex-col h-full items-start justify-start`}
              spotlightColor={DEFAULT_SPOTLIGHT_COLOR}
            >
              <div className="flex flex-1 w-full gap-4 items-center">
                <div className="bg-[#c9f24d] p-4 rounded-xl flex flex-col items-start justify-center h-full  min-w-[120px]">
                  <SlidingNumber
                    className="text-6xl font-bold text-[#212122]"
                    number={data.totalXp}
                    inView={true}
                    decimalPlaces={0}
                    transition={{ stiffness: 50, damping: 10 }}
                  />
                </div>

                <div className="flex-1 h-full w-4/4 -mt-2">
                  <h3 className="text-sm text-gray-400 mb-1">
                    XP Progression
                  </h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={data.xpSeries}
                      margin={{ top: 5, right: 10, left: -40, bottom: 20 }}
                    >
                      <defs>
                        <linearGradient id="xpGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="0%"
                            stopColor={ACCENT_GREEN}
                            stopOpacity={0.6}
                          />
                          <stop
                            offset="100%"
                            stopColor={ACCENT_GREEN}
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" hide />
                      <YAxis tick={false} axisLine={false} tickLine={false} />
                      <CartesianGrid
                        stroke="rgba(255,255,255,0.06)"
                        vertical={false}
                        strokeDasharray="3 3"
                      />
                      <Tooltip
                        cursor={{ stroke: ACCENT_GREEN, strokeWidth: 1 }}
                        content={<CustomXpTooltip ACCENT_GREEN={ACCENT_GREEN} />}
                      />
                      <Area
                        type="monotone"
                        dataKey="xp"
                        stroke={ACCENT_GREEN}
                        fill="url(#xpGrad)"
                        strokeWidth={3}
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </SpotlightCard>

            {/* Member Since Card */}
            <SpotlightCard
              className={`${cardClass} col-span-full sm:col-span-1 row-span-1 items-start justify-start`}
              spotlightColor={DEFAULT_SPOTLIGHT_COLOR}
            >
              <span className="text-sm text-gray-400 mb-1">Member Since</span>
              <div className="flex flex-col flex-1 w-full justify-center items-center">
                <span className="text-2xl font-bold text-white text-center">
                  {data.dateJoined.toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                <span className="text-xs text-gray-500 mt-1 text-center">
                  {Math.floor(
                    (new Date() - data.dateJoined) / (1000 * 60 * 60 * 24)
                  )}{" "}
                  days
                </span>
              </div>
            </SpotlightCard>

            {/* Pending Audits List Card */}
            <SpotlightCard
              className={`${cardClass} col-span-full sm:col-span-3 xl:col-span-2 row-span-2 flex-col items-start z-10`}
              spotlightColor={DEFAULT_SPOTLIGHT_COLOR}
            >
              <h4 className="text-sm text-gray-400 mb-3">
                Pending Audits
                {data?.pendingAudits
                  ? ` (${data.pendingAudits.length})`
                  : " (0)"}
              </h4>
              <div
                className="flex flex-col flex-1 w-full overflow-auto [&::-webkit-scrollbar]:hidden"
                style={{ scrollbarWidth: "none" }}
              >
                {data?.pendingAudits && data.pendingAudits.length > 0 ? (
                  <AnimatedList
                    items={data.pendingAudits}
                    renderItem={(audit) => (
                      <div
                        key={audit.id}
                        className={`p-4 rounded-lg border border-gray-700/50 transition 'bg-gray-800/70 '}`}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex  flex-col">
                            <p className="text-base font-medium text-white truncate">
                              {audit.group?.object?.name || "Unknown Project"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {" "}
                              {audit.group?.captainLogin || "N/A"}
                            </p>
                          </div>
                          {audit.private?.code && (
                            <p className="text-xs text-[#c9f24d] font-mono mt-1 truncate">
                              Code: {audit.private.code}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    className="w-full"
                    displayScrollbar={false}
                  />
                ) : (
                  <p className="text-gray-500 text-sm text-center mt-4">
                    No open audits found. Great job! 🎉
                  </p>
                )}
              </div>
            </SpotlightCard>

            {/* Recent XP Transactions Card */}
            <SpotlightCard
              className={`${cardClass} col-span-full sm:col-span-3 lg:col-span-3 row-span-2 flex-col items-start`}
              spotlightColor={DEFAULT_SPOTLIGHT_COLOR}
            >
              <h3 className="text-sm text-gray-400 mb-3">
                Recent Transactions
              </h3>
              <AnimatedList
                items={data.transactions.filter((tx) => tx.type === "xp")}
                renderItem={(tx, index, selectedIndex) => {
                  let amountText;
                  let amountColor;
                  let description;

                  if (tx.type === "xp") {
                    amountText = `+${(tx.amount / 1000).toFixed(1)}k`;
                    amountColor = ACCENT_GREEN;
                    description = "Experience";
                  } else if (tx.type === "up") {
                    amountText = `+${(tx.amount / 1000).toFixed(1)}k`;
                    amountColor = "#38bdf8";
                    description = "Audit Done (Up)";
                  } else if (tx.type === "down") {
                    amountText = `-${(tx.amount / 1000).toFixed(1)}k`;
                    amountColor = "#f87171";
                    description = "Audit Received (Down)";
                  }

                  return (
                    <li
                      key={tx.id}
                      className={`flex justify-between items-center pb-2 transition duration-150 ease-in-out
                                 border-b ${
                                   selectedIndex === index
                                     ? "border-gray-700/50"
                                     : "border-gray-700/50"
                                 }`}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium text-white text-ellipsis whitespace-nowrap max-w-[180px]">
                          {tx.object?.name ||
                            `${tx.type.toUpperCase()} Transaction`}
                        </span>
                        <span className="text-xs text-gray-400 capitalize">
                          {description}
                        </span>
                      </div>
                      <div className="text-right">
                        <span
                          className={`text-lg font-bold`}
                          style={{ color: amountColor }}
                        >
                          {amountText}
                        </span>
                        <div className="text-xs text-gray-500">
                          {new Date(tx.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                      </div>
                    </li>
                  );
                }}
                className="w-full space-y-3 overflow-y-auto [&::-webkit-scrollbar]:hidden scroll-smooth"
                displayScrollbar={false}
              />
            </SpotlightCard>

            {/* DRAG TO LOGOUT */}
            <SpotlightCard
              className={`${cardClass} col-span-full sm:col-span-2 md:col-span-2 lg:col-span-3  xl:col-span-2 row-span-1 items-center justify-center`}
              spotlightColor={LOGOUT_SPOTLIGHT_COLOR}
            >
              <DragToLogout
                onLogout={handleLogout}
              />
            </SpotlightCard>
          </div>
        </div>
      )}
    </div>
  );
}