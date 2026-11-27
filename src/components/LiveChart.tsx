import { memo } from 'react';
import { Paper, Typography, Box } from '@mui/material';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { selectPoints, useAppSelector } from '../store/dashboard';
import { timeLabel } from '../utils/helpers';

export const LiveChart = memo(function LiveChart() {
  const points = useAppSelector(selectPoints);
  const flushIntervalMs = useAppSelector(
    (state) => state.dashboard.flushIntervalMs,
  );

  return (
    <Paper variant="outlined" sx={{ p: 2.5, minWidth: 0 }}>
      <Typography variant="h6">Event throughput</Typography>
      <Typography variant="body2" color="text.secondary">
        Accepted events per {flushIntervalMs} ms batch
      </Typography>
      <Box sx={{ height: 260, mt: 2, minWidth: 0 }}>
        {points.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="timestamp"
                type="number"
                domain={['dataMin', 'dataMax']}
                tickFormatter={timeLabel}
                minTickGap={35}
              />
              <YAxis allowDecimals={false} />
              <Tooltip
                labelFormatter={(value) => timeLabel(Number(value))}
              />
              <Area
                type="linear"
                dataKey="count"
                name="Events"
                stroke="#3563d5"
                fill="#dce6ff"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <Typography color="text.secondary">
            Waiting for stream data…
          </Typography>
        )}
      </Box>
    </Paper>
  );
});
