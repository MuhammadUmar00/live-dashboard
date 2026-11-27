import { describe, expect, it } from 'vitest';
import {
  EVENT_LIMIT,
  receiveBatch,
  selectEvents,
  selectPoints,
  setBufferLimit,
  setFilter,
  setFlushInterval,
  setWindow,
  store,
} from './dashboard';
import type { LiveEvent } from '../types/event';

describe('dashboard state', () => {
  it('bounds history while retaining cumulative counts and filtering correctly', () => {
    const events: LiveEvent[] = Array.from(
      { length: EVENT_LIMIT + 10 },
      (_, index) => ({
        id: String(index),
        timestamp: index,
        service: 'API',
        status: index % 2 ? 'success' : 'error',
        latency: 20,
        message: 'test',
      }),
    );

    for (let offset = 0; offset < events.length; offset += 250) {
      store.dispatch(
        receiveBatch({
          events: events.slice(offset, offset + 250),
          rejected: offset === 0 ? 1 : 0,
          dropped: offset === 0 ? 2 : 0,
          timestamp: 3000 + offset,
        }),
      );
    }

    const state = store.getState().dashboard;
    expect(state.events.length).toBe(EVENT_LIMIT);
    expect(state.total).toBe(EVENT_LIMIT + 10);
    expect(state.rejected).toBe(1);

    store.dispatch(setFilter('error'));
    expect(
      selectEvents(store.getState()).every((event) => event.status === 'error'),
    ).toBe(true);
  });

  it('does not append chart points for empty batches', () => {
    store.dispatch(setWindow(60));
    const before = selectPoints(store.getState()).length;
    store.dispatch(
      receiveBatch({
        events: [],
        rejected: 0,
        dropped: 0,
        timestamp: Date.now(),
      }),
    );

    expect(selectPoints(store.getState()).length).toBe(before);
  });

  it('stores the selected ingestion buffer and flush interval', () => {
    store.dispatch(setBufferLimit(1000));
    store.dispatch(setFlushInterval(500));

    expect(store.getState().dashboard).toMatchObject({
      bufferLimit: 1000,
      flushIntervalMs: 500,
    });
  });
});
