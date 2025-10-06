import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { gqlFetch } from "../services/graphql";
import DragToLogout from "../components/DragToLogout";
// import { Boxes } from "../components/background-boxes";
// import { CardBody, CardContainer, CardItem } from "../components/3d-card";
// import StackedAuditChart from "../components/StackedAuditChart";
import { HeroGeometric } from "../components/ui/shadcn-io/shape-landing-hero/index";
import SpotlightCard from '../components/SpotlightCard';
// ProfilePage.jsx (at the top with other imports)
import AuditRadialChart from '../components/AuditStackedBarChart'; // Adjust path as necessary
// ... other imports
// import { PinContainer } from "../components/ui/shadcn-io/3d-pin/index";
import  AnimatedList  from "../components/AnimatedList";

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
        const dateJoined = new Date(user.createdAt);
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
          dateJoined,
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

// Define default spotlight color
const DEFAULT_SPOTLIGHT_COLOR = "rgba(0, 229, 255, 0.2)"; 
// You might also want a different color for the Logout Card, e.g., red
const LOGOUT_SPOTLIGHT_COLOR = "rgba(255, 0, 0, 0.2)"; 

// ... inside ProfilePage component ...

  return (
    <div className="relative min-h-screen overflow-hidden">
      <HeroGeometric className="absolute inset-0 z-0" />
      {/* Foreground content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-6">
        <div className="grid grid-cols-5 auto-rows-[170px] gap-6 max-w-7xl w-full">
          
          {/* Row 1, Col 1-6: Welcome (Full Width Header) */}
          <div
            className={` col-span-5 items-start row-span-1 flex flex-col justify-center p-6`}
          >
            <h3 className="text-3xl font-bold text-white mb-2">
              Welcome, {data.name}
            </h3>
            <h5>
              {data.username}
            </h5>
          </div>

          {/* Row 2, Col 1-2: LEVEL PROGRESS */}
          <SpotlightCard
            className={`${cardClass} col-span-1 row-span-1 p-6 bg-[#222329] justify-center`}
            spotlightColor={DEFAULT_SPOTLIGHT_COLOR}
          >
            <LevelProgress currentLevel={data.level} />
          </SpotlightCard>
          {/* Date Joined Card - Enhanced */}
<SpotlightCard 
  className={`${cardClass} col-span-1 row-span-1 p-6 flex-col`}
  spotlightColor={DEFAULT_SPOTLIGHT_COLOR}
>
  <span className="text-sm text-gray-300 mb-1">Member Since</span>
  <span className="text-2xl font-bold">
    {data.dateJoined.toLocaleDateString("en-US", { month: "short", year: "numeric" })}
  </span>
  <span className="text-xs text-gray-500 mt-1">
    {Math.floor((new Date() - data.dateJoined) / (1000 * 60 * 60 * 24))} days
  </span>
</SpotlightCard>
 {/* Row 5, Col 3-4: CURRENT PROJECT */}
          <SpotlightCard 
            className={`${cardClass} col-span-1 row-span-1 p-6`}
            spotlightColor={DEFAULT_SPOTLIGHT_COLOR}
          >
            <span className="text-sm text-gray-300">Current Project</span>
            <span className="text-lg font-bold">{data.currentProject}</span>
          </SpotlightCard>


          {/* Row 2, Col 3-4: AUDIT RATIO */}
          



{/* Row 2, Col 3-4: AUDIT RATIO */}

<SpotlightCard
    className={`${cardClass} col-span-2 row-span-1 flex flex-col p-6 bg-[#222329]`}
    spotlightColor={DEFAULT_SPOTLIGHT_COLOR}
>
    {/* CRITICAL: Use the component you modified for the horizontal bar. 
       If you renamed the file to AuditStackedBarChart.jsx, use that.
       If you did NOT rename the file and it's still AuditRadialChart.jsx, 
       then you must use the AuditRadialChart component name here. 
       I will use the component name matching the file you provided, AuditRadialChart:
    */}
    <div className="h-[150px] w-full mb-4">
        <AuditRadialChart auditChartData={data.auditChart} /> 
    </div>

    {/* --- Pending Audits List --- */}
    
</SpotlightCard>


   <SpotlightCard 
            // The main card is still a flex column (for content above/below this new section)
            // But we'll make its primary content area a row
            className={` col-span-3 row-span-1 p-6 flex flex-col h-full`} 
            spotlightColor={DEFAULT_SPOTLIGHT_COLOR}
          >
            {/* Title for the entire card (XP Progression) */}
            {/* <h3 className="text-lg font-semibold mb-2 text-white">
              XP Progression
            </h3> */}

            {/* NEW: Container to hold the XP Value box and the Graph side-by-side */}
            {/* This div will be a flex row, taking up the available space */}
            <div className="flex flex-row flex-1 w-full gap-4 items-center justify-center"> 
                {/* Left Side: XP Value Box */}
                {/* This mimics the smaller, rounded rectangle on the left of the reference image */}
                <div className="bg-white/10 p-4 rounded-xl flex flex-col items-start justify-center h-full w-1/3 min-w-[120px]">
                    <span className="text-sm text-gray-300 mb-1">Total XP</span>
                    <span className="text-3xl font-bold text-green-400">{data.totalXp}k</span>
                    {/* You could add a small trend indicator here if you have data for it */}
                </div>
                
                {/* Right Side: Graph Container */}
                {/* This div takes up the remaining space and contains the ResponsiveContainer */}
                <div className="flex-1 h-full w-2/3 -mt-2"> 
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.xpSeries}>
                        <defs>
                          <linearGradient id="xpGrad" x1="0" y1="0" x2="0" y2="1">
                            {/* Using the green color for XP */}
                            <stop offset="0%" stopColor="#87F6A3" stopOpacity={0.6} /> 
                            <stop offset="100%" stopColor="#87F6A3" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        {/* XAxis labels for months (Jan, Feb, etc.) if data supports it, otherwise tick={false} */}
                        <XAxis 
                            dataKey="date" 
                            tickFormatter={(dateStr) => new Date(dateStr).toLocaleString('en-US', { month: 'short' })}
                            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} // Styling for month labels
                            axisLine={false} 
                            tickLine={false} 
                        />
                        <YAxis tick={false} axisLine={false} tickLine={false} />
                        <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} strokeDasharray="3 3" />
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
                        <Area type="monotone" dataKey="xp" stroke="#87F6A3" fill="url(#xpGrad)" strokeWidth={3} dot={false}/>
                      </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div> 
            
            {/* The Recent Transactions list now appears BELOW this new XP metric/graph section */}
            {/* You will need to decide if you want to keep this list here or move it.
                If keeping, you might want to adjust its max-height or remove it if the card is too full.
                For now, let's keep it but without the explicit max-height, as the card's flex will manage.
            */}
            
          </SpotlightCard>

          {/* <SpotlightCard 
            className={`${cardClass} col-span-1 row-span-1 p-6`}
            spotlightColor={DEFAULT_SPOTLIGHT_COLOR}
          >
            <span className="text-sm text-gray-300">Cohort</span>
            <span className="text-lg font-bold">{data.cohort}</span>
          </SpotlightCard> */}




          {/* Row 2, Col 5-6: XP Progression */}
          

          {/* Row 2, Col 5-6: XP Progression */}
         

          <SpotlightCard
    className={`${cardClass} col-span-2 row-span-2 flex flex-col p-6 bg-[#222329]`}
    spotlightColor={DEFAULT_SPOTLIGHT_COLOR}
>
    

    {/* --- Pending Audits List (Moved slightly higher) --- */}

    <h4 className="text-lg font-semibold text-gray-300 mb-3">
        Pending Audits
        {data?.pendingAudits ? ` (${data.pendingAudits.length})` : " (0)"}
    </h4>
<div className="flex flex-col flex-1  w-full pt-4 overflow-auto [&::-webkit-scrollbar]:hidden" // Hides scrollbar for Chrome/Safari/Edge
    style={{ scrollbarWidth: 'none' }}>

    {data?.pendingAudits && data.pendingAudits.length > 0 ? (
        
        <AnimatedList
            // 1. Pass the raw audit data to the list
            items={data.pendingAudits} 
            
            // 2. Pass your custom rendering logic
            renderItem={(audit, index, selectedIndex) => (
                <div 
                    key={audit.id} 
                    className={`p-3 rounded-lg border border-white/10 transition 
                               ${selectedIndex === index ? 'bg-white/20 shadow-lg' : 'bg-white/5 hover:bg-white/10'}`}
                >
                    <p className="text-base font-medium text-white truncate">{audit.group?.object?.name || "Unknown Project"}</p>
                    <p className="text-xs text-gray-400">**Auditor:** {audit.auditorLogin}</p>
                    <p className="text-xs text-gray-500">**Group Captain:** {audit.group?.captainLogin || "N/A"}</p>
                    {audit.private?.code && (<p className="text-xs text-yellow-400 font-mono mt-1 truncate">Code: {audit.private.code}</p>)}
                </div>
            )}
            
            // 3. Apply necessary styling to the outer container
            className="w-full"
            displayScrollbar={false} // Use the component's internal scrollbar
        />

    ) : (
        <p className="text-gray-500 text-sm text-center">No open audits found. Great job! 🎉</p>
    )}
</div>
</SpotlightCard>

          <SpotlightCard 
            // 1. Ensure the card is a flexible column container
            className={`${cardClass} col-span-3 row-span-2 p-6 flex flex-col h-full [&::-webkit-scrollbar]:hidden`}
            spotlightColor={DEFAULT_SPOTLIGHT_COLOR}
          >
            
            <h3 className="text-lg font-semibold mb-3 text-white">Recent Transactions</h3>
            
            {/* 3. Transaction List: CRITICAL - Constrain the height of the list itself */}
            <ul className="space-y-2 w-full overflow-y-auto [&::-webkit-scrollbar]:hidden" // Hides scrollbar for Chrome/Safari/Edge
    style={{ scrollbarWidth: 'none' }}> 
              {data.transactions
              .filter(tx => tx.type === "xp")
              .map((tx) => (
                <li key={tx.id} className="flex justify-between items-center border-b border-white/10 pb-1">
                  <div className="flex flex-col">
                    <span className="font-medium  whitespace-nowrap  text-ellipsis max-w-[180px]">{tx.object?.name || tx.type}</span>
                    <span className="text-xs text-gray-400 capitalize">{tx.type.replace(/_/g, " ")}</span>
                  </div>
                  <div className="text-right">
                    <span className={tx.type === "xp" ? "text-green-400" : tx.type === "down" ? "text-red-400" : "text-blue-400"}>
                      {(tx.amount / 1000).toFixed(1)}
                    </span>
                    <div className="text-xs text-gray-400">
                      {new Date(tx.createdAt).toLocaleDateString("en-US", {month: "short", day: "numeric",})}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </SpotlightCard>
          
          {/* Row 5 (after the 3x3 cards), Col 1-2: COHORT */}
          
         
          {/* Row 5, Col 5-6: DRAG TO LOGOUT */}

<SpotlightCard 
  className={` col-span-2 row-span-1 p-6`}
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
    </div>
  );
}
