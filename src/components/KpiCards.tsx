import { memo } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { shallowEqual } from 'react-redux';
import { selectKpis, useAppSelector } from '../store/dashboard';

const Metric = memo(function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Paper variant="outlined" sx={{ p: 2.5 }}>
      <Typography color="text.secondary" variant="body2">
        {label}
      </Typography>
      <Typography
        variant="h4"
        fontWeight={600}
        sx={{ mt: 1, fontVariantNumeric: 'tabular-nums' }}
      >
        {value}
      </Typography>
    </Paper>
  );
});

export const KpiCards = memo(function KpiCards() {
  const metrics = useAppSelector(selectKpis, shallowEqual);

  return (
    <>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(2, minmax(0, 1fr))',
            md: 'repeat(4, 1fr)',
          },
          gap: 2,
        }}
      >
        <Metric
          label="Processed events"
          value={metrics.total.toLocaleString()}
        />
        <Metric
          label="Events / last 4 batches"
          value={metrics.rate.toLocaleString()}
        />
        <Metric
          label="Success rate"
          value={`${metrics.success.toFixed(1)}%`}
        />
        <Metric label="Errors" value={metrics.errors.toLocaleString()} />
      </Box>
      <Typography variant="caption" color="text.secondary">
        Rejected messages: {metrics.rejected} · Dropped under load:{' '}
        {metrics.dropped}
      </Typography>
    </>
  );
});
