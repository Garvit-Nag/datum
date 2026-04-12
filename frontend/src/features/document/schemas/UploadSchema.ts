import { z } from "zod";

export const UploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine(
      (f) => f.type === "application/pdf" || f.name.endsWith(".txt") || f.name.endsWith(".pdf"),
      { message: "Only PDF or TXT files are accepted" },
    )
    .refine((f) => f.size <= 20 * 1024 * 1024, { message: "File must be under 20 MB" }),
});

export type UploadSchemaType = z.infer<typeof UploadSchema>;
