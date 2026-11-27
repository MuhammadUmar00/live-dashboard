import { configureStore, createSlice, createSelector, type PayloadAction } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import type { Connection, LiveEvent, Point, Status } from '../types/event';
import { appendBounded } from '../utils/helpers';

export const EVENT_LIMIT = 2000;
export const POINT_LIMIT = 600;
export const DEFAULT_BUFFER_LIMIT = 500;
export const DEFAULT_FLUSH_INTERVAL_MS = 250;
export const BUFFER_LIMIT_OPTIONS = [250, 500, 1000, 2000] as const;
export const FLUSH_INTERVAL_OPTIONS = [100, 250, 500, 1000] as const;
export type BufferLimit = typeof BUFFER_LIMIT_OPTIONS[number];
export type FlushIntervalMs = typeof FLUSH_INTERVAL_OPTIONS[number];

interface DashboardState {
  connection: Connection;
  events: LiveEvent[];
  points: Point[];
  total: number;
  successes: number;
  errors: number;
  rejected: number;
  dropped: number;
  filter: Status | 'all';
  windowSeconds: number;
  rate: number;
  bufferLimit: BufferLimit;
  flushIntervalMs: FlushIntervalMs;
}

interface ReceivedBatch {
  events: LiveEvent[];
  rejected: number;
  dropped: number;
  timestamp: number;
}

const initialState: DashboardState = {
  connection: 'connecting',
  events: [],
  points: [],
  total: 0,
  successes: 0,
  errors: 0,
  rejected: 0,
  dropped: 0,
  filter: 'all',
  windowSeconds: 60,
  rate: 100,
  bufferLimit: DEFAULT_BUFFER_LIMIT,
  flushIntervalMs: DEFAULT_FLUSH_INTERVAL_MS,
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setConnection(state, action: PayloadAction<Connection>) {
      state.connection = action.payload;
    },
    setFilter(state, action: PayloadAction<DashboardState['filter']>) {
      state.filter = action.payload;
    },
    setWindow(state, action: PayloadAction<number>) {
      state.windowSeconds = action.payload;
    },
    setRate(state, action: PayloadAction<number>) {
      state.rate = action.payload;
    },
    setBufferLimit(state, action: PayloadAction<BufferLimit>) {
      state.bufferLimit = action.payload;
    },
    setFlushInterval(state, action: PayloadAction<FlushIntervalMs>) {
      state.flushIntervalMs = action.payload;
    },
    receiveBatch(state, action: PayloadAction<ReceivedBatch>) {
      const { events, rejected, dropped, timestamp } = action.payload;

      state.rejected += rejected;
      state.dropped += dropped;
      state.total += events.length;

      if (events.length === 0) {
        return;
      }

      let totalLatency = 0;
      for (const event of events) {
        if (event.status === 'success') {
          state.successes++;
        }
        if (event.status === 'error') {
          state.errors++;
        }
        totalLatency += event.latency;
      }

      state.events = appendBounded(state.events, events, EVENT_LIMIT);
      state.points = appendBounded(
        state.points,
        [
          {
            timestamp,
            count: events.length,
            latency: Math.round(totalLatency / events.length),
          },
        ],
        POINT_LIMIT,
      );
    },
  },
});

export const {
  setConnection,
  setFilter,
  setWindow,
  setRate,
  setBufferLimit,
  setFlushInterval,
  receiveBatch,
} = dashboardSlice.actions;

export const store = configureStore({
  reducer: { dashboard: dashboardSlice.reducer },
});

export type RootState = ReturnType<typeof store.getState>;
export const useAppDispatch = useDispatch.withTypes<typeof store.dispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();

const selectDashboard = (s: RootState) => s.dashboard;

export const selectEvents = createSelector(
  [
    (state: RootState) => state.dashboard.events,
    (state: RootState) => state.dashboard.filter,
  ],
  (events, filter) =>
    events.filter((event) => filter === 'all' || event.status === filter).reverse(),
);

export const selectPoints = createSelector(
  [
    (state: RootState) => state.dashboard.points,
    (state: RootState) => state.dashboard.windowSeconds,
  ],
  (points, seconds) => {
    const latestTimestamp = points.at(-1)?.timestamp ?? 0;
    const windowStart = latestTimestamp - seconds * 1000;

    return points.filter((point) => point.timestamp >= windowStart);
  },
);

export const selectKpis = createSelector([selectDashboard], (dashboard) => ({
  total: dashboard.total,
  success: dashboard.total
    ? (dashboard.successes / dashboard.total) * 100
    : 0,
  errors: dashboard.errors,
  rate: dashboard.points
    .slice(-4)
    .reduce((sum, point) => sum + point.count, 0),
  rejected: dashboard.rejected,
  dropped: dashboard.dropped,
}));
