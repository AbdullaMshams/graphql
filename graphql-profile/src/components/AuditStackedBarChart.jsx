import React from 'react';
import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'; 
// NOTE: I will use the exported name AuditRadialChart for clarity in the file

// Custom Tooltip Component 
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    // Check if payload[0] and payload[0].payload exist before accessing data
    const data = payload[0].payload;
    const done = data.done / 1000;
    const received = data.received / 1000;

    return (
      <div className="bg-gray-800/95 border border-gray-700 rounded-lg p-3 shadow-xl backdrop-blur-sm">
        <p className="text-white text-sm font-semibold mb-2">Total Audits</p>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-4">
            <span className="text-[#87F6A3] text-sm font-semibold">Done</span>
            <span className="text-white font-bold">{done.toFixed(1)}k</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-[#00BFFF] text-sm font-semibold">Received</span>
            <span className="text-white font-bold">{received.toFixed(1)}k</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

// CRITICAL: Export this with the name that matches your import in ProfilePage.jsx
export default function AuditRadialChart({ auditChartData }) { 
  const doneKb = parseFloat(auditChartData.totalDoneKb) || 0;
  const receivedKb = parseFloat(auditChartData.totalReceivedKb) || 0;
  const ratio = auditChartData.ratio || 0.0;
  
  const totalDoneAmount = doneKb * 1000;
  const totalReceivedAmount = receivedKb * 1000;
  
  const chartData = [
    // This is the single bar data point
    { name: "Total Audits", done: totalDoneAmount, received: totalReceivedAmount }
  ];
  
  const totalAmount = totalDoneAmount + totalReceivedAmount;

  // If there's no data, render a minimal display or a message
  if (totalAmount === 0) {
      return (
        <div className="w-full h-full flex flex-col justify-center items-center">
            <div className="flex items-center justify-between mb-4 w-full">
                <div className="flex flex-col">
                    <span className="text-sm text-gray-400 font-medium">Audit Ratio</span>
                    <span className="text-3xl font-black text-white">0.00</span>
                </div>
                <p className="text-sm text-gray-500">No audit data yet.</p>
            </div>
        </div>
      );
  }


  return (
    <div className="w-full h-full flex flex-col">
      {/* Ratio Display (Kept separate from the chart component for better layout control) */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col">
          <span className="text-sm text-gray-400 font-medium">Audit Ratio</span>
          <span className="text-3xl font-black text-white">{ratio.toFixed(2)}</span>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#87F6A3]" />
            <span className="text-xs text-gray-300">{doneKb}k Done</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#00BFFF]" />
            <span className="text-xs text-gray-300">{receivedKb}k Received</span>
          </div>
        </div>
      </div>

      {/* Stacked Bar Chart - Horizontal Layout */}
      {/* Use a fixed height (e.g., 30px) for a single horizontal bar */}
      <div className="flex-1 min-h-0 flex items-start"> 
        <ResponsiveContainer width="100%" height={30}> 
          <BarChart 
            data={chartData} 
            layout="vertical" 
            barCategoryGap={0}
            margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
          >
            <defs>
              {/* Corrected: Horizontal Gradient (x1=0 to x2=1) */}
              <linearGradient id="doneGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#87F6A3" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#5FD87F" stopOpacity={0.9} />
              </linearGradient>
              {/* Corrected: Horizontal Gradient (x1=0 to x2=1) */}
              <linearGradient id="receivedGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#00BFFF" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#0099DD" stopOpacity={0.9} />
              </linearGradient>
            </defs>
            
            {/* YAxis (Category Axis) must be type="category" and use the 'name' key */}
            <YAxis 
                dataKey="name"
                type="category" 
                hide
            />
            {/* XAxis (Value Axis) must be type="number" and set the domain to the total amount */}
            <XAxis 
                type="number" 
                hide
                domain={[0, totalAmount]}
            />
            
            {/* Tooltip cursor needs a position to work; removed the custom cursor prop */}
            <Tooltip content={<CustomTooltip />} />
            
            <Bar
              dataKey="received"
              stackId="audits"
              fill="url(#receivedGradient)"
              radius={[6, 0, 0, 6]} // Left rounded corner
              barSize={30}
            />
            <Bar
              dataKey="done"
              stackId="audits"
              fill="url(#doneGradient)"
              radius={[0, 6, 6, 0]} // Right rounded corner
              barSize={30}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}