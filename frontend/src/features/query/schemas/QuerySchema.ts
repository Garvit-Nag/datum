import { z } from "zod";

export const QuerySchema = z.object({
  question: z
    .string()
    .min(1, "Question is required")
    .max(500, "Question must be under 500 characters"),
});

export type QuerySchemaType = z.infer<typeof QuerySchema>;
