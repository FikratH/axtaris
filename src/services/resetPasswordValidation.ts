import { z } from 'zod';

export const resetPasswordConfirmSchema = z
  .object({
    password: z.string().min(1, 'validation.required').min(8, 'validation.passwordMin'),
    confirmPassword: z.string().min(1, 'validation.required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'validation.passwordMatch',
    path: ['confirmPassword'],
  });

export type ResetPasswordConfirmFormData = z.infer<typeof resetPasswordConfirmSchema>;
