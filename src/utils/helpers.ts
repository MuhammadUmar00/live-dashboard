export function appendBounded<T>(previous: T[], incoming: T[], limit: number): T[] {
  return previous.concat(incoming).slice(-limit);
}

export function timeLabel(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString();
}
