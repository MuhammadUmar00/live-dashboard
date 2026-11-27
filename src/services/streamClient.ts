import type { Connection, Status } from '../types/event';

interface StreamOptions {
  onMessage: (value: unknown) => void;
  onState: (state: Connection) => void;
  eventsPerSecond: number;
}

const services = ['API gateway', 'Payments', 'Database', 'Auth service'];
const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY_MS = 500;
const MAX_RETRY_DELAY_MS = 8000;

// A local transport makes the assessment runnable without credentials or a backend.
export function createStream({
  onMessage,
  onState,
  eventsPerSecond,
}: StreamOptions) {
  let timer: ReturnType<typeof setInterval> | undefined;
  let retryTimer: ReturnType<typeof setTimeout> | undefined;
  let isActive = false;
  let isConnected = false;
  let retryCount = 0;
  let sequence = 0;
  const session = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  let connectionAttempt = 0;

  const clearTimers = () => {
    clearInterval(timer);
    clearTimeout(retryTimer);
  };

  function connect() {
    if (!isActive) {
      return;
    }

    clearTimers();
    const attempt = ++connectionAttempt;
    onState(retryCount ? 'reconnecting' : 'connecting');

    retryTimer = setTimeout(() => {
      if (!isActive || attempt !== connectionAttempt) {
        return;
      }

      if (!navigator.onLine) {
        reconnect();
        return;
      }

      isConnected = true;
      retryCount = 0;
      onState('live');

      timer = setInterval(() => {
        if (!isActive || !isConnected) {
          return;
        }

        for (let i = 0; i < eventsPerSecond / 10; i++) {
          onMessage(createEvent());
        }
      }, 100);
    }, retryCount ? retryDelay(retryCount) : 350);
  }

  function createEvent() {
    const probability = Math.random();
    let status: Status = 'success';
    let message = 'Request completed';

    if (probability < 0.04) {
      status = 'error';
      message = 'Request failed';
    } else if (probability < 0.17) {
      status = 'warning';
      message = 'Slow response';
    }

    return {
      id: `${session}-${++sequence}`,
      timestamp: Date.now(),
      service: services[Math.floor(Math.random() * services.length)],
      status,
      latency: Math.round(
        20 + Math.random() * (status === 'success' ? 180 : 900),
      ),
      message,
    };
  }

  function retryDelay(retryNumber: number) {
    return Math.min(
      MAX_RETRY_DELAY_MS,
      INITIAL_RETRY_DELAY_MS * 2 ** (retryNumber - 1),
    );
  }

  function reconnect() {
    if (!isActive) {
      return;
    }

    isConnected = false;
    clearTimers();

    retryCount++;
    if (retryCount > MAX_RETRIES) {
      onState('error');
      return;
    }

    connect();
  }

  return {
    start() {
      if (isActive) {
        return;
      }

      isActive = true;
      retryCount = 0;
      connect();
    },
    pause() {
      isActive = false;
      isConnected = false;
      connectionAttempt++;
      clearTimers();
      onState('paused');
    },
    retry() {
      isActive = true;
      retryCount = 0;
      isConnected = false;
      connect();
    },
    disconnect() {
      if (isConnected) {
        reconnect();
      }
    },
    stop() {
      isActive = false;
      isConnected = false;
      connectionAttempt++;
      clearTimers();
    },
  };
}
