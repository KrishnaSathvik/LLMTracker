import { z } from 'zod';

export const EventSchema = z.object({
  t: z.number().optional(),             // client timestamp ms
  kind: z.string(),
  url: z.string().optional(),
  method: z.string().optional(),
  durMs: z.number().optional(),
  llm: z.boolean().optional(),
  provider: z.string().optional(),
  selector: z.string().optional(),
  text: z.string().optional(),
  correlationId: z.string().nullable().optional(),
  req: z.object({
    size: z.number().nullable().optional(),
    body: z.string().nullable().optional()
  }).optional(),
  res: z.object({
    status: z.number().nullable().optional(),
    sample: z.string().nullable().optional()
  }).optional(),
  interactables: z.array(z.object({
    selector: z.string().nullable().optional(),
    text: z.string().nullable().optional(),
    intent: z.string().nullable().optional(),
    enabled: z.boolean().nullable().optional()
  })).optional(),
  layoutHash: z.string().optional()
});

export const IngestSchema = z.object({
  runId: z.string().uuid().optional(),
  context: z.object({
    url: z.string().optional()
  }).optional(),
  events: z.array(EventSchema)
});

export type Ingest = z.infer<typeof IngestSchema>;
export type Event = z.infer<typeof EventSchema>;
