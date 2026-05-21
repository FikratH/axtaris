import {
  Application,
  ApplicationStatus,
  CandidateProfile,
  Certification,
  Education,
  LanguageSkill,
  Notification,
  SubscriptionPlanCode,
  User,
  WorkExperience,
} from '@/types/models';
import {
  mockEmployerUser,
} from './mockData';
import { getSupabase, shouldUseMockBackend } from './supabase';
import {
  mapVacancy,
  SupabaseVacancyRow,
  vacancySelect,
} from './vacancyService';
import {
  getMockApplicationById,
  getMockEmployerApplications,
  getMockNotifications,
  markAllMockNotificationsRead,
  markMockNotificationRead,
  updateMockApplicationReview,
  updateMockApplicationStatus,
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
  profiles:
    | {
        id: string;
        email: string;
        role: User['role'];
        full_name: string;
        phone: string | null;
        avatar_url: string | null;
        email_verified: boolean | null;
        created_at: string;
        updated_at: string;
      }
    | Array<{
        id: string;
        email: string;
        role: User['role'];
        full_name: string;
        phone: string | null;
        avatar_url: string | null;
        email_verified: boolean | null;
        created_at: string;
        updated_at: string;
      }>
    | null;
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

interface SupabaseApplicationRow {
  id: string;
  vacancy_id: string;
  candidate_id: string;
  status: ApplicationStatus;
  subscription_plan?: SubscriptionPlanCode;
  visibility_score?: number;
  cover_letter: string | null;
  cv_url: string | null;
  employer_notes: string | null;
  employer_rating: number | null;
  applied_at: string;
  reviewed_at: string | null;
  updated_at: string;
  vacancies: SupabaseVacancyRow | SupabaseVacancyRow[] | null;
  candidate_profiles: CandidateProfileRow | CandidateProfileRow[] | null;
}

interface NotificationRow {
  id: string;
  user_id: string;
  type: Notification['type'];
  title: string;
  body: string;
  data: Record<string, string> | null;
  read: boolean;
  created_at: string;
}

function unwrapVacancy(
  value: SupabaseVacancyRow | SupabaseVacancyRow[] | null
): SupabaseVacancyRow | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] || null : value;
}

function unwrapCandidateProfile(
  value: CandidateProfileRow | CandidateProfileRow[] | null
): CandidateProfileRow | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] || null : value;
}

function mapUserFromProfile(row: CandidateProfileRow['profiles']): User | undefined {
  if (!row) return undefined;

  const profileRow = Array.isArray(row) ? row[0] : row;

  if (!profileRow) return undefined;

  return {
    id: profileRow.id,
    email: profileRow.email,
    role: profileRow.role,
    fullName: profileRow.full_name,
    phone: profileRow.phone || undefined,
    avatarUrl: profileRow.avatar_url || undefined,
    emailVerified: profileRow.email_verified ?? false,
    createdAt: profileRow.created_at,
    updatedAt: profileRow.updated_at,
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

function mapCandidateProfile(row: CandidateProfileRow): CandidateProfile & { user?: User } {
  const workExperience = [...(row.work_experiences || [])]
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    .map(mapWorkExperience);
  const education = [...(row.education || [])]
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    .map(mapEducation);

  return {
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
    languages: (row.language_skills || []).map(mapLanguageSkill),
    certifications: (row.certifications || []).map(mapCertification),
    portfolioUrl: row.portfolio_url || undefined,
    cvUrl: row.cv_url || undefined,
    cvFileName: row.cv_file_name || undefined,
    availability: row.availability || undefined,
    workPreference: row.work_preference || undefined,
    profileCompleteness: row.profile_completeness || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    user: mapUserFromProfile(row.profiles),
  };
}

function mapApplication(row: SupabaseApplicationRow): Application {
  const vacancyRow = unwrapVacancy(row.vacancies);
  const candidateProfileRow = unwrapCandidateProfile(row.candidate_profiles);

  return {
    id: row.id,
    vacancyId: row.vacancy_id,
    candidateId: row.candidate_id,
    status: row.status,
    subscriptionPlan: row.subscription_plan,
    visibilityScore: row.visibility_score,
    coverLetter: row.cover_letter || undefined,
    cvUrl: row.cv_url || undefined,
    employerNotes: row.employer_notes || undefined,
    employerRating: row.employer_rating || undefined,
    vacancy: vacancyRow ? mapVacancy(vacancyRow) : undefined,
    candidate: candidateProfileRow
      ? mapCandidateProfile(candidateProfileRow)
      : undefined,
    appliedAt: row.applied_at,
    reviewedAt: row.reviewed_at || undefined,
    updatedAt: row.updated_at,
  };
}

function mapNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    body: row.body,
    data: row.data || undefined,
    read: row.read,
    createdAt: row.created_at,
  };
}

class EngagementService {
  async fetchEmployerApplications(userId: string): Promise<Application[]> {
    if (!userId) return [];

    if (shouldUseMockBackend()) {
      return getMockEmployerApplications(userId);
    }

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
        employer_notes,
        employer_rating,
        applied_at,
        reviewed_at,
        updated_at,
        vacancies (
          ${vacancySelect}
        ),
        candidate_profiles (
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
          ),
          profiles (
            id,
            email,
            role,
            full_name,
            phone,
            avatar_url,
            email_verified,
            created_at,
            updated_at
          )
        )
      `)
      .order('visibility_score', { ascending: false })
      .order('applied_at', { ascending: false });

    if (error) throw new Error(error.message);

    return ((data || []) as unknown as SupabaseApplicationRow[])
      .map(mapApplication)
      .filter((application) => application.vacancy?.company?.ownerId === userId);
  }

  async updateApplicationStatus(
    userId: string,
    applicationId: string,
    status: ApplicationStatus
  ): Promise<Application> {
    if (!userId || !applicationId) {
      throw new Error('User id and application id are required');
    }

    if (shouldUseMockBackend()) {
      const application = getMockApplicationById(applicationId);

      if (!application) {
        throw new Error('Application not found');
      }

      if (application.vacancy?.company?.ownerId !== userId) {
        throw new Error('Application not found');
      }

      return updateMockApplicationStatus(applicationId, status);
    }

    const { data, error } = await getSupabase()
      .from('applications')
      .update({
        status,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', applicationId)
      .select(`
        id,
        vacancy_id,
        candidate_id,
        status,
        subscription_plan,
        visibility_score,
        cover_letter,
        cv_url,
        employer_notes,
        employer_rating,
        applied_at,
        reviewed_at,
        updated_at,
        vacancies (
          ${vacancySelect}
        ),
        candidate_profiles (
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
          ),
          profiles (
            id,
            email,
            role,
            full_name,
            phone,
            avatar_url,
            email_verified,
            created_at,
            updated_at
          )
        )
      `)
      .single();

    if (error) throw new Error(error.message);

    return mapApplication(data as unknown as SupabaseApplicationRow);
  }

  async updateApplicationReview(
    userId: string,
    applicationId: string,
    review: { employerNotes?: string; employerRating?: number }
  ): Promise<Application> {
    if (!userId || !applicationId) {
      throw new Error('User id and application id are required');
    }

    const employerNotes = review.employerNotes?.trim() || null;
    const employerRating = review.employerRating ?? null;

    if (employerRating !== null && (employerRating < 1 || employerRating > 5)) {
      throw new Error('Rating must be between 1 and 5');
    }

    if (shouldUseMockBackend()) {
      const application = getMockApplicationById(applicationId);

      if (!application) {
        throw new Error('Application not found');
      }

      if (application.vacancy?.company?.ownerId !== userId) {
        throw new Error('Application not found');
      }

      return updateMockApplicationReview(applicationId, {
        employerNotes: employerNotes || undefined,
        employerRating: employerRating || undefined,
      });
    }

    const { data, error } = await getSupabase()
      .from('applications')
      .update({
        employer_notes: employerNotes,
        employer_rating: employerRating,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', applicationId)
      .select(`
        id,
        vacancy_id,
        candidate_id,
        status,
        subscription_plan,
        visibility_score,
        cover_letter,
        cv_url,
        employer_notes,
        employer_rating,
        applied_at,
        reviewed_at,
        updated_at,
        vacancies (
          ${vacancySelect}
        ),
        candidate_profiles (
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
          ),
          profiles (
            id,
            email,
            role,
            full_name,
            phone,
            avatar_url,
            email_verified,
            created_at,
            updated_at
          )
        )
      `)
      .single();

    if (error) throw new Error(error.message);

    return mapApplication(data as unknown as SupabaseApplicationRow);
  }

  async fetchNotifications(userId: string): Promise<Notification[]> {
    if (!userId) return [];

    if (shouldUseMockBackend()) {
      return getMockNotifications(userId);
    }

    const { data, error } = await getSupabase()
      .from('notifications')
      .select('id, user_id, type, title, body, data, read, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return ((data || []) as NotificationRow[]).map(mapNotification);
  }

  async markNotificationRead(notificationId: string): Promise<Notification> {
    if (!notificationId) {
      throw new Error('Notification id is required');
    }

    if (shouldUseMockBackend()) {
      return markMockNotificationRead(notificationId);
    }

    const { data, error } = await getSupabase()
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .select('id, user_id, type, title, body, data, read, created_at')
      .single();

    if (error) throw new Error(error.message);

    return mapNotification(data as NotificationRow);
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    if (!userId) {
      throw new Error('User id is required');
    }

    if (shouldUseMockBackend()) {
      markAllMockNotificationsRead(userId);
      return;
    }

    const { error } = await getSupabase()
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw new Error(error.message);
  }
}

export const engagementService = new EngagementService();
