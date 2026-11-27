import { useEffect, useRef, useCallback } from 'react';
import { createStream } from '../services/streamClient';
import {
  DEFAULT_BUFFER_LIMIT,
  DEFAULT_FLUSH_INTERVAL_MS,
  receiveBatch,
  setConnection,
  useAppDispatch,
  useAppSelector,
} from '../store/dashboard';
import { validateEvent } from '../utils/validate';
import type { LiveEvent } from '../types/event';

export const FLUSH_MS = DEFAULT_FLUSH_INTERVAL_MS;
export const QUEUE_LIMIT = DEFAULT_BUFFER_LIMIT;

export function useLiveStream() {
  const dispatch = useAppDispatch();
  const rate = useAppSelector((state) => state.dashboard.rate);
  const bufferLimit = useAppSelector((state) => state.dashboard.bufferLimit);
  const flushIntervalMs = useAppSelector(
    (state) => state.dashboard.flushIntervalMs,
  );
  const client = useRef<ReturnType<typeof createStream> | null>(null);
  const paused = useRef(false);

  useEffect(() => {
    let pending: LiveEvent[] = [];
    let rejected = 0;
    let dropped = 0;

    const flush = () => {
      if (pending.length === 0 && rejected === 0 && dropped === 0) {
        return;
      }

      dispatch(
        receiveBatch({
          events: pending,
          rejected,
          dropped,
          timestamp: Date.now(),
        }),
      );
      pending = []; rejected = 0; dropped = 0;
    };

    const stream = createStream({
      eventsPerSecond: rate,
      onMessage(raw) {
        if (pending.length >= bufferLimit) {
          dropped++;
          return;
        }

        const event = validateEvent(raw);
        if (event) {
          pending.push(event);
        } else {
          rejected++;
        }
      },
      onState(state) {
        dispatch(setConnection(state));
        if (state !== 'live') {
          flush();
        }
      },
    });

    client.current = stream;
    if (paused.current) {
      stream.pause();
    } else {
      stream.start();
    }

    const interval = setInterval(flush, flushIntervalMs);
    const handleOffline = () => stream.disconnect();

    window.addEventListener('offline', handleOffline);
    return () => {
      flush();
      stream.stop();
      clearInterval(interval);
      window.removeEventListener('offline', handleOffline);
      client.current = null;
    };
  }, [dispatch, rate, bufferLimit, flushIntervalMs]);

  const pause = useCallback(() => {
    paused.current = true;
    client.current?.pause();
  }, []);

  const resume = useCallback(() => {
    paused.current = false;
    client.current?.start();
  }, []);

  const retry = useCallback(() => {
    paused.current = false;
    client.current?.retry();
  }, []);

  const disconnect = useCallback(() => {
    client.current?.disconnect();
  }, []);

  return { pause, resume, retry, disconnect };
}
