import { memo, useRef } from 'react';
import { Box, Chip, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import { useVirtualizer } from '@tanstack/react-virtual';
import { selectEvents, setFilter, useAppDispatch, useAppSelector } from '../store/dashboard';
import type { LiveEvent, Status } from '../types/event';
import { timeLabel } from '../utils/helpers';

const columns = 'minmax(95px, 1fr) minmax(120px, 1fr) 100px 90px minmax(150px, 2fr)';
const statusOptions: Array<Status | 'all'> = [
  'all',
  'success',
  'warning',
  'error',
];
const columnHeadings = ['Time', 'Service', 'Status', 'Latency', 'Message'];

interface EventRowProps {
  event: LiveEvent;
}

const EventRow = memo(function EventRow({ event }: EventRowProps) {
  const statusColor =
    event.status === 'error'
      ? 'error'
      : event.status === 'warning'
        ? 'warning'
        : 'success';

  return (
    <Box
      role="row"
      sx={{
        display: 'grid',
        gridTemplateColumns: columns,
        gap: 1,
        alignItems: 'center',
        height: 48,
        px: 2,
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Typography role="cell" variant="body2">
        {timeLabel(event.timestamp)}
      </Typography>
      <Typography role="cell" variant="body2" noWrap>
        {event.service}
      </Typography>
      <Box role="cell">
        <Chip size="small" label={event.status} color={statusColor} />
      </Box>
      <Typography role="cell" variant="body2">
        {event.latency} ms
      </Typography>
      <Typography
        role="cell"
        variant="body2"
        noWrap
        title={event.message}
      >
        {event.message}
      </Typography>
    </Box>
  );
});

export const EventsList = memo(function EventsList() {
  const events = useAppSelector(selectEvents);
  const filter = useAppSelector((state) => state.dashboard.filter);
  const dispatch = useAppDispatch();
  const scrollRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: events.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 48,
    overscan: 5,
  });

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        gap={1}
        flexWrap="wrap"
      >
        <Box>
          <Typography variant="h6">Recent events</Typography>
          <Typography variant="caption" color="text.secondary">
            {events.length} retained matching events · newest first
          </Typography>
        </Box>
        <TextField
          select
          size="small"
          label="Status"
          value={filter}
          onChange={(event) =>
            dispatch(setFilter(event.target.value as Status | 'all'))
          }
        >
          {statusOptions.map((status) => (
            <MenuItem key={status} value={status}>
              {status}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      <Box sx={{ overflowX: 'auto', mt: 2 }}>
        <Box role="table" aria-label="Recent events" sx={{ minWidth: 620 }}>
          <Box
            role="row"
            sx={{
              display: 'grid',
              gridTemplateColumns: columns,
              gap: 1,
              px: 2,
              py: 1,
              bgcolor: 'action.hover',
            }}
          >
            {columnHeadings.map((heading) => (
              <Typography
                role="columnheader"
                key={heading}
                variant="body2"
                fontWeight={600}
              >
                {heading}
              </Typography>
            ))}
          </Box>
          <Box
            ref={scrollRef}
            role="rowgroup"
            sx={{ height: 336, overflowY: 'auto', overflowAnchor: 'none' }}
          >
            {events.length > 0 ? (
              <Box
                sx={{
                  height: virtualizer.getTotalSize(),
                  position: 'relative',
                }}
              >
                {virtualizer.getVirtualItems().map((row) => (
                  <Box
                    key={events[row.index].id}
                    sx={{
                      position: 'absolute',
                      top: row.start,
                      left: 0,
                      right: 0,
                    }}
                  >
                    <EventRow event={events[row.index]} />
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography sx={{ p: 3 }} color="text.secondary">
                No matching events.
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
    </Paper>
  );
});
