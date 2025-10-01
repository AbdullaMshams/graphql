import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { gqlFetch } from "../services/graphql";
import DragToLogout from "../components/DragToLogout";
// import { Boxes } from "../components/background-boxes";
// import { CardBody, CardContainer, CardItem } from "../components/3d-card";
// import StackedAuditChart from "../components/StackedAuditChart";
import { HeroGeometric } from "../components/ui/shadcn-io/shape-landing-hero/index";
// import { PinContainer } from "../components/ui/shadcn-io/3d-pin/index";

import  LevelProgress  from "../components/LevelProgress";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Legend,
} from "recharts";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredValue, setHoveredValue] = useState(null);
  const [data, setData] = useState(null);
  const navigate = useNavigate();

  // --- Queries ---
  const USER_ID_QUERY = `
    { user { id } }
  `;
  const ROOT_EVENT_QUERY = `
    query GetRootEventId($userId: Int!) {
      event_user(
        where: {
          userId: { _eq: $userId }
          event: { parentId: { _is_null: true }, path: { _eq: "/bahrain/bh-module" } }
        }
      ) {
        event { id }
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
        # NOTE: 'audit' status needs to be wrapped in quotes
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

  // --- Data Loading ---
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("JWT");
      if (!token) return navigate("/login");
      try {
        // Step 1: Get user ID
        const payload = await gqlFetch(USER_ID_QUERY, {}, token);
        const userId = payload.user[0].id;

        // Step 2: Get root event ID
        const rootRes = await gqlFetch(ROOT_EVENT_QUERY, { userId }, token);
        const rootEventId = rootRes.event_user[0]?.event?.id;
        if (!rootEventId) throw new Error("No root event found");

        // Step 3: Get dashboard data
        const res = await gqlFetch(
          DASHBOARD_QUERY,
          { userId, rootEventId },
          token
        );

        // Step 4: Get pending audits data
        const auditsRes = await gqlFetch(
          PENDING_AUDITS_QUERY,
          { auditorId: userId }, // Pass the dynamic userId here
          token
        );
        const pendingAudits = auditsRes.audit || [];

        const user = res.user[0];
        const level = res.level[0]?.amount || 0;
        const totalXp = Math.floor(
          (res.totalXp?.aggregate?.sum?.amount ?? 0) / 1000
        );
        const up = res.totalUp?.aggregate?.sum?.amount ?? 0;
        const down = res.totalDown?.aggregate?.sum?.amount ?? 0;
        const auditRatio = (up / (down || 1)).toFixed(2);
        const cohortLabel = res.cohort[0]?.labelName || "Unknown Cohort";
        const transactions = res.transactions || [];
        const currentProject =
          res.currentProject[0]?.group?.object?.name || "No active project";

        // XP progression (kXP per day)
        // XP progression (kXP per day, last 6 months only)
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

        // Audit up vs down per day
        // ...inside useEffect
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

        // FIX: Ensure totalDoneKb and totalReceivedKb are calculated and stored
        const totalDoneKb = (totalDone / 1000).toFixed(1);
        const totalReceivedKb = (totalReceived / 1000).toFixed(1);

        setData({
          username: user.login,
          name: user.firstName + user.lastName,
          level,
          auditRatio,
          totalXp,
          cohort: cohortLabel,
          transactions,
          currentProject,
          xpSeries,
          auditSeries,
          auditChart: {
            // Store the KB strings for direct use in the hover logic
            totalDoneKb,
            totalReceivedKb,
            doneData,
            receivedData,
            ratio,
          },
          // Store the fetched pending audits
          pendingAudits,
        });
      } catch (err) {
        if (
          err.message.includes("JWTExpired") ||
          err.message.includes("invalid-jwt") ||
          err.message.includes("Unauthorized")
        ) {
          localStorage.removeItem("JWT");
          navigate("/login");
          return;
        }

        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [navigate]);

  if (loading) return <div className="text-white">Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>; // Keep this check for debugging
  if (!data) return null;

  // --- Card style (glassmorphism) ---
  const cardClass =
    "bg-white/10  rounded-2xl shadow-lg transition hover:scale-[1.02] hover:shadow-xl flex flex-col items-center justify-center text-white";

  const cardInnerClass =
    "bg-white/10 rounded-2xl shadow-lg transition hover:scale-[1.02] hover:shadow-xl flex flex-col items-center justify-center text-white";

  return (
    <div className="relative min-h-screen overflow-hidden">
      <HeroGeometric className="absolute inset-0 z-0" />
      {/* Foreground content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-6">
        <div className="grid grid-cols-6 auto-rows-[170px] gap-6 max-w-7xl w-full">
          {/* Row 1 - Welcome */}
          <div
            className={`${cardClass} col-span-2 row-span-1 flex flex-col justify-center p-6`}
          >
            <h2 className="text-2xl font-bold text-white mb-2">
              {data.name} 👋
            </h2>
            {/* <p className="text-gray-300">Here’s your latest progress overview.</p> */}
          </div>

          {/* Row 1 - Sidebar (User Info / Logout / Stats) */}
          <div
            className={`${cardClass} col-span-1 row-span-1 flex flex-col bg-[#222329]`}
          ></div>

          <div
            className={`${cardClass} col-span-1 row-span-2 flex flex-col bg-[#222329]`}
          ></div>

          {/* Row 2 - XP Progression */}

          {/* Row 2 - Audit Ratio Graph & Pending Audits (Combined Block) */}
          <div
            className={`${cardClass} col-span-2 row-span-3 flex flex-col p-6 bg-[#222329]`}
          >
            <h3 className="text-lg font-semibold mb-4 text-white">
              Audit Ratio
            </h3>

            {/* --- Ratio Graph with Hover Effect --- */}
            <div className="relative w-full flex justify-center h-40 mb-6">
              {/* CALCULATIONS FOR GRAPH AND HOVER ZONES */}
              {(() => {
                const r = 70;
                const circumference = 2 * Math.PI * r;
                // Get data safely
                const ratio = data.auditChart.ratio || 0;
                const totalDoneKb = data.auditChart.totalDoneKb || "0.0";
                const totalReceivedKb =
                  data.auditChart.totalReceivedKb || "0.0";

                const filledLength = ratio * circumference;
                console.log(filledLength);
                const hatchedLength = circumference - filledLength;
                console.log(hatchedLength);
                const filledAngle = ratio * 360;
                console.log(filledAngle);

                return (
                  <>
                    {/* SVG Graph */}
                    <svg
                      viewBox="0 0 160 160"
                      className="w-40 h-40 transform -rotate-90"
                    >
                      {/* ... (defs, circle 1, 2, 3) ... */}
                      <defs>
                        <pattern
                          id="hatchPattern"
                          patternUnits="userSpaceOnUse"
                          width="8"
                          height="8"
                        >
                          <path
                            d="M-1,1 l2,-2 M0,8 l8,-8 M7,9 l2,-2"
                            stroke="rgba(255, 255, 255, 0.4)"
                            strokeWidth="1"
                          />
                        </pattern>
                      </defs>

                      {/* 1. Base Circle (Dark gray track, the total 1.0) */}
                      <circle
                        cx="80"
                        cy="80"
                        r={r}
                        stroke="rgba(255, 255, 255, 0.1)"
                        strokeWidth="15"
                        fill="none"
                      />
                      {/* 2. Filled Segment (DONE/UP) */}
                      <circle
                        cx="80"
                        cy="80"
                        r={r}
                        stroke="rgba(255, 255, 255, 0.9)"
                        strokeWidth="15"
                        fill="none"
                        strokeDasharray={`${filledLength} ${circumference}`}
                        strokeLinecap="butt"
                      />
                      {/* 3. Hatched Segment (RECEIVED/DOWN) */}
                      <circle
                        cx="80"
                        cy="80"
                        r={r}
                        stroke="url(#hatchPattern)"
                        strokeWidth="15"
                        fill="none"
                        strokeDasharray={`0 ${filledLength} ${hatchedLength} 0`}
                        strokeDashoffset={-1}
                        strokeLinecap="butt"
                      />
                    </svg>

                    {/* Center Text & Tooltip */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                      {hoveredValue ? (
                        <span className="text-2xl font-bold mb-1 text-yellow-400">
                          {hoveredValue}k
                        </span>
                      ) : (
                        <span className="text-4xl font-bold mb-1">
                          {ratio.toFixed(1)}
                        </span>
                      )}
                      <span className="text-base text-gray-400">
                        {/* Correct comparison for the label */}
                        {hoveredValue
                          ? hoveredValue === totalDoneKb
                            ? "Audits Done"
                            : "Audits Received"
                          : "Ratio"}
                      </span>
                    </div>

                    {/* HOVER ZONES (Hidden Divs) */}
                    <div className="absolute w-40 h-40 rounded-full cursor-pointer">
                      {/* ZONE 1: Done/UP (Filled Segment) */}
                      {/* ZONE 1: Received/DOWN (Hatched Segment) - Place this FIRST (lower z-index) */}
                      {/* Mask is white ONLY where the circle is NOT filled */}
                      <div
                        className="absolute inset-0 rounded-full"
                        onMouseEnter={() => setHoveredValue(totalReceivedKb)}
                        onMouseLeave={() => setHoveredValue(null)}
                        style={{
                          // Mask allows interaction ONLY in the UNFILLED (striped) part
                          maskImage: `conic-gradient(from 90deg, white 0deg ${
                            360 - filledAngle
                          }deg, transparent ${360 - filledAngle}deg 360deg)`,
                          transform: "rotate(90deg)",
                        }}
                      />

                      {/* ZONE 2: Done/UP (Filled Segment) - Place this SECOND (higher z-index) */}
                      {/* Mask is white ONLY where the circle IS filled */}
                      <div
                        className="absolute inset-0 rounded-full"
                        onMouseEnter={() => setHoveredValue(totalDoneKb)}
                        onMouseLeave={() => setHoveredValue(null)}
                        style={{
                          // Mask allows interaction ONLY in the FILLED part
                          maskImage: `conic-gradient(from 90deg, transparent 0deg ${
                            360 - filledAngle
                          }deg, white ${360 - filledAngle}deg 360deg)`,
                          transform: "rotate(90deg)",
                        }}
                      />

                      {/* ZONE 2: Received/DOWN (Hatched Segment) */}
                    </div>
                  </>
                );
              })()}
            </div>
            {/* --- End Ratio Graph --- */}

            {/* --- Pending Audits List (Under the Graph) --- */}
            <div className="flex flex-col flex-1 overflow-y-auto w-full pt-4">
              <h4 className="text-lg font-semibold text-gray-300 mb-3">
                Pending Audits
                {/* Fallback to ensure it's not undefined */}
                {data?.pendingAudits
                  ? ` (${data.pendingAudits.length})`
                  : " (0)"}
              </h4>

              {/* Fallback check for the data */}
              {!data?.pendingAudits || data.pendingAudits.length === 0 ? (
                <p className="text-gray-500 text-sm text-center">
                  No open audits found. Great job!
                </p>
              ) : (
                <ul className="space-y-3 w-full">
                  {data.pendingAudits.map((audit) => (
                    <li
                      key={audit.id}
                      className="p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition"
                    >
                      <p className="text-base font-medium text-white truncate">
                        {audit.group?.object?.name || "Unknown Project"}
                      </p>
                      <p className="text-xs text-gray-400">
                        **Auditor:** {audit.auditorLogin}
                      </p>
                      <p className="text-xs text-gray-500">
                        **Group Captain:** {audit.group?.captainLogin || "N/A"}
                      </p>

                      {audit.private?.code && (
                        <p className="text-xs text-yellow-400 font-mono mt-1 truncate">
                          Code: {audit.private.code}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className={`${cardClass} col-span-2 row-span-3 p-6`}>
            <h3 className="text-lg font-semibold mb-2 text-white">
              XP Progression
            </h3>
            <div className="mt-2 text-right">
              <span className="text-sm text-gray-300">Total XP</span>
              <span className="text-2xl font-bold ml-2">{data.totalXp}k</span>
            </div>
            <ResponsiveContainer width="100%" height="80%">
              <AreaChart data={data.xpSeries}>
                <defs>
                  <linearGradient id="xpGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#87F6A3" stopOpacity={40} />
                    <stop offset="100%" stopColor="#87F6A3" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tick={false}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={false} axisLine={false} tickLine={false} />
                <CartesianGrid
                  stroke="rgba(255,255,255,0.06)"
                  vertical={false}
                  strokeDasharray="3 3"
                />
                <Tooltip
                  cursor={{ stroke: "#87F6A3", strokeWidth: 1 }}
                  contentStyle={{
                    background: "rgba(20,20,20,0.9)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    backdropFilter: "blur(10px)",
                    color: "#fff",
                    padding: "10px 15px",
                  }}
                  labelStyle={{ color: "#aaa" }}
                />
                <Area
                  type="monotone"
                  dataKey="xp"
                  stroke="#87F6A3"
                  fill="url(#xpGrad)"
                  strokeWidth={3}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>

            <h3 className="text-lg font-semibold mb-3 text-white">
              Recent Transactions
            </h3>
            <ul className="space-y-2 w-full overflow-y-auto">
              {data.transactions.map((tx) => (
                <li
                  key={tx.id}
                  className="flex justify-between items-center border-b border-white/10 pb-1"
                >
                  <div className="flex flex-col">
                    <span className="font-medium truncate max-w-[180px]">
                      {tx.object?.name || tx.type}
                    </span>
                    <span className="text-xs text-gray-400 capitalize">
                      {tx.type.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="text-right">
                    <span
                      className={
                        tx.type === "xp"
                          ? "text-green-400"
                          : tx.type === "down"
                          ? "text-red-400"
                          : "text-blue-400"
                      }
                    >
                      {(tx.amount / 1000).toFixed(1)}
                    </span>
                    <div className="text-xs text-gray-400">
                      {new Date(tx.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          
            <div className={`${cardClass} col-span-2 row-span-1 p-6`}>
              <LevelProgress currentLevel={data.level} />
            </div>
          
          <div className={`${cardClass} col-span-1 row-span-1 p-6`}>
            <span className="text-sm text-gray-300">Cohort</span>
            <span className="text-lg font-bold">{data.cohort}</span>
          </div>
          <div className={`${cardClass} col-span-1 row-span-1 p-6`}>
            <span className="text-sm text-gray-300">Current Project</span>
            <span className="text-lg font-bold">{data.currentProject}</span>
          </div>
          <div className={`${cardClass} col-span-2 row-span-1 p-6`}>
            <div className="mt-4 cursor-pointer">
              <DragToLogout
                onLogout={() => {
                  localStorage.removeItem("JWT");
                  navigate("/login");
                }}
              />
            </div>
          </div>

          {/* Row 3 - Transaction History */}
          {/* <div className={`${cardClass} col-span-4 row-span-2 p-6 overflow-y-auto`}>
          
        </div> */}
        </div>
      </div>
    </div>
  );
}
