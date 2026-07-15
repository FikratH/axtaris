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
    // International E.164-ish: optional +, 8–15 digits (the country picker
    // produces "+<dial><national>", e.g. +994501234567).
    (val) => !val || /^\+?\d{8,15}$/.test(val.replace(/[^\d+]/g, '')),
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
