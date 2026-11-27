import { CircularProgress, Stack, Typography } from '@mui/material';

export function Loading() {
  return (
    <Stack direction="row" alignItems="center" gap={1}>
      <CircularProgress size={18} />
      <Typography variant="body2">Connecting to stream…</Typography>
    </Stack>
  );
}
