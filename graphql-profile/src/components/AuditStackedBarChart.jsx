import React from 'react';
import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

// --- Define Colors for Consistency ---
const ACCENT_GREEN = '#c9f24d'; // New Lime Green for 'Done'
const RECEIVED_COLOR = '#78912e'; // Tailwind Blue-500 for 'Received' (Good contrast)

// Custom Tooltip Component 
// const CustomTooltip = ({ active, payload }) => {
//   if (active && payload && payload.length) {
//     const data = payload[0].payload;
//     const done = data.done / 1000;
//     const received = data.received / 1000;

//     // return (
//     //   // CRITICAL FIX: Add a high z-index (e.g., z-50) to bring it forward
//     //   <div className="bg-gray-800/95 border border-gray-700 rounded-lg p-3 shadow-xl backdrop-blur-sm z-5000"> 
//     //     <p className="text-white text-sm font-semibold mb-2">Total Audits</p>
//     //     <div className="space-y-1">
//     //       <div className="flex items-center justify-between gap-4">

//     //         <span className={`text-[${ACCENT_GREEN}] text-sm font-semibold`}>Done</span>
//     //         <span className="text-white font-bold">{done.toFixed(1)}k</span>
//     //       </div>
//     //       <div className="flex items-center justify-between gap-4">

//     //         <span className={`text-[${RECEIVED_COLOR}] text-sm font-semibold`}>Received</span>
//     //         <span className="text-white font-bold">{received.toFixed(1)}k</span>
            
//     //       </div>
//     //     </div>
//     //   </div>
//     // );
//   }
//   return null;
// };

// CRITICAL: Export this with the name that matches your import in ProfilePage.jsx
export default function AuditRadialChart({ auditChartData }) { 
  const doneKb = parseFloat(auditChartData.totalDoneKb) || 0;
  const receivedKb = parseFloat(auditChartData.totalReceivedKb) || 0;
  const ratio = auditChartData.ratio || 0.0;
  
  const totalDoneAmount = doneKb * 1000;
  const totalReceivedAmount = receivedKb * 1000;
  
  const chartData = [
    { name: "Total Audits", done: totalDoneAmount, received: totalReceivedAmount }
  ];
  
  const totalAmount = totalDoneAmount + totalReceivedAmount;

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
    <div className="w-full h-full flex flex-col z-5000">
      {/* Ratio Display */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col">
          
          <span className="text-5xl font-black text-white">{ratio.toFixed(1)}</span>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            {/* UPDATED: Use ACCENT_GREEN */}
            <span className={`w-3 h-3 rounded-full bg-[${ACCENT_GREEN}]`} />
            <span className="text-xs text-gray-300">{doneKb}k Done</span>
          </div>
          <div className="flex items-center gap-2">
            {/* UPDATED: Use RECEIVED_COLOR */}
            
            <span className={`w-3 h-3 rounded-full bg-[#78912e]`} />
            <span className="text-xs text-gray-300">{receivedKb}k Received</span>
            
          </div>
        </div>
      </div>

      {/* Stacked Bar Chart */}
      <div className="flex-1 min-h-0 flex items-start"> 
        <ResponsiveContainer width="100%" height={30}> 
          <BarChart 
            data={chartData} 
            layout="vertical" 
            barCategoryGap={0}
            margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
            isAnimationActive={false} 
          >
            <defs>
              {/* UPDATED DONE GRADIENT: Use ACCENT_GREEN */}
              <linearGradient id="doneGradient" x1="0" y1="0" x2="1" y2="0">
                  {/* <stop offset="0%" stopColor={ACCENT_GREEN} stopOpacity={0.9} /> */}
                  <stop offset="100%" stopColor="#c9f24d" stopOpacity={1} /> {/* Slightly darker green end */}
              </linearGradient>
              {/* UPDATED RECEIVED GRADIENT: Use RECEIVED_COLOR */}
              <linearGradient id="receivedGradient" x1="0" y1="0" x2="1" y2="0">
                  {/* <stop offset="0%" stopColor={"#c9f24d"} stopOpacity={0.9} /> */}
                  <stop offset="100%" stopColor="#78912e" stopOpacity={1} /> {/* Darker blue end */}
              </linearGradient>
            </defs>
            
            <YAxis dataKey="name" type="category" hide />
            <XAxis type="number" hide domain={[0, totalAmount]} />
            
            {/* <Tooltip content={<CustomTooltip />} 
            cursor={{ 
        stroke: 'transparent', // Make the line color transparent
        strokeWidth: 0        // Ensure no width is used
    }}
    
     wrapperStyle={{ 
        zIndex: 1000, 
        // This ensures the wrapper element is always rendered (no flickering)
        visibility: 'visible', 
        pointerEvents: 'auto' 
    }}/> */}
            

            
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