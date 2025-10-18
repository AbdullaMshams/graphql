import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { gqlFetch } from "../services/graphql"; // Ensure this path is correct

import {
  USER_ID_QUERY,
  ROOT_EVENT_QUERY,
  DASHBOARD_QUERY,
  PENDING_AUDITS_QUERY,
} from "../services/queries"; // Import from the new queries.js

export default function useProfileData() {
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [isFetching, setIsFetching] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [progress, setProgress] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    let progressInterval;
    let welcomeTimer;

    async function loadData() {
      setIsFetching(true);
      setProgress(0);
      setError(null);
      const token = localStorage.getItem("JWT");
      if (!token) return navigate("/login");

      try {
        // Start the progress bar simulation
        progressInterval = setInterval(() => {
          setProgress((prev) => {
            const increment = prev < 80 ? 5 : 1;
            return Math.min(prev + increment, 90);
          });
        }, 100);

        // --- FETCHING LOGIC ---
        const payload = await gqlFetch(USER_ID_QUERY, {}, token);
        const userEntry = payload.user[0];
        if (!userEntry) {
          throw new Error("User session invalid or user not found.");
        }

        const userId = userEntry.id;

        const rootRes = await gqlFetch(ROOT_EVENT_QUERY, { userId }, token);
        const rootEventEntry = rootRes.event_user[0];

        const rootEventId = rootEventEntry?.event?.id;
        const programJoinDate = rootEventEntry?.createdAt
          ? new Date(rootEventEntry.createdAt)
          : new Date(0);

        if (!rootEventId)
          throw new Error("No root event found for the module.");

        const [res, auditsRes] = await Promise.all([
          gqlFetch(DASHBOARD_QUERY, { userId, rootEventId }, token),
          gqlFetch(PENDING_AUDITS_QUERY, { auditorId: userId }, token)
        ]);
        
        const pendingAudits = auditsRes.audit || [];

        // --- DATA PROCESSING LOGIC ---
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

        // XP Series Processing (Last 6 months)
        const xpByDay = {};
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(new Date().getMonth() - 6);

        res.transactions
          .filter((t) => t.type === "xp" && new Date(t.createdAt) >= sixMonthsAgo)
          .forEach((t) => {
            const day = new Date(t.createdAt).toISOString().slice(0, 10);
            xpByDay[day] = (xpByDay[day] || 0) + t.amount / 1000;
          });

        const xpSeries = Object.entries(xpByDay)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, xp]) => ({ date, xp }));

        // Audit Series Processing
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

        setTimeout(() => {
          setIsFetching(false);
          setShowWelcome(true);

          welcomeTimer = setTimeout(() => {
            setShowWelcome(false);
          }, 4000);
        }, 300);
      } catch (err) {
        clearInterval(progressInterval);
        setError(err.message);
        setIsFetching(false);
        
        // JWT/Auth Error Handling
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

    // Cleanup function
    return () => {
      if (progressInterval) clearInterval(progressInterval);
      if (welcomeTimer) clearTimeout(welcomeTimer);
    };
  }, [navigate]);

  return { data, error, isFetching, showWelcome, progress };
}