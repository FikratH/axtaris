import {
  Application,
  CandidateProfile,
  Certification,
  Education,
  LanguageSkill,
  ScreeningAnswer,
  SubscriptionPlanCode,
  WorkExperience,
} from '@/types/models';
import {
  mockCandidateProfile,
  mockVacancies,
} from './mockData';
import i18n from '@/i18n';
import { dedupeBy } from '@/utils/profileSections';
import { calculateProfileCompletenessFromItems } from '@/utils/profileCompletion';
import { getSupabase, shouldUseMockBackend } from './supabase';
import { subscriptionService } from './subscriptionService';
import {
  mapVacancy,
  SupabaseVacancyRow,
  vacancySelect,
} from './vacancyService';
import {
  addMockApplication,
  createMockEmployerApplicationNotification,
  getMockApplicationByVacancyId,
  getMockCandidateApplications,
} from './mockEngagementState';

interface CandidateProfileRow {
  id: string;
  user_id: string;
  title: string | null;
  bio: string | null;
  location: string | null;
  expected_salary: number | null;
  salary_currency: string | null;
  skills: string[] | null;
  availability: CandidateProfile['availability'] | null;
  work_preference: CandidateProfile['workPreference'] | null;
  portfolio_url: string | null;
  cv_url: string | null;
  cv_file_name: string | null;
  profile_completeness: number | null;
  created_at: string;
  updated_at: string;
  work_experiences?: WorkExperienceRow[] | null;
  education?: EducationRow[] | null;
  language_skills?: LanguageSkillRow[] | null;
  certifications?: CertificationRow[] | null;
}

interface WorkExperienceRow {
  id: string;
  job_title: string;
  company: string;
  location: string | null;
  start_date: string;
  end_date: string | null;
  is_current: boolean | null;
  description: string | null;
  highlights: string[] | null;
  sort_order: number | null;
}

interface EducationRow {
  id: string;
  degree: string;
  field_of_study: string;
  institution: string;
  start_date: string;
  end_date: string | null;
  is_current: boolean | null;
  description: string | null;
  sort_order: number | null;
}

interface LanguageSkillRow {
  id: string;
  language: string;
  level: LanguageSkill['level'];
}

interface CertificationRow {
  id: string;
  name: string;
  issuer: string;
  issue_date: string;
  expiry_date: string | null;
  credential_url: string | null;
}

export interface CandidateProfileMutationInput {
  title?: string;
  bio?: string;
  location?: string;
  expectedSalary?: number;
  salaryCurrency?: string;
  skills?: string[];
  portfolioUrl?: string;
  cvUrl?: string;
  cvFileName?: string;
  availability?: CandidateProfile['availability'];
  workPreference?: CandidateProfile['workPreference'];
  workExperience?: WorkExperience[];
  education?: Education[];
  languages?: LanguageSkill[];
  certifications?: Certification[];
}

interface SupabaseApplicationRow {
  id: string;
  vacancy_id: string;
  candidate_id: string;
  status: Application['status'];
  subscription_plan?: SubscriptionPlanCode;
  visibility_score?: number;
  cover_letter: string | null;
  cv_url: string | null;
  screening_answers: ScreeningAnswer[] | null;
  applied_at: string;
  reviewed_at: string | null;
  updated_at: string;
  vacancies: SupabaseVacancyRow | SupabaseVacancyRow[] | null;
}

function unwrapVacancy(
  value: SupabaseVacancyRow | SupabaseVacancyRow[] | null
): SupabaseVacancyRow | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] || null : value;
}

function mapApplication(row: SupabaseApplicationRow): Application {
  const vacancyRow = unwrapVacancy(row.vacancies);

  return {
    id: row.id,
    vacancyId: row.vacancy_id,
    candidateId: row.candidate_id,
    status: row.status,
    subscriptionPlan: row.subscription_plan,
    visibilityScore: row.visibility_score,
    coverLetter: row.cover_letter || undefined,
    cvUrl: row.cv_url || undefined,
    screeningAnswers: row.screening_answers || [],
    vacancy: vacancyRow ? mapVacancy(vacancyRow) : undefined,
    appliedAt: row.applied_at,
    reviewedAt: row.reviewed_at || undefined,
    updatedAt: row.updated_at,
  };
}

function mapWorkExperience(row: WorkExperienceRow): WorkExperience {
  return {
    id: row.id,
    jobTitle: row.job_title,
    company: row.company,
    location: row.location || undefined,
    startDate: row.start_date,
    endDate: row.end_date || undefined,
    isCurrent: row.is_current ?? false,
    description: row.description || undefined,
    highlights: row.highlights || [],
  };
}

function mapEducation(row: EducationRow): Education {
  return {
    id: row.id,
    degree: row.degree,
    fieldOfStudy: row.field_of_study,
    institution: row.institution,
    startDate: row.start_date,
    endDate: row.end_date || undefined,
    isCurrent: row.is_current ?? false,
    description: row.description || undefined,
  };
}

function mapLanguageSkill(row: LanguageSkillRow): LanguageSkill {
  return {
    id: row.id,
    language: row.language,
    level: row.level,
  };
}

function mapCertification(row: CertificationRow): Certification {
  return {
    id: row.id,
    name: row.name,
    issuer: row.issuer,
    issueDate: row.issue_date,
    expiryDate: row.expiry_date || undefined,
    credentialUrl: row.credential_url || undefined,
  };
}

function cloneCandidateProfile(profile: CandidateProfile): CandidateProfile {
  return {
    ...profile,
    skills: [...profile.skills],
    workExperience: profile.workExperience.map((item) => ({
      ...item,
      highlights: item.highlights ? [...item.highlights] : undefined,
    })),
    education: profile.education.map((item) => ({ ...item })),
    languages: profile.languages.map((item) => ({ ...item })),
    certifications: profile.certifications.map((item) => ({ ...item })),
  };
}

// Delegates to the shared checklist in '@/utils/profileCompletion' so the stat,
// the "steps to 100%" screen, and the persisted value always agree.
function calculateProfileCompleteness(profile: CandidateProfile): number {
  return calculateProfileCompletenessFromItems(profile);
}

function mapCandidateProfile(row: CandidateProfileRow): CandidateProfile {
  const workExperience = dedupeBy(
    [...(row.work_experiences || [])]
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      .map(mapWorkExperience),
    (item) =>
      `${item.jobTitle}|${item.company}|${item.location ?? ''}|${item.startDate}|${item.endDate ?? ''}|${item.isCurrent}|${item.description ?? ''}`
  );
  const education = dedupeBy(
    [...(row.education || [])]
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      .map(mapEducation),
    (item) =>
      `${item.degree}|${item.fieldOfStudy}|${item.institution}|${item.startDate}|${item.endDate ?? ''}|${item.isCurrent}|${item.description ?? ''}`
  );
  const languages = dedupeBy(
    (row.language_skills || []).map(mapLanguageSkill),
    (item) => `${item.language.trim().toLowerCase()}|${item.level}`
  );
  const certifications = dedupeBy(
    (row.certifications || []).map(mapCertification),
    (item) => `${item.name}|${item.issuer}|${item.issueDate}|${item.expiryDate ?? ''}|${item.credentialUrl ?? ''}`
  );

  const profile: CandidateProfile = {
    id: row.id,
    userId: row.user_id,
    title: row.title || undefined,
    bio: row.bio || undefined,
    location: row.location || undefined,
    expectedSalary: row.expected_salary || undefined,
    salaryCurrency: row.salary_currency || undefined,
    skills: row.skills || [],
    workExperience,
    education,
    languages,
    certifications,
    portfolioUrl: row.portfolio_url || undefined,
    cvUrl: row.cv_url || undefined,
    cvFileName: row.cv_file_name || undefined,
    availability: row.availability || undefined,
    workPreference: row.work_preference || undefined,
    profileCompleteness: row.profile_completeness || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  return {
    ...profile,
    profileCompleteness: calculateProfileCompleteness(profile),
  };
}

function normalizeCandidateProfile(
  profile: CandidateProfile,
  updates: CandidateProfileMutationInput
): CandidateProfile {
  const normalized: CandidateProfile = {
    ...profile,
    ...updates,
    title: updates.title !== undefined ? updates.title.trim() || undefined : profile.title,
    bio: updates.bio !== undefined ? updates.bio.trim() || undefined : profile.bio,
    location: updates.location !== undefined ? updates.location.trim() || undefined : profile.location,
    expectedSalary: updates.expectedSalary !== undefined ? updates.expectedSalary : profile.expectedSalary,
    salaryCurrency:
      updates.salaryCurrency !== undefined ? updates.salaryCurrency || undefined : profile.salaryCurrency,
    skills:
      updates.skills !== undefined
        ? Array.from(new Set(updates.skills.map((item) => item.trim()).filter(Boolean)))
        : [...profile.skills],
    portfolioUrl:
      updates.portfolioUrl !== undefined ? updates.portfolioUrl.trim() || undefined : profile.portfolioUrl,
    cvUrl: updates.cvUrl !== undefined ? updates.cvUrl.trim() || undefined : profile.cvUrl,
    cvFileName:
      updates.cvFileName !== undefined ? updates.cvFileName.trim() || undefined : profile.cvFileName,
    availability: updates.availability !== undefined ? updates.availability : profile.availability,
    workPreference:
      updates.workPreference !== undefined ? updates.workPreference : profile.workPreference,
    workExperience:
      updates.workExperience !== undefined
        ? updates.workExperience.map((item) => ({
            ...item,
            highlights: item.highlights ? [...item.highlights] : undefined,
          }))
        : profile.workExperience.map((item) => ({
            ...item,
            highlights: item.highlights ? [...item.highlights] : undefined,
          })),
    education:
      updates.education !== undefined
        ? updates.education.map((item) => ({ ...item }))
        : profile.education.map((item) => ({ ...item })),
    languages:
      updates.languages !== undefined
        ? updates.languages.map((item) => ({ ...item }))
        : profile.languages.map((item) => ({ ...item })),
    certifications:
      updates.certifications !== undefined
        ? updates.certifications.map((item) => ({ ...item }))
        : profile.certifications.map((item) => ({ ...item })),
    updatedAt: new Date().toISOString(),
  };

  return {
    ...normalized,
    profileCompleteness: calculateProfileCompleteness(normalized),
  };
}

type CandidateChildTable =
  | 'work_experiences'
  | 'education'
  | 'language_skills'
  | 'certifications';

/**
 * Reconcile a candidate child table so it contains exactly `nextItems`.
 *
 * We insert the desired rows fresh (letting Postgres mint canonical UUIDs),
 * then delete every other row for the candidate. Insert-first keeps existing
 * data intact if the insert fails, and the trailing delete removes any
 * legacy/duplicate rows — so the table self-heals from previously duplicated
 * data (e.g. seeded rows whose ids were re-inserted by the old sync logic).
 */
async function reconcileChildRows<T>(
  table: CandidateChildTable,
  candidateId: string,
  nextItems: T[],
  toRow: (item: T, index: number) => Record<string, unknown>
) {
  const supabase = getSupabase();
  const hasItems = nextItems.length > 0;
  let keepIds: string[] = [];

  if (hasItems) {
    const { data, error } = await supabase
      .from(table)
      .insert(nextItems.map((item, index) => toRow(item, index)))
      .select('id');

    if (error) throw new Error(error.message);

    keepIds = ((data || []) as Array<{ id: string }>).map((row) => row.id);

    // The insert reported success but returned no rows (e.g. a table with an
    // INSERT policy but no SELECT policy). Refuse to continue — otherwise the
    // delete below would wipe every existing row for this candidate.
    if (keepIds.length === 0) {
      throw new Error(i18n.t('common.error'));
    }
  }

  // Delete strategy keys off the caller's intent, not the insert result: when
  // there are desired items keep the freshly-inserted ids and drop everything
  // else (self-heals legacy duplicates); when the desired set is empty, clear all.
  const baseDelete = supabase.from(table).delete().eq('candidate_id', candidateId);
  const { error: deleteError } = hasItems
    ? await baseDelete.not('id', 'in', `(${keepIds.join(',')})`)
    : await baseDelete;

  if (deleteError) throw new Error(deleteError.message);
}

async function syncWorkExperiences(
  candidateId: string,
  _currentItems: WorkExperience[],
  nextItems: WorkExperience[]
) {
  await reconcileChildRows('work_experiences', candidateId, nextItems, (item, index) => ({
    candidate_id: candidateId,
    job_title: item.jobTitle,
    company: item.company,
    location: item.location || null,
    start_date: item.startDate,
    end_date: item.endDate || null,
    is_current: item.isCurrent,
    description: item.description || null,
    highlights: item.highlights || [],
    sort_order: index,
  }));
}

async function syncEducation(
  candidateId: string,
  _currentItems: Education[],
  nextItems: Education[]
) {
  await reconcileChildRows('education', candidateId, nextItems, (item, index) => ({
    candidate_id: candidateId,
    degree: item.degree,
    field_of_study: item.fieldOfStudy,
    institution: item.institution,
    start_date: item.startDate,
    end_date: item.endDate || null,
    is_current: item.isCurrent,
    description: item.description || null,
    sort_order: index,
  }));
}

async function syncLanguageSkills(
  candidateId: string,
  _currentItems: LanguageSkill[],
  nextItems: LanguageSkill[]
) {
  await reconcileChildRows('language_skills', candidateId, nextItems, (item) => ({
    candidate_id: candidateId,
    language: item.language,
    level: item.level,
  }));
}

async function syncCertifications(
  candidateId: string,
  _currentItems: Certification[],
  nextItems: Certification[]
) {
  await reconcileChildRows('certifications', candidateId, nextItems, (item) => ({
    candidate_id: candidateId,
    name: item.name,
    issuer: item.issuer,
    issue_date: item.issueDate,
    expiry_date: item.expiryDate || null,
    credential_url: item.credentialUrl || null,
  }));
}

let mockSavedJobIds: string[] | null = null;

function getMockSavedJobIds(): string[] {
  if (mockSavedJobIds === null) {
    mockSavedJobIds = ['1', '3'];
  }
  return mockSavedJobIds;
}

class CandidateVacancyService {
  async fetchCandidateProfile(userId: string): Promise<CandidateProfile | null> {
    if (!userId) return null;

    if (shouldUseMockBackend()) {
      return mockCandidateProfile.userId === userId
        ? cloneCandidateProfile(mockCandidateProfile)
        : null;
    }

    const { data, error } = await getSupabase()
      .from('candidate_profiles')
      .select(`
        id,
        user_id,
        title,
        bio,
        location,
        expected_salary,
        salary_currency,
        skills,
        availability,
        work_preference,
        portfolio_url,
        cv_url,
        cv_file_name,
        profile_completeness,
        created_at,
        updated_at,
        work_experiences (
          id,
          job_title,
          company,
          location,
          start_date,
          end_date,
          is_current,
          description,
          highlights,
          sort_order
        ),
        education (
          id,
          degree,
          field_of_study,
          institution,
          start_date,
          end_date,
          is_current,
          description,
          sort_order
        ),
        language_skills (
          id,
          language,
          level
        ),
        certifications (
          id,
          name,
          issuer,
          issue_date,
          expiry_date,
          credential_url
        )
      `)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return null;

    return mapCandidateProfile(data as CandidateProfileRow);
  }

  async updateCandidateProfile(
    userId: string,
    updates: CandidateProfileMutationInput
  ): Promise<CandidateProfile> {
    if (!userId) {
      throw new Error('User id is required');
    }

    const currentProfile = await this.fetchCandidateProfile(userId);

    if (!currentProfile) {
      throw new Error('Candidate profile not found');
    }

    const nextProfile = normalizeCandidateProfile(currentProfile, updates);

    if (shouldUseMockBackend()) {
      Object.assign(mockCandidateProfile, cloneCandidateProfile(nextProfile));
      return cloneCandidateProfile(mockCandidateProfile);
    }

    const { error } = await getSupabase()
      .from('candidate_profiles')
      .update({
        title: nextProfile.title || null,
        bio: nextProfile.bio || null,
        location: nextProfile.location || null,
        expected_salary: nextProfile.expectedSalary ?? null,
        salary_currency: nextProfile.salaryCurrency || 'AZN',
        skills: nextProfile.skills,
        availability: nextProfile.availability || null,
        work_preference: nextProfile.workPreference || null,
        portfolio_url: nextProfile.portfolioUrl || null,
        cv_url: nextProfile.cvUrl || null,
        cv_file_name: nextProfile.cvFileName || null,
        profile_completeness: nextProfile.profileCompleteness,
      })
      .eq('id', currentProfile.id);

    if (error) throw new Error(error.message);

    await syncWorkExperiences(
      currentProfile.id,
      currentProfile.workExperience,
      nextProfile.workExperience
    );
    await syncEducation(currentProfile.id, currentProfile.education, nextProfile.education);
    await syncLanguageSkills(currentProfile.id, currentProfile.languages, nextProfile.languages);
    await syncCertifications(
      currentProfile.id,
      currentProfile.certifications,
      nextProfile.certifications
    );

    return this.fetchCandidateProfile(userId).then((profile) => {
      if (!profile) {
        throw new Error('Candidate profile not found');
      }

      return profile;
    });
  }

  async fetchSavedJobIds(userId: string): Promise<string[]> {
    if (!userId) return [];

    if (shouldUseMockBackend()) {
      return [...getMockSavedJobIds()];
    }

    const { data, error } = await getSupabase()
      .from('saved_jobs')
      .select('vacancy_id')
      .eq('user_id', userId)
      .order('saved_at', { ascending: false });

    if (error) throw new Error(error.message);

    return (data || []).map((item: { vacancy_id: string }) => item.vacancy_id);
  }

  async toggleSavedJob(userId: string, vacancyId: string): Promise<string[]> {
    if (!userId || !vacancyId) {
      throw new Error('User and vacancy are required');
    }

    if (shouldUseMockBackend()) {
      const ids = getMockSavedJobIds();
      if (ids.includes(vacancyId)) {
        mockSavedJobIds = ids.filter((id) => id !== vacancyId);
      } else {
        mockSavedJobIds = [...ids, vacancyId];
      }
      return [...mockSavedJobIds];
    }

    const { data: existing, error: existingError } = await getSupabase()
      .from('saved_jobs')
      .select('id')
      .eq('user_id', userId)
      .eq('vacancy_id', vacancyId)
      .maybeSingle();

    if (existingError) throw new Error(existingError.message);

    if (existing?.id) {
      const { error } = await getSupabase()
        .from('saved_jobs')
        .delete()
        .eq('id', existing.id);

      if (error) throw new Error(error.message);
    } else {
      const { error } = await getSupabase()
        .from('saved_jobs')
        .insert({ user_id: userId, vacancy_id: vacancyId });

      if (error) throw new Error(error.message);
    }

    return this.fetchSavedJobIds(userId);
  }

  async fetchCandidateApplications(userId: string): Promise<Application[]> {
    if (!userId) return [];

    if (shouldUseMockBackend()) {
      return getMockCandidateApplications(userId);
    }

    const profile = await this.fetchCandidateProfile(userId);

    if (!profile) return [];

    const { data, error } = await getSupabase()
      .from('applications')
      .select(`
        id,
        vacancy_id,
        candidate_id,
        status,
        subscription_plan,
        visibility_score,
        cover_letter,
        cv_url,
        screening_answers,
        applied_at,
        reviewed_at,
        updated_at,
        vacancies (
          ${vacancySelect}
        )
      `)
      .eq('candidate_id', profile.id)
      .order('applied_at', { ascending: false });

    if (error) throw new Error(error.message);

    return ((data || []) as SupabaseApplicationRow[]).map(mapApplication);
  }

  async applyToVacancy(
    userId: string,
    vacancyId: string,
    answers?: ScreeningAnswer[]
  ): Promise<Application> {
    if (!userId || !vacancyId) {
      throw new Error('User and vacancy are required');
    }

    const screeningAnswers = answers && answers.length > 0 ? answers : [];

    const subscriptionSummary = await subscriptionService.fetchCandidateSubscriptionSummary(userId);

    if (!subscriptionSummary) {
      throw new Error('Subscription not found');
    }

    if (
      subscriptionSummary.dailyApplicationLimit !== null &&
      (subscriptionSummary.applicationsRemainingToday ?? 0) <= 0
    ) {
      throw new Error('Daily application limit reached for current subscription plan');
    }

    if (shouldUseMockBackend()) {
      if (mockCandidateProfile.userId !== userId) {
        throw new Error('Candidate profile not found');
      }

      const existing = getMockApplicationByVacancyId(vacancyId);
      if (existing) {
        return existing;
      }

      const vacancy = mockVacancies.find((item) => item.id === vacancyId);

      if (!vacancy) {
        throw new Error('Vacancy not found');
      }

      const application = addMockApplication({
        id: `mock-app-${Date.now()}`,
        vacancyId,
        candidateId: mockCandidateProfile.id,
        status: 'pending',
        subscriptionPlan: subscriptionSummary.subscription.plan,
        visibilityScore: subscriptionSummary.visibilityScore,
        vacancy,
        cvUrl: mockCandidateProfile.cvUrl,
        screeningAnswers,
        appliedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      createMockEmployerApplicationNotification(application);

      return application;
    }

    const profile = await this.fetchCandidateProfile(userId);

    if (!profile) {
      throw new Error('Candidate profile not found');
    }

    const applicationSelect = `
        id,
        vacancy_id,
        candidate_id,
        status,
        subscription_plan,
        visibility_score,
        cover_letter,
        cv_url,
        screening_answers,
        applied_at,
        reviewed_at,
        updated_at,
        vacancies (
          ${vacancySelect}
        )
      `;

    // Idempotent apply: if this candidate already applied to this vacancy, return
    // the existing application instead of inserting a duplicate (which would trip
    // the dedupe unique index and surface a raw constraint error). Mirrors mock.
    const { data: existing, error: existingError } = await getSupabase()
      .from('applications')
      .select(applicationSelect)
      .eq('vacancy_id', vacancyId)
      .eq('candidate_id', profile.id)
      .limit(1)
      .maybeSingle();

    if (existingError) throw new Error(existingError.message);

    if (existing) {
      return mapApplication(existing as SupabaseApplicationRow);
    }

    const { data, error } = await getSupabase()
      .from('applications')
      .insert({
        vacancy_id: vacancyId,
        candidate_id: profile.id,
        cv_url: profile.cvUrl || null,
        screening_answers: screeningAnswers,
      })
      .select(applicationSelect)
      .single();

    if (error) throw new Error(error.message);

    return mapApplication(data as SupabaseApplicationRow);
  }
}

export const candidateVacancyService = new CandidateVacancyService();
