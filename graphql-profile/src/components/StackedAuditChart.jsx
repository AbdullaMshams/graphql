import Box from '@mui/material/Box';
import { BarChart } from '@mui/x-charts/BarChart';

export default function StackedAuditChart({ xLabels, doneData, receivedData }) {
  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <BarChart
        xAxis={[{ data: xLabels, scaleType: 'band' }]}
        yAxis={[{ label: 'Audit Amount' }]}
        series={[
          {
            data: doneData,
            label: 'Audits Done',
            id: 'done',
            stack: 'audit',
            color: '#22c55e',
          },
          {
            data: receivedData,
            label: 'Audits Received',
            id: 'received',
            stack: 'audit',
            color: '#ef4444',
          },
        ]}
        sx={{
          '& .MuiChartsAxis-root text': {
            fill: 'white',
            fontSize: 10,
          },
        }}
      />
    </Box>
  );
}
