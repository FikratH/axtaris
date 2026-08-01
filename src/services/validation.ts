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

// ── Reusable optional fields for content editors ────────────

// Accepts a bare domain ("example.com") or a full URL ("https://example.com/x").
const optionalUrlField = z
  .string()
  .optional()
  .refine(
    (val) =>
      !val ||
      !val.trim() ||
      /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/\S*)?$/i.test(val.trim()),
    { message: 'validation.invalidUrl' }
  );

const optionalSalaryField = z
  .string()
  .optional()
  .refine((val) => !val || !val.trim() || /^\d+$/.test(val.trim()), {
    message: 'validation.salaryNumber',
  });

// ── Vacancy (create + edit) ─────────────────────────────────

export const vacancyFormSchema = z
  .object({
    title: z.string().trim().min(1, 'validation.required'),
    description: z.string().trim().min(1, 'validation.required'),
    salaryMin: optionalSalaryField,
    salaryMax: optionalSalaryField,
  })
  .refine(
    (data) => {
      const min = data.salaryMin?.trim();
      const max = data.salaryMax?.trim();
      if (!min || !max) return true;
      return Number.parseInt(min, 10) <= Number.parseInt(max, 10);
    },
    { message: 'validation.salaryRange', path: ['salaryMax'] }
  );

// ── Candidate profile (portfolio URL) ───────────────────────

export const candidateProfileSchema = z.object({
  portfolioUrl: optionalUrlField,
});

// ── Employer company ────────────────────────────────────────

export const companyProfileSchema = z.object({
  name: z.string().trim().min(1, 'validation.required'),
  website: optionalUrlField,
});

// ── Work experience ─────────────────────────────────────────

export const experienceSchema = z
  .object({
    jobTitle: z.string().trim().min(1, 'validation.required'),
    company: z.string().trim().min(1, 'validation.required'),
    startDate: z.string().min(1, 'validation.required'),
    endDate: z.string().optional(),
    isCurrent: z.boolean(),
  })
  .refine((data) => data.isCurrent || !!data.endDate, {
    message: 'validation.required',
    path: ['endDate'],
  })
  .refine((data) => data.isCurrent || !data.endDate || data.endDate >= data.startDate, {
    message: 'validation.dateRange',
    path: ['endDate'],
  });

// ── Education ───────────────────────────────────────────────

export const educationSchema = z
  .object({
    degree: z.string().trim().min(1, 'validation.required'),
    fieldOfStudy: z.string().trim().min(1, 'validation.required'),
    institution: z.string().trim().min(1, 'validation.required'),
    startDate: z.string().min(1, 'validation.required'),
    endDate: z.string().optional(),
    isCurrent: z.boolean(),
  })
  .refine((data) => data.isCurrent || !!data.endDate, {
    message: 'validation.required',
    path: ['endDate'],
  })
  .refine((data) => data.isCurrent || !data.endDate || data.endDate >= data.startDate, {
    message: 'validation.dateRange',
    path: ['endDate'],
  });

// ── Language ────────────────────────────────────────────────

export const languageSchema = z.object({
  language: z.string().trim().min(1, 'validation.required'),
});

// ── Certification ───────────────────────────────────────────

export const certificationSchema = z.object({
  name: z.string().trim().min(1, 'validation.required'),
  issuer: z.string().trim().min(1, 'validation.required'),
  issueDate: z.string().min(1, 'validation.required'),
  credentialUrl: optionalUrlField,
});

// ── OTP verification ────────────────────────────────────────

export const otpSchema = z.object({
  code: z.string().regex(/^\d{6}$/, 'validation.otpCode'),
});

/**
 * The first zod issue message (an i18n key) for surfacing a single inline/dialog
 * error on screens that validate on submit via `safeParse`.
 */
export function firstIssueMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'errors.generic';
}
