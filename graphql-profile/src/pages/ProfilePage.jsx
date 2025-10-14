import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { gqlFetch } from "../services/graphql";
import DragToLogout from "../components/DragToLogout";
import { HeroGeometric } from "../components/ui/shadcn-io/shape-landing-hero/index";
import SpotlightCard from "../components/SpotlightCard";
import AuditRadialChart from "../components/AuditStackedBarChart";
import AnimatedList from "../components/AnimatedList";
import { SlidingNumber } from "../components/ui/shadcn-io/sliding-number";
import BlurText from "../components/BlurText";

import LevelProgress from "../components/LevelProgress";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

// --- MOCKING EXTERNAL DEPENDENCIES ---
// MOCK: Hero UI Progress Component
const Progress = ({ value, className, "aria-label": ariaLabel }) => {
  // Ensure value is clamped between 0 and 100 for visual safety
  const clampedValue = Math.min(Math.max(value, 0), 100);
  return (
    <div
      className={`w-full bg-gray-700/50 rounded-full h-2.5 shadow-inner overflow-hidden ${className}`}
      role="progressbar"
      aria-valuenow={clampedValue}
      aria-valuemin="0"
      aria-valuemax="100"
      aria-label={ariaLabel}
    >
      <div
        className="h-2.5 rounded-full transition-all duration-300 ease-in-out"
        style={{
          width: `${clampedValue}%`,
          // Matching the lime green gradient
          background: ` #c9f24d `,
        }}
      ></div>
    </div>
  );
};
// --- END MOCKING ---

// --- Custom Tooltip Component for XP Progression Chart ---
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
          {/* CRITICAL: Formatting the value to two decimal places */}
          <span className="text-white font-bold">{xpValue.toFixed(2)}k</span>
        </div>
      </div>
    );
  }
  return null;
};
// ---------------------------------------------------------

export default function ProfilePage() {
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const [isFetching, setIsFetching] = useState(true);
  const [username, setUsername] = useState("User");
  const [showWelcome, setShowWelcome] = useState(false);
  const [progress, setProgress] = useState(0); // <--- NEW PROGRESS STATE

  const navigate = useNavigate();

  // --- Queries ---
  const USER_ID_QUERY = `{ user { id login } }`;
  // ... (rest of the queries are unchanged) ...
  const ROOT_EVENT_QUERY = `
    query GetRootEventId($userId: Int!) {
      event_user(
        where: {
          userId: { _eq: $userId }
          event: { parentId: { _is_null: true }, path: { _eq: "/bahrain/bh-module" } }
        }
      ) {
        event { id }
        createdAt
      }
    }
  `;
  const DASHBOARD_QUERY = `
    query DashboardData($userId: Int!, $rootEventId: Int!) {
      user(where: { id: { _eq: $userId } }) {
        id
        login
        firstName
        lastName
        profile
        attrs
        campus
        createdAt
      }
      level: transaction(
        limit: 1
        order_by: { amount: desc }
        where: { userId: { _eq: $userId }, type: { _eq: "level" }, eventId: { _eq: $rootEventId } }
      ) { amount }
      totalUp: transaction_aggregate(where: { userId: { _eq: $userId }, type: { _eq: "up" } }) {
        aggregate { sum { amount } }
      }
      totalDown: transaction_aggregate(where: { userId: { _eq: $userId }, type: { _eq: "down" } }) {
        aggregate { sum { amount } }
      }
      totalXp: transaction_aggregate(
        where: { userId: { _eq: $userId }, type: { _eq: "xp" }, eventId: { _eq: $rootEventId } }
      ) {
        aggregate { sum { amount } }
      }
      cohort: label_user(where: { userId: { _eq: $userId } }, limit: 1) { labelName }
      transactions: transaction(
        where: { userId: { _eq: $userId }, type: { _in: ["xp", "up", "down"] } }
        order_by: { createdAt: desc }
      ) {
        id
        type
        amount
        createdAt
        object { name }
      }
      currentProject: group_user(
        where: { userId: { _eq: $userId }, group: { status: { _eq: working } } }
        limit: 1
      ) {
        group { object { name type } status path }
      }
    }
  `;

  const PENDING_AUDITS_QUERY = `
  query PendingAuditsQuery($auditorId: Int!) {
    audit(
      where: { 
        auditorId: { _eq: $auditorId },
        group: { status: { _eq: audit } }, 
        closedAt: { _is_null: true }
      }
      order_by: { createdAt: desc }
    ) {
      id
      grade
      createdAt
      attrs
      auditorLogin 
      closedAt
       private { 
        code 
      }
      group {
        id
        status
        captainLogin
        object {
          id
          name
          type
        }
      }
    }
  }
`;

  // --- Data Loading Effect (Updated) ---
  useEffect(() => {
    let progressInterval;

    async function loadData() {
      setIsFetching(true);
      setProgress(0); // Start progress bar at 0
      setError(null);
      const token = localStorage.getItem("JWT");
      if (!token) return navigate("/login");

      try {
        // Start the progress bar simulation immediately
        progressInterval = setInterval(() => {
          setProgress((prev) => {
            // Increase progress up to 90% while data is truly loading
            const increment = prev < 80 ? 5 : 1;
            return Math.min(prev + increment, 90);
          });
        }, 100);

        // --- ACTUAL DATA FETCHING ---
        const payload = await gqlFetch(USER_ID_QUERY, {}, token);
        const userEntry = payload.user[0];
        if (!userEntry) {
          throw new Error("User session invalid or user not found.");
        }

        const userId = userEntry.id;
        setUsername(userEntry.login);

        const rootRes = await gqlFetch(ROOT_EVENT_QUERY, { userId }, token);
        const rootEventEntry = rootRes.event_user[0];

        const rootEventId = rootEventEntry?.event?.id;
        const programJoinDate = rootEventEntry?.createdAt
          ? new Date(rootEventEntry.createdAt)
          : new Date(0);

        if (!rootEventId)
          throw new Error("No root event found for the module.");

        const res = await gqlFetch(
          DASHBOARD_QUERY,
          { userId, rootEventId },
          token
        );
        const auditsRes = await gqlFetch(
          PENDING_AUDITS_QUERY,
          { auditorId: userId },
          token
        );
        const pendingAudits = auditsRes.audit || [];

        // ... (data processing logic is unchanged) ...
        const user = res.user[0];
        const level = res.level[0]?.amount || 0;
        const totalXp = Math.floor(
          (res.totalXp?.aggregate?.sum?.amount ?? 0) / 1000
        );
        const up = res.totalUp?.aggregate?.sum?.amount ?? 0;
        const down = res.totalDown?.aggregate?.sum?.amount ?? 0;
        const auditRatio = (up / (down || 1)).toFixed(1);
        const cohortLabel = res.cohort[0]?.labelName || "Unknown Cohort";
        const transactions = res.transactions || [];
        const currentProject =
          res.currentProject[0]?.group?.object?.name || "No active project";

        const xpByDay = {};
        const today = new Date();
        const sixMonthsAgo = new Date(today);
        sixMonthsAgo.setMonth(today.getMonth() - 6);

        res.transactions
          .filter((t) => {
            return t.type === "xp" && new Date(t.createdAt) >= sixMonthsAgo;
          })
          .forEach((t) => {
            const day = new Date(t.createdAt).toISOString().slice(0, 10);
            xpByDay[day] = (xpByDay[day] || 0) + t.amount / 1000;
          });

        const xpSeries = Object.entries(xpByDay)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, xp]) => ({ date, xp }));

        const auditByDay = {};
        res.transactions
          .filter((t) => t.type === "up" || t.type === "down")
          .forEach((t) => {
            const day = new Date(t.createdAt).toISOString().slice(0, 10);
            auditByDay[day] ||= { date: day, up: 0, down: 0 };
            auditByDay[day][t.type] += t.amount;
          });

        const auditSeries = Object.values(auditByDay).sort((a, b) =>
          a.date.localeCompare(b.date)
        );

        const doneData = auditSeries.map((item) => item.up);
        const receivedData = auditSeries.map((item) => item.down);
        const totalDone = doneData.reduce((a, b) => a + b, 0);
        const totalReceived = receivedData.reduce((a, b) => a + b, 0);
        const ratio = totalReceived > 0 ? totalDone / totalReceived : 0;
        const totalDoneKb = (totalDone / 1000).toFixed(1);
        const totalReceivedKb = (totalReceived / 1000).toFixed(1);

        const finalData = {
          username: user.login,
          name: user.firstName + user.lastName,
          level,
          auditRatio,
          totalXp,
          cohort: cohortLabel,
          dateJoined: programJoinDate,
          transactions,
          currentProject,
          xpSeries,
          auditSeries,
          auditChart: {
            totalDoneKb,
            totalReceivedKb,
            doneData,
            receivedData,
            ratio,
          },
          pendingAudits,
        };

        setData(finalData);

        // --- Post-Fetch Transition ---
        clearInterval(progressInterval);
        setProgress(100);

        // Step 1: hide loading
        setTimeout(() => {
          setIsFetching(false);

          // Step 2: show welcome message (without dashboard yet)
          setShowWelcome(true);

          // Step 3: after a short delay, set data (it'll render behind the welcome)
          setTimeout(() => {
            setData(finalData);
          }, 300); // small delay to ensure welcome shows first

          // Step 4: fade out welcome smoothly
          setTimeout(() => {
            setShowWelcome(false);
          }, 4000);
        }, 300);

        // This will be cleaned up by the return function, but clearing it here is safer
        // return () => clearTimeout(welcomeTimer); // Keep this cleanup outside for the main effect
      } catch (err) {
        clearInterval(progressInterval);
        setError(err.message);
        setIsFetching(false);
        if (
          err.message.includes("JWTExpired") ||
          err.message.includes("invalid-jwt") ||
          err.message.includes("Unauthorized") ||
          err.message.includes("User session invalid")
        ) {
          localStorage.removeItem("JWT");
          navigate("/login");
          return;
        }
      }
    }
    loadData();

    // Cleanup function for the effect
    return () => {
      if (progressInterval) clearInterval(progressInterval);
      // Note: welcomeTimer cleanup is handled outside this loop.
    };
  }, [navigate]); // navigate dependency is fine

  // --- Card styles and colors (Inspired by Image 1 & 2) ---
  const CARD_BG = "#212122"; // Dark gray for card backgrounds
  const ACCENT_GREEN = "#c9f24d"; // The lime green from Image 2

  const cardClass = `
    bg-[${CARD_BG}] 
    rounded-2xl 
    shadow-lg 
    transition-all duration-300 ease-in-out 
    hover:translate-y-[-2px] 
    hover:shadow-xl 
    flex flex-col 
    p-6 // Apply padding universally to cards
    text-white
  `;

  const DEFAULT_SPOTLIGHT_COLOR = `rgba(201, 242, 77, 0.1)`;
  const LOGOUT_SPOTLIGHT_COLOR = "rgba(255, 0, 0, 0.2)";

  if (error)
    return (
      <div className="text-red-500 text-center text-xl mt-20">{error}</div>
    );

  if (!data && !isFetching) return null;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <HeroGeometric className="absolute inset-0 z-0" />

      {/* 1. Generic Loading Screen (Visible while fetching initial data) */}
      {isFetching && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gray-900/50 backdrop-blur-xl transition-all duration-500 p-8">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-extrabold text-white tracking-wider mb-4">
              Initializing Dashboard
            </h1>
            {/* <p className="text-gray-400">
              Gathering the latest metrics and progress data.
            </p> */}
          </div>

          {/* PROGRESS BAR (Using Mocked Hero UI Component) */}
          <Progress
            aria-label="Loading dashboard"
            className="max-w-sm"
            value={progress} // Pass the state to the component
          />

          <p className="mt-4 text-sm font-medium text-gray-400">
            {progress}% Complete
          </p>
        </div>
      )}

      {/* 2. Personalized Welcome Screen (Smoothly fades out) */}
      {data && (
        <div
          className={`fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/50 backdrop-blur-xl transition-opacity duration-1000 ease-in-out pointer-events-none`}
          style={{ opacity: showWelcome ? 1 : 0 }}
        >
          <div className="text-center">
            <BlurText
              text={`Welcome Back ${data.username}`}
              delay={300}
              animateBy="words"
              direction="top"
              className="text-7xl md:text-6xl font-extrabold text-white tracking-tighter"
            />
          </div>
        </div>
      )}

      {/* Foreground content - Dashboard Grid */}
      {data && (
        <div className="relative z-10 flex items-center justify-center min-h-screen px-6 py-12">
          {/* CRITICAL: Responsive Grid Definition */}

          {/* Row 1, Col 1-6: Welcome (Full Width Header) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-5 auto-rows-[170px] gap-6 max-w-7xl w-full">
            {/* Row 1, Col 1-6: Welcome (Full Width Header) */}
            <div className="col-span-full items-start row-span-1 flex flex-col justify-center px-4 pt-4 pb-2">
              {/* --- UPDATED FLEX CONTAINER FOR ALIGNMENT --- */}
              <div className="flex items-center justify-between w-full">
                {" "}
                {/* ADDED justify-between and w-full */}
                <div>
                  <h3 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-2 pt-5 tracking-wide">
                    Welcome, {data.name}
                  </h3>
                  {/* User Name and Login (LEFT SIDE) */}
                  <h5 className="text-2xl text-gray-400">{data.username}</h5>
                </div>
                {/* Cohort Label (RIGHT SIDE) */}
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
              {/* -------------------------------------- */}
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
              className={`bg-[${CARD_BG}] 
                rounded-2xl 
                shadow-lg 
                transition-all duration-300 ease-in-out 
                hover:translate-y-[-2px] 
                hover:shadow-xl 
                flex flex-col 
                p-6 
                text-white 
                col-span-full sm:col-span-1 row-span-1 
                items-start 
                justify-start`}
              spotlightColor={DEFAULT_SPOTLIGHT_COLOR}
            >
              {/* 1. TITLE: Top-Left */}
              <div className="text-sm text-gray-400 mb-1">Current Project</div>

              {/* 2. PROJECT NAME: Takes up remaining space and CENTERS content */}
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
                  <h3 className="text-sm text-gray-400 mb-1">XP Progression</h3>
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
                        content={
                          <CustomXpTooltip ACCENT_GREEN={ACCENT_GREEN} />
                        }
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
                    renderItem={(audit, index, selectedIndex) => (
                      <div
                        key={audit.id}
                        className={`p-4 rounded-lg border border-gray-700/50 transition 
                                           'bg-gray-800/70 '}`}
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
                    amountColor = ACCENT_GREEN; // Lime green for XP gain
                    description = "Experience";
                  } else if (tx.type === "up") {
                    amountText = `+${(tx.amount / 1000).toFixed(1)}k`;
                    amountColor = "#38bdf8"; // A nice blue for Audits Done (Up)
                    description = "Audit Done (Up)";
                  } else if (tx.type === "down") {
                    amountText = `-${(tx.amount / 1000).toFixed(1)}k`;
                    amountColor = "#f87171"; // A soft red for Audits Received (Down)
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
                onLogout={() => {
                  localStorage.removeItem("JWT");
                  navigate("/login");
                }}
              />
            </SpotlightCard>
          </div>
        </div>
      )}
    </div>
  );
}
