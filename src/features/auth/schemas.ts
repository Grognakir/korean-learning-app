import { z } from "zod";

export const registerSchema = z.object({
  username: z.string().min(2, "Минимум 2 символа").max(32),
  email: z.email("Некорректный email"),
  password: z.string().min(8, "Минимум 8 символов"),
});

export const loginSchema = z.object({
  email: z.email("Некорректный email"),
  password: z.string().min(1, "Введите пароль"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
