import { z } from 'zod';
import type { LiveEvent } from '../types/event';

const eventSchema = z.object({
  id: z.string().min(1).max(80),
  timestamp: z.number().int().nonnegative().max(8640000000000000),
  service: z.string().min(1).max(80),
  status: z.enum(['success', 'warning', 'error']),
  latency: z.number().finite().min(0).max(60000),
  message: z.string().max(240),
});

export function validateEvent(raw: unknown): LiveEvent | null {
  const result = eventSchema.safeParse(raw);
  return result.success ? result.data : null;
}
