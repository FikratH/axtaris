/**
 * Form validation schemas (zod v4).
 *
 * These schemas are the only thing standing between user input and the DB on the
 * create AND edit paths — every screen validates via `safeParse` on submit, and
 * the same schema object backs both paths (e.g. `vacancyFormSchema` is used by
 * app/vacancy/create.tsx and app/vacancy/edit/[id].tsx alike), so a gap here is a
 * gap on both. Messages are i18n KEYS, not prose; `firstIssueMessage` is what the
 * screens surface, so the key identity is asserted rather than the rendered text.
 *
 * Date fields are zero-padded ISO `YYYY-MM-DD` strings (see DateField, which emits
 * `${year}-${pad(month)}-${pad(day)}`), which is why the schemas can compare them
 * lexicographically — these tests pin that assumption down.
 */
import {
  certificationSchema,
  companyProfileSchema,
  educationSchema,
  experienceSchema,
  firstIssueMessage,
  forgotPasswordSchema,
  otpSchema,
  signInSchema,
  signUpEmployerSchema,
  signUpSchema,
  vacancyFormSchema,
} from './validation';

describe('vacancyFormSchema — salary range (create + edit share this schema)', () => {
  const base = { title: 'Backend Developer', description: 'Build things.' };

  it('rejects salaryMin greater than salaryMax and points the error at salaryMax', () => {
    const result = vacancyFormSchema.safeParse({ ...base, salaryMin: '5000', salaryMax: '1000' });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(firstIssueMessage(result.error)).toBe('validation.salaryRange');
    expect(result.error.issues[0]?.path).toEqual(['salaryMax']);
  });

  it('accepts min equal to max (a fixed salary is a valid range)', () => {
    expect(vacancyFormSchema.safeParse({ ...base, salaryMin: '3000', salaryMax: '3000' }).success).toBe(true);
  });

  it('accepts a well-ordered range', () => {
    expect(vacancyFormSchema.safeParse({ ...base, salaryMin: '1000', salaryMax: '5000' }).success).toBe(true);
  });

  it('skips the range check when either bound is absent or blank (both are optional)', () => {
    expect(vacancyFormSchema.safeParse({ ...base, salaryMax: '1000' }).success).toBe(true);
    expect(vacancyFormSchema.safeParse({ ...base, salaryMin: '5000' }).success).toBe(true);
    expect(vacancyFormSchema.safeParse({ ...base, salaryMin: '  ', salaryMax: '1000' }).success).toBe(true);
    expect(vacancyFormSchema.safeParse(base).success).toBe(true);
  });

  it('rejects non-numeric salaries (the field feeds an integer column)', () => {
    const result = vacancyFormSchema.safeParse({ ...base, salaryMin: '3000 AZN' });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(firstIssueMessage(result.error)).toBe('validation.salaryNumber');
  });

  it('rejects negative and decimal salaries', () => {
    expect(vacancyFormSchema.safeParse({ ...base, salaryMin: '-500' }).success).toBe(false);
    expect(vacancyFormSchema.safeParse({ ...base, salaryMin: '10.5' }).success).toBe(false);
  });

  it('requires a title and a description, rejecting whitespace-only input', () => {
    expect(vacancyFormSchema.safeParse({ ...base, title: '   ' }).success).toBe(false);
    expect(vacancyFormSchema.safeParse({ ...base, description: '   ' }).success).toBe(false);
  });

  it('compares salaries numerically, not lexicographically', () => {
    // '9' > '10' as strings; the schema must parse to integers before comparing.
    expect(vacancyFormSchema.safeParse({ ...base, salaryMin: '9', salaryMax: '10' }).success).toBe(true);
    expect(vacancyFormSchema.safeParse({ ...base, salaryMin: '10', salaryMax: '9' }).success).toBe(false);
  });
});

describe('experienceSchema — work experience dates', () => {
  const base = { jobTitle: 'Developer', company: 'Acme', startDate: '2020-01-01', isCurrent: false };

  it('rejects an end date earlier than the start date', () => {
    const result = experienceSchema.safeParse({ ...base, endDate: '2019-01-01' });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(firstIssueMessage(result.error)).toBe('validation.dateRange');
    expect(result.error.issues[0]?.path).toEqual(['endDate']);
  });

  it('accepts an end date equal to the start date (a same-day stint)', () => {
    expect(experienceSchema.safeParse({ ...base, endDate: '2020-01-01' }).success).toBe(true);
  });

  it('requires an end date when the role is not current', () => {
    const result = experienceSchema.safeParse(base);

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(firstIssueMessage(result.error)).toBe('validation.required');
    expect(result.error.issues[0]?.path).toEqual(['endDate']);
  });

  it('waives the end date entirely when the role is current', () => {
    expect(experienceSchema.safeParse({ ...base, isCurrent: true }).success).toBe(true);
  });

  it('does not range-check a stale end date left behind when "current" is ticked', () => {
    // The screen keeps the previously entered endDate in state when the user
    // ticks "I currently work here"; isCurrent short-circuits both refinements,
    // and the service writes `end_date: item.endDate || null` guarded by is_current.
    expect(experienceSchema.safeParse({ ...base, isCurrent: true, endDate: '2019-01-01' }).success).toBe(true);
  });

  it('requires job title and company, rejecting whitespace-only input', () => {
    expect(experienceSchema.safeParse({ ...base, jobTitle: '   ', endDate: '2021-01-01' }).success).toBe(false);
    expect(experienceSchema.safeParse({ ...base, company: '   ', endDate: '2021-01-01' }).success).toBe(false);
  });

  it('orders zero-padded ISO dates correctly across month and day boundaries', () => {
    // Lexicographic comparison is only chronological because DateField zero-pads.
    expect(experienceSchema.safeParse({ ...base, startDate: '2020-09-01', endDate: '2020-10-01' }).success).toBe(true);
    expect(experienceSchema.safeParse({ ...base, startDate: '2020-10-01', endDate: '2020-09-01' }).success).toBe(false);
    expect(experienceSchema.safeParse({ ...base, startDate: '2020-01-09', endDate: '2020-01-10' }).success).toBe(true);
    expect(experienceSchema.safeParse({ ...base, startDate: '2020-01-10', endDate: '2020-01-09' }).success).toBe(false);
  });
});

describe('educationSchema — education dates', () => {
  const base = {
    degree: 'BSc',
    fieldOfStudy: 'Computer Science',
    institution: 'BSU',
    startDate: '2016-09-01',
    isCurrent: false,
  };

  it('rejects an end date earlier than the start date', () => {
    const result = educationSchema.safeParse({ ...base, endDate: '2015-01-01' });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(firstIssueMessage(result.error)).toBe('validation.dateRange');
    expect(result.error.issues[0]?.path).toEqual(['endDate']);
  });

  it('requires an end date unless currently studying', () => {
    expect(educationSchema.safeParse(base).success).toBe(false);
    expect(educationSchema.safeParse({ ...base, isCurrent: true }).success).toBe(true);
  });

  it('accepts a well-ordered range', () => {
    expect(educationSchema.safeParse({ ...base, endDate: '2020-06-01' }).success).toBe(true);
  });

  it('requires degree, field of study and institution', () => {
    const withEnd = { ...base, endDate: '2020-06-01' };
    expect(educationSchema.safeParse({ ...withEnd, degree: '  ' }).success).toBe(false);
    expect(educationSchema.safeParse({ ...withEnd, fieldOfStudy: '  ' }).success).toBe(false);
    expect(educationSchema.safeParse({ ...withEnd, institution: '  ' }).success).toBe(false);
  });
});

describe('certificationSchema', () => {
  const base = { name: 'AWS Solutions Architect', issuer: 'Amazon', issueDate: '2023-01-01' };

  it('requires name, issuer and issue date', () => {
    expect(certificationSchema.safeParse({ ...base, name: '  ' }).success).toBe(false);
    expect(certificationSchema.safeParse({ ...base, issuer: '  ' }).success).toBe(false);
    expect(certificationSchema.safeParse({ ...base, issueDate: '' }).success).toBe(false);
  });

  it('accepts a valid certification with and without a credential URL', () => {
    expect(certificationSchema.safeParse(base).success).toBe(true);
    expect(certificationSchema.safeParse({ ...base, credentialUrl: 'credly.com/abc' }).success).toBe(true);
    expect(certificationSchema.safeParse({ ...base, credentialUrl: 'https://credly.com/abc' }).success).toBe(true);
  });

  it('rejects a malformed credential URL', () => {
    const result = certificationSchema.safeParse({ ...base, credentialUrl: 'not a url' });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(firstIssueMessage(result.error)).toBe('validation.invalidUrl');
  });

  it('rejects an expiry date earlier than the issue date', () => {
    const result = certificationSchema.safeParse({ ...base, expiryDate: '2020-01-01' });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(firstIssueMessage(result.error)).toBe('validation.dateRange');
    expect(result.error.issues[0]?.path).toEqual(['expiryDate']);
  });
});

describe('auth schemas', () => {
  it('signInSchema requires a well-formed email and a 6+ char password', () => {
    expect(signInSchema.safeParse({ email: 'a@b.com', password: 'secret' }).success).toBe(true);
    expect(signInSchema.safeParse({ email: 'not-an-email', password: 'secret' }).success).toBe(false);
    expect(signInSchema.safeParse({ email: 'a@b.com', password: 'short' }).success).toBe(false);
  });

  it('reports the empty-field key rather than the format key for a blank email', () => {
    const result = signInSchema.safeParse({ email: '', password: 'secret' });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(firstIssueMessage(result.error)).toBe('validation.required');
  });

  it('signUpSchema enforces an 8+ char password — stricter than sign-in', () => {
    const base = { fullName: 'Ali', email: 'a@b.com', password: 'sevench', confirmPassword: 'sevench' };
    expect(signUpSchema.safeParse(base).success).toBe(false);
    expect(signUpSchema.safeParse({ ...base, password: 'eightchr', confirmPassword: 'eightchr' }).success).toBe(true);
  });

  it('signUpSchema rejects mismatched passwords and blames confirmPassword', () => {
    const result = signUpSchema.safeParse({
      fullName: 'Ali',
      email: 'a@b.com',
      password: 'password1',
      confirmPassword: 'password2',
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(firstIssueMessage(result.error)).toBe('validation.passwordMatch');
    expect(result.error.issues[0]?.path).toEqual(['confirmPassword']);
  });

  it('signUpSchema treats companyName as optional but signUpEmployerSchema requires it', () => {
    const base = {
      fullName: 'Ali',
      email: 'a@b.com',
      password: 'password1',
      confirmPassword: 'password1',
    };
    expect(signUpSchema.safeParse(base).success).toBe(true);
    expect(signUpEmployerSchema.safeParse(base).success).toBe(false);
    expect(signUpEmployerSchema.safeParse({ ...base, companyName: 'Acme' }).success).toBe(true);
  });

  it('accepts E.164 phone numbers and rejects too-short/too-long ones', () => {
    const base = {
      fullName: 'Ali',
      email: 'a@b.com',
      password: 'password1',
      confirmPassword: 'password1',
    };
    expect(signUpSchema.safeParse({ ...base, phone: '+994501234567' }).success).toBe(true);
    expect(signUpSchema.safeParse({ ...base, phone: '+994 50 123 45 67' }).success).toBe(true);
    expect(signUpSchema.safeParse({ ...base, phone: '' }).success).toBe(true);
    expect(signUpSchema.safeParse({ ...base, phone: '12345' }).success).toBe(false);
    expect(signUpSchema.safeParse({ ...base, phone: '1234567890123456' }).success).toBe(false);
  });

  it('forgotPasswordSchema validates the email', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'a@b.com' }).success).toBe(true);
    expect(forgotPasswordSchema.safeParse({ email: 'nope' }).success).toBe(false);
  });

  it('otpSchema accepts exactly six digits', () => {
    expect(otpSchema.safeParse({ code: '123456' }).success).toBe(true);
    expect(otpSchema.safeParse({ code: '12345' }).success).toBe(false);
    expect(otpSchema.safeParse({ code: '1234567' }).success).toBe(false);
    expect(otpSchema.safeParse({ code: '12345a' }).success).toBe(false);
  });
});

describe('companyProfileSchema', () => {
  it('requires a name and accepts a bare domain or a full URL', () => {
    expect(companyProfileSchema.safeParse({ name: 'Acme' }).success).toBe(true);
    expect(companyProfileSchema.safeParse({ name: 'Acme', website: 'acme.az' }).success).toBe(true);
    expect(companyProfileSchema.safeParse({ name: 'Acme', website: 'https://acme.az/jobs' }).success).toBe(true);
    expect(companyProfileSchema.safeParse({ name: '   ', website: 'acme.az' }).success).toBe(false);
    expect(companyProfileSchema.safeParse({ name: 'Acme', website: 'acme' }).success).toBe(false);
  });
});

describe('firstIssueMessage', () => {
  it('returns the first issue message so screens can show one inline error', () => {
    const result = vacancyFormSchema.safeParse({ title: '', description: '' });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues.length).toBeGreaterThan(1);
    expect(firstIssueMessage(result.error)).toBe(result.error.issues[0].message);
  });
});
