# Live Monitoring Dashboard

A React and TypeScript dashboard that monitors a continuous stream of service events. The included stream is simulated, so the app runs locally without a backend, account, or credentials.

## Requirements and setup

Use Node.js 20 or 22.

```sh
pnpm install
pnpm dev
```

Open the local URL printed by Vite. The project also supports npm:

```sh
npm install
npm run dev
```

Useful commands:

```sh
pnpm test       # Run Vitest
pnpm build      # Type-check and create a production build
pnpm preview    # Serve the production build locally
```

## What the dashboard does

- Displays processed-event totals, recent throughput, success rate, errors, rejected messages, and events dropped under load.
- Plots accepted events per batch and lists recent events, newest first.
- Provides pause/resume, status filtering, a chart time window, simulated stream load, and a disconnect/retry path.
- Keeps accepted totals cumulative for the session. Filtering affects only the event list; the chart window affects only the chart.
- Pausing stops ingestion; events missed while paused are not replayed.

The stream emits events in 100 ms bursts. Its simulated service names and messages are intentionally simple; the simulation exercises the same validation, buffering, state, and rendering path as a real source.

## Project structure

```text
src/
  App.tsx                    Page composition and connection notices
  main.tsx                   React root, providers, and theme
  components/
    ConnectionBar.tsx        Connection and stream/configuration controls
    EventsList.tsx           Filtered, virtualized event table
    KpiCards.tsx             Session metrics
    LiveChart.tsx            Throughput chart
    Loading.tsx              Connecting state
  hooks/
    useLiveStream.ts         Stream lifecycle, validation, buffering, dispatch
  services/
    streamClient.ts          Simulated transport and reconnection policy
  store/
    dashboard.ts             Shared state, reducers, limits, and selectors
    dashboard.test.ts        Store, filtering, retention, and config tests
  types/
    event.ts                 Event and connection types
  utils/
    helpers.ts               Bounded append and time formatting
    validate.ts              Runtime event schema
    validate.test.ts         Validation and helper tests
```

This layout keeps the page component as a composition root rather than a place for stream logic. `streamClient.ts` owns transport concerns; `useLiveStream.ts` adapts that transport to React and Redux; presentational components subscribe to the state they need. The separation makes it possible to replace the simulator with a WebSocket or Server-Sent Events client without spreading connection code through the UI.

## Why these technologies and patterns

- **React 18 and TypeScript:** functional components and hooks keep UI and side effects explicit; types make event and connection-state contracts visible at compile time.
- **Vite:** provides a small development/build setup and fast feedback without adding application-level framework complexity.
- **Redux Toolkit and React Redux:** the event stream feeds several independent widgets. A central store provides consistent cumulative counters and bounded history; selectors let widgets subscribe to specific derived data instead of keeping duplicate copies.
- **Batch dispatch:** incoming messages are validated and buffered, then committed together. This avoids dispatching one Redux update per event.
- **MUI:** supplies consistent, accessible controls and responsive layout primitives with little custom styling code.
- **Recharts:** provides a straightforward time-series visualization using the bounded batch-point history.
- **TanStack Virtual:** caps the number of event rows mounted in the DOM, even when the retained list contains thousands of records.
- **Zod:** TypeScript types do not validate network data at runtime. Zod checks every untrusted event before it enters application state.
- **Vitest:** keeps focused validation and store tests close to the code they protect.

Vite's build configuration splits React, UI, chart, and remaining dependencies into separate chunks. This reduces the largest individual output chunk and removes the large-chunk warning; it does not materially reduce total compressed JavaScript.

## Controls and configuration

The stream settings are stored alongside dashboard state in `src/store/dashboard.ts`, changed through typed Redux actions, and consumed by `useLiveStream.ts`. Keeping the selected values in one place ensures the controls, stream lifecycle, and chart description stay in sync.

| Setting | Options | Default | Reason |
|---|---|---:|---|
| Stream load | 100, 500, 2,000, 5,000 events/s | 100 | Lets users exercise normal and bursty input without a backend. |
| Pending buffer | 250, 500, 1,000, 2,000 events | 500 | Bounds queued, not-yet-dispatched events. If it fills, new arrivals are dropped and counted rather than allowing memory growth. |
| Batch interval | 100, 250, 500, 1,000 ms | 250 ms | Controls dispatch cadence and the maximum time an event waits for a batch. Faster flushes update the UI more often; slower flushes reduce dispatch frequency. |
| Chart window | 15, 30, 60, 120 seconds | 60 seconds | Limits the chart's visible time range without changing event history or session KPIs. |
| Retained event history | 2,000 events | Fixed | Keeps list filtering useful while placing a hard ceiling on retained event memory. |
| Chart history | 600 points | Fixed | Provides a useful rolling chart while preventing unbounded point growth. |

Pending-buffer and batch-interval changes restart the local stream with the new settings. Any pending batch is flushed before cleanup, so changing a setting does not silently discard already accepted events. The bounded history limits remain fixed deliberately; exposing them as unrestricted controls would make memory use harder to predict.

For a higher-acceptance profile under the included 5,000 events/s simulation, the measured 250-event buffer and 100 ms interval accepted more events than the defaults. A 500 ms interval reduces dispatch frequency but also reduces throughput. These settings are selectable because throughput and UI work are a trade-off, not because one configuration is best on every device.

## Performance and measurements

The pending queue, event history, and chart history are all bounded. The list is virtualized, chart animation is disabled, and memoized components/selectors limit updates to the widgets that use changed data. The `Events / last 4 batches` KPI is a batch total, not a precise wall-clock rate; its time span depends on the selected batch interval.

The following is a local Chromium production-preview sample using a 5,000 events/s input for 10 seconds. Long-task measurements use the browser Performance API, which reports tasks of at least 50 ms. Results are hardware- and browser-dependent.

| Profile | Buffer / interval | Accepted | Dropped | Long tasks | Long-task time | Longest |
|---|---:|---:|---:|---:|---:|---:|
| Default baseline | 500 / 250 ms | 20,500 | 30,500 | 1 | 53 ms | 53 ms |
| Higher acceptance | 250 / 100 ms | 25,000 | 25,750 | 0 | 0 ms | — |
| Lower dispatch frequency | 500 / 500 ms | 10,000 | 40,000 | 1 | 52 ms | 52 ms |

In this sample, the 250/100 ms profile accepted 22% more events, dropped 16% fewer, and produced no 50 ms-or-longer tasks compared with the default. The 500/500 ms profile accepted fewer events without a material long-task improvement. A zero in the long-task column means none were observed at the browser API's threshold; it does not mean the main thread did no work.

The production build before chunk splitting emitted one 891.82 kB minified JavaScript chunk (260.30 kB gzip). The current build's largest chunk is 317.37 kB minified (81.31 kB gzip), about 64% smaller by minified size. Total compressed size is similar.

## Security and resilience

- Stream messages are treated as unknown input and validated for shape, types, and maximum field sizes before dispatch. Unexpected fields are stripped.
- Messages are rendered as ordinary React text; no `dangerouslySetInnerHTML` is used.
- The client contains no secrets, and raw payloads are not logged. Connection errors shown to users are generic.
- The pending queue and retained histories are bounded. Excess events are counted as dropped.
- Connection states are explicit. Reconnection uses capped exponential backoff, allows up to five retries, then stops; the UI exposes the state and a retry action.
- Cleanup clears timers and listeners and flushes accepted pending events when settings change or the hook is removed.

This demo does not authenticate or connect to a real service. A production transport should use TLS, an appropriately secured in-memory authentication flow, and server-side frame-size and rate limits.

## Tests

```sh
pnpm test
```

Tests cover runtime validation, safe text handling, bounded history, filtering, empty batches, and ingestion-setting state. Build and runtime verification:

```sh
pnpm build
pnpm preview
```
