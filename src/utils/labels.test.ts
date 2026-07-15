import type { TFunction } from 'i18next';
import {
  getApplicationStatusPresentation,
  getVacancyStatusPresentation,
  getVerificationPresentation,
} from '@/utils/labels';
import type {
  ApplicationStatus,
  VacancyStatus,
  VerificationStatus,
} from '@/types/models';

// Identity translator: returns the key so we can assert exactly which key was used.
const tr = ((key: string) => key) as unknown as TFunction;

describe('getApplicationStatusPresentation', () => {
  it('defaults to the employer audience and maps status to a semantic variant', () => {
    const cases: Array<[ApplicationStatus, string]> = [
      ['pending', 'warning'],
      ['reviewed', 'info'],
      ['shortlisted', 'success'],
      ['accepted', 'success'],
      ['rejected', 'error'],
    ];

    cases.forEach(([status, variant]) => {
      const result = getApplicationStatusPresentation(tr, status);
      expect(result.label).toBe(`employer.status.${status}`);
      expect(result.variant).toBe(variant);
    });
  });

  it('uses candidate-namespaced labels for the candidate audience', () => {
    const result = getApplicationStatusPresentation(tr, 'shortlisted', 'candidate');
    expect(result.label).toBe('candidate.shortlisted');
    expect(result.variant).toBe('success');
  });
});

describe('getVacancyStatusPresentation', () => {
  it('maps every vacancy status to its label key and variant', () => {
    const cases: Array<[VacancyStatus, string, string]> = [
      ['active', 'employer.status.active', 'success'],
      ['draft', 'employer.status.draft', 'default'],
      ['pending_moderation', 'employer.status.pendingModeration', 'warning'],
      ['paused', 'employer.status.paused', 'info'],
      ['closed', 'employer.status.closed', 'default'],
      ['rejected', 'employer.status.rejected', 'error'],
    ];

    cases.forEach(([status, label, variant]) => {
      const result = getVacancyStatusPresentation(tr, status);
      expect(result.label).toBe(label);
      expect(result.variant).toBe(variant);
    });
  });
});

describe('getVerificationPresentation', () => {
  it('maps verified to a success tone', () => {
    const result = getVerificationPresentation(tr, 'verified');
    expect(result).toMatchObject({
      label: 'employer.verified',
      description: 'employer.verifiedDescription',
      variant: 'success',
      tone: 'success',
    });
  });

  it('maps pending to a warning tone', () => {
    const result = getVerificationPresentation(tr, 'pending');
    expect(result).toMatchObject({
      label: 'employer.pending_verification',
      variant: 'warning',
      tone: 'warning',
    });
  });

  it('maps rejected to an error tone', () => {
    const result = getVerificationPresentation(tr, 'rejected');
    expect(result).toMatchObject({
      label: 'employer.notVerified',
      variant: 'error',
      tone: 'error',
    });
  });

  it('maps not_verified (default) to a neutral tone', () => {
    const result = getVerificationPresentation(tr, 'not_verified' as VerificationStatus);
    expect(result).toMatchObject({
      label: 'employer.notVerified',
      variant: 'default',
      tone: 'neutral',
    });
  });
});
