import { UIMessage } from 'ai';
import { z } from 'zod';

// Define your metadata schema
export const messageMetadataSchema = z.object({
  cycle: z.string().optional(),
  title: z.string().optional(),
  author: z.string().optional(),
});

export type MessageMetadata = z.infer<typeof messageMetadataSchema>;

// Create a typed UIMessage
export type FundamentosUIMessage = UIMessage<MessageMetadata>;