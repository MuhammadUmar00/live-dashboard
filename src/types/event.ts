export type Status = 'success' | 'warning' | 'error';
export type Connection = 'connecting' | 'live' | 'paused' | 'reconnecting' | 'error';
export interface LiveEvent {
  id: string;
  timestamp: number;
  service: string;
  status: Status;
  latency: number;
  message: string;
}

export interface Point {
  timestamp: number;
  count: number;
  latency: number;
}
