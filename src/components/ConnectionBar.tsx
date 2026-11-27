import { memo } from 'react';
import { Button, Chip, MenuItem, Stack, TextField } from '@mui/material';
import {
  BUFFER_LIMIT_OPTIONS,
  FLUSH_INTERVAL_OPTIONS,
  setBufferLimit,
  setFlushInterval,
  setRate,
  setWindow,
  useAppDispatch,
  useAppSelector,
} from '../store/dashboard';

interface ConnectionBarProps {
  pause: () => void;
  resume: () => void;
  retry: () => void;
  disconnect: () => void;
}

const streamRates = [100, 500, 2000, 5000];
const chartWindows = [15, 30, 60, 120];

export const ConnectionBar = memo(function ConnectionBar({
  pause,
  resume,
  retry,
  disconnect,
}: ConnectionBarProps) {
  const connection = useAppSelector((state) => state.dashboard.connection);
  const rate = useAppSelector((state) => state.dashboard.rate);
  const windowSeconds = useAppSelector(
    (state) => state.dashboard.windowSeconds,
  );
  const bufferLimit = useAppSelector(
    (state) => state.dashboard.bufferLimit,
  );
  const flushIntervalMs = useAppSelector(
    (state) => state.dashboard.flushIntervalMs,
  );
  const dispatch = useAppDispatch();

  const handleBufferLimitChange = (value: string) => {
    const selected = BUFFER_LIMIT_OPTIONS.find(
      (option) => option === Number(value),
    );

    if (selected !== undefined) {
      dispatch(setBufferLimit(selected));
    }
  };

  const handleFlushIntervalChange = (value: string) => {
    const selected = FLUSH_INTERVAL_OPTIONS.find(
      (option) => option === Number(value),
    );

    if (selected !== undefined) {
      dispatch(setFlushInterval(selected));
    }
  };

  const handleConnection = () => {
    if (connection === 'paused') {
      resume();
    } else if (connection === 'error') {
      retry();
    } else {
      pause();
    }
  };

  const connectionAction =
    connection === 'paused'
      ? 'Resume'
      : connection === 'error'
        ? 'Retry'
        : 'Pause';
  const connectionColor =
    connection === 'live'
      ? 'success'
      : connection === 'error'
        ? 'error'
        : 'default';

  return (
    <Stack
      direction="row"
      flexWrap="wrap"
      gap={1.5}
      alignItems="center"
    >
      <Chip
        role="status"
        label={connection}
        color={connectionColor}
        sx={{ textTransform: 'capitalize' }}
      />
      <Button variant="contained" onClick={handleConnection}>
        {connectionAction}
      </Button>
      <Button
        variant="outlined"
        disabled={connection !== 'live'}
        onClick={disconnect}
      >
        Simulate disconnect
      </Button>
      <TextField
        select
        size="small"
        label="Stream load"
        value={rate}
        onChange={(event) => dispatch(setRate(Number(event.target.value)))}
      >
        {streamRates.map((eventsPerSecond) => (
          <MenuItem key={eventsPerSecond} value={eventsPerSecond}>
            {eventsPerSecond} events/s
          </MenuItem>
        ))}
      </TextField>
      <TextField
        select
        size="small"
        label="Chart window"
        value={windowSeconds}
        onChange={(event) =>
          dispatch(setWindow(Number(event.target.value)))
        }
      >
        {chartWindows.map((seconds) => (
          <MenuItem key={seconds} value={seconds}>
            {seconds} seconds
          </MenuItem>
        ))}
      </TextField>
      <TextField
        select
        size="small"
        label="Pending buffer"
        value={bufferLimit}
        onChange={(event) => handleBufferLimitChange(event.target.value)}
      >
        {BUFFER_LIMIT_OPTIONS.map((limit) => (
          <MenuItem key={limit} value={limit}>
            {limit} events
          </MenuItem>
        ))}
      </TextField>
      <TextField
        select
        size="small"
        label="Batch interval"
        value={flushIntervalMs}
        onChange={(event) => handleFlushIntervalChange(event.target.value)}
      >
        {FLUSH_INTERVAL_OPTIONS.map((interval) => (
          <MenuItem key={interval} value={interval}>
            {interval} ms
          </MenuItem>
        ))}
      </TextField>
    </Stack>
  );
});
