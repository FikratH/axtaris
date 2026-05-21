import { z } from 'zod';

// ── Reusable field schemas ──────────────────────────────────

const emailField = z.email('validation.invalidEmail');

const passwordField = z
  .string()
  .min(1, 'validation.required')
  .min(8, 'validation.passwordMin');

const phoneField = z
  .string()
  .optional()
  .refine(
    (val) => !val || /^\+?994\s?\d{2}\s?\d{3}\s?\d{2}\s?\d{2}$/.test(val.replace(/\s/g, '')),
    { message: 'validation.invalidPhone' }
  );

// ── Sign-In ─────────────────────────────────────────────────

export const signInSchema = z.object({
  email: z.string().min(1, 'validation.required').pipe(emailField),
  password: z.string().min(1, 'validation.required').min(6, 'validation.passwordMin'),
});

export type SignInFormData = z.infer<typeof signInSchema>;

// ── Sign-Up ─────────────────────────────────────────────────

export const signUpSchema = z
  .object({
    fullName: z.string().min(1, 'validation.required'),
    companyName: z.string().optional(),
    email: z.string().min(1, 'validation.required').pipe(emailField),
    phone: phoneField,
    password: passwordField,
    confirmPassword: z.string().min(1, 'validation.required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'validation.passwordMatch',
    path: ['confirmPassword'],
  });

export type SignUpFormData = z.infer<typeof signUpSchema>;

// ── Sign-Up with employer company name required ─────────────

export const signUpEmployerSchema = z
  .object({
    fullName: z.string().min(1, 'validation.required'),
    companyName: z.string().min(1, 'validation.required'),
    email: z.string().min(1, 'validation.required').pipe(emailField),
    phone: phoneField,
    password: passwordField,
    confirmPassword: z.string().min(1, 'validation.required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'validation.passwordMatch',
    path: ['confirmPassword'],
  });

// ── Forgot Password ─────────────────────────────────────────

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'validation.required').pipe(emailField),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
