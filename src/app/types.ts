import { UIMessage } from 'ai';
import { z } from 'zod';

// Define your metadata schema
export const messageMetadataSchema = z.object({
  files: z.array(z.string()).optional(),
});

export type MessageMetadata = z.infer<typeof messageMetadataSchema>;

// Create a typed UIMessage
export type FundamentosUIMessage = UIMessage<MessageMetadata>;