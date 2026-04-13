import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const SignUpSchema = z
  .object({
    username: z
      .string()
      .min(1, "Username is required")
      .max(10, "Username must be 10 characters or fewer")
      .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores"),
    email: z.string().email("Enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/\d/, "Password must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type LoginSchemaType = z.infer<typeof LoginSchema>;
export type SignUpSchemaType = z.infer<typeof SignUpSchema>;
