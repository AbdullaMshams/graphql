import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { gqlFetch } from "../services/graphql";
import DragToLogout from "../components/DragToLogout";
import  MagnetLines  from "../components/MagnetLines.jsx";
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
  Legend
} from "recharts";


export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
        id login profile attrs campus
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
  order_by: { createdAt: asc }
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

  // --- Data Loading ---
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("jwt");
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
        const res = await gqlFetch(DASHBOARD_QUERY, { userId, rootEventId }, token);

        const user = res.user[0];
        const level = res.level[0]?.amount || 0;
        const totalXp = Math.floor((res.totalXp?.aggregate?.sum?.amount ?? 0) / 1000);
        const up = res.totalUp?.aggregate?.sum?.amount ?? 0;
        const down = res.totalDown?.aggregate?.sum?.amount ?? 0;
        const auditRatio = (up / (down || 1)).toFixed(2);
        const cohortLabel = res.cohort[0]?.labelName || "Unknown Cohort";
        const transactions = res.transactions || [];
        const currentProject = res.currentProject[0]?.group?.object?.name || "No active project";

        // XP progression (kXP per day)
const xpByDay = {};
res.transactions
  .filter(t => t.type === "xp")
  .forEach(t => {
    const day = new Date(t.createdAt).toISOString().slice(0, 10);
    xpByDay[day] = (xpByDay[day] || 0) + t.amount / 1000;
  });
const xpSeries = Object.entries(xpByDay)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([date, xp]) => ({ date, xp }));

// Audit up vs down per day
const auditByDay = {};
res.transactions
  .filter(t => t.type === "up" || t.type === "down")
  .forEach(t => {
    const day = new Date(t.createdAt).toISOString().slice(0, 10);
    auditByDay[day] ||= { date: day, up: 0, down: 0 };
    auditByDay[day][t.type] += t.amount;
  });
const auditSeries = Object.values(auditByDay).sort((a, b) => a.date.localeCompare(b.date));


        setData({
  name: user.login,
  level,
  auditRatio,
  totalXp,
  cohort: cohortLabel,
  transactions,
  currentProject,
  xpSeries,
  auditSeries
});

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [navigate]);

  if (loading) return <div className="text-white">Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!data) return null;

  // --- Card style (glassmorphism) ---
  const cardClass =
    "bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg transition hover:scale-[1.02] hover:shadow-xl flex flex-col items-center justify-center text-white";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-950 flex items-center justify-center p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 auto-rows-[200px] gap-6 max-w-7xl w-full ">
        
        {/* User Info */}
        <div className={`${cardClass} col-span-2 row-span-1`}>
          <h2 className="text-xl font-bold">{data.name}</h2>
          <p className="text-gray-300">Active</p>
        </div>

        {/* Charts */}
        {/* Chart 1: XP Progression */}
<div className={`${cardClass} col-span-2 row-span-3`}>
  <ResponsiveContainer width="100%" height="100%">
    <AreaChart data={data.xpSeries}>
      <defs>
        <linearGradient id="xpGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#A3E635" stopOpacity={0.8}/>
          <stop offset="100%" stopColor="#A3E635" stopOpacity={0.1}/>
        </linearGradient>
      </defs>
      <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.6)' }} />
      <YAxis tick={{ fill: 'rgba(255,255,255,0.6)' }} />
      <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
      <Tooltip contentStyle={{
        background: 'rgba(20,20,20,0.9)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 12,
        color: '#fff'
      }}/>
      <Area type="monotone" dataKey="xp" stroke="#A3E635" fill="url(#xpGrad)" strokeWidth={3} dot={false}/>
    </AreaChart>
  </ResponsiveContainer>
</div>

{/* Chart 2: Audit Up vs Down */}
<div className={`${cardClass} col-span-2 row-span-3`}>
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={data.auditSeries}>
      <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.6)' }} />
      <YAxis tick={{ fill: 'rgba(255,255,255,0.6)' }} />
      <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
      <Tooltip contentStyle={{
        background: 'rgba(20,20,20,0.9)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 12,
        color: '#fff'
      }}/>
      <Legend />
      <Bar dataKey="up" fill="#34D399" name="Audits Done" />
      <Bar dataKey="down" fill="#F87171" name="Audits Received" />
    </BarChart>
  </ResponsiveContainer>
</div>

        {/* Level */}
        <div className={`${cardClass} col-span-1 row-span-1`}>
          <span className="text-sm text-gray-300">Level</span>
          <span className="text-2xl font-bold">{data.level}</span>
        </div>

        {/* Audit Ratio */}
        <div className={`${cardClass} col-span-1 row-span-1`}>
          <span className="text-sm text-gray-300">Audit Ratio</span>
          <span className="text-2xl font-bold">{data.auditRatio}</span>
        </div>

        {/* Recent Transactions */}
        <div className={`${cardClass} col-span-2 row-span-1 p-4 overflow-y-auto`}>
          <h2 className="text-lg font-semibold mb-3">Recent Transactions</h2>
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
                    {(tx.amount/1000).toFixed(1)}
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

        {/* XP */}
        <div className={`${cardClass} col-span-1 row-span-1`}>
          <span className="text-sm text-gray-300">Total XP</span>
          <span className="text-2xl font-bold">{data.totalXp}k</span>
        </div>

        {/* Cohort */}
        <div className={`${cardClass} col-span-1 row-span-1`}>
          <span className="text-sm text-gray-300">Cohort</span>
          <span className="text-lg font-bold">{data.cohort}</span>
        </div>

        {/* Current Project */}
        <div className={`${cardClass} col-span-1 row-span-1 text-center px-2`}>
          <span className="text-sm text-gray-300">Current Project</span>
          <span className="text-lg font-bold">{data.currentProject}</span>
        </div>

        <div className={`${cardClass} col-span-1 row-span-1 relative`}>
  hola
</div>


        {/* Logout */}
        <div className="col-span-1 row-span-1 cursor-pointer">
          <DragToLogout
            onLogout={() => {
              localStorage.removeItem("jwt");
              navigate("/login");
            }}
          />
        </div>
      </div>
    </div>
  );
}