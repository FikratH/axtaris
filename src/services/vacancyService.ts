import { Company, ExperienceLevel, ScreeningQuestion, TopCompany, Vacancy, VacancyStatus, WorkType } from '@/types/models';
import { mockCompanies, mockVacancies } from './mockData';
import { getSupabase, shouldUseMockBackend } from './supabase';

export interface SupabaseCompanyRow {
  id: string;
  name: string;
  industry: string;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  website: string | null;
  employee_count: string | null;
  location: string | null;
  founded_year: number | null;
  verification_status: Company['verificationStatus'];
  rating: number | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface SupabaseVacancyRow {
  id: string;
  title: string;
  description: string;
  requirements: string[] | null;
  responsibilities: string[] | null;
  benefits: string[] | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  show_salary: boolean | null;
  city: string;
  work_type: Vacancy['workType'];
  experience_level: Vacancy['experienceLevel'];
  skills: string[] | null;
  company_id: string;
  status: Vacancy['status'];
  applicant_count: number | null;
  view_count: number | null;
  response_rate: number | null;
  expires_at: string | null;
  screening_questions: ScreeningQuestion[] | null;
  created_at: string;
  updated_at: string;
  companies: SupabaseCompanyRow | SupabaseCompanyRow[] | null;
}

export interface VacancyMutationInput {
  title: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  showSalary: boolean;
  city: string;
  workType: WorkType;
  experienceLevel: ExperienceLevel;
  skills: string[];
  companyId: string;
  status: VacancyStatus;
  screeningQuestions: ScreeningQuestion[];
}

export interface CompanyMutationInput {
  name?: string;
  industry?: string;
  description?: string;
  logoUrl?: string;
  coverUrl?: string;
  website?: string;
  employeeCount?: string;
  location?: string;
  foundedYear?: number;
}

export const companySelect = `
  id,
  name,
  industry,
  description,
  logo_url,
  cover_url,
  website,
  employee_count,
  location,
  founded_year,
  verification_status,
  rating,
  owner_id,
  created_at,
  updated_at
`;

export const vacancySelect = `
  id,
  title,
  description,
  requirements,
  responsibilities,
  benefits,
  salary_min,
  salary_max,
  salary_currency,
  show_salary,
  city,
  work_type,
  experience_level,
  skills,
  company_id,
  status,
  applicant_count,
  view_count,
  response_rate,
  expires_at,
  screening_questions,
  created_at,
  updated_at,
  companies (
    ${companySelect}
  )
`;

function unwrapCompany(
  value: SupabaseCompanyRow | SupabaseCompanyRow[] | null
): SupabaseCompanyRow | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] || null : value;
}

export function mapCompany(row: SupabaseCompanyRow): Company {
  return {
    id: row.id,
    name: row.name,
    industry: row.industry,
    description: row.description || undefined,
    logoUrl: row.logo_url || undefined,
    coverUrl: row.cover_url || undefined,
    website: row.website || undefined,
    employeeCount: row.employee_count || undefined,
    location: row.location || undefined,
    foundedYear: row.founded_year || undefined,
    verificationStatus: row.verification_status,
    rating: row.rating || undefined,
    ownerId: row.owner_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// "Top companies" ranking: verified employers first, then by rating, then by
// how actively they're hiring (active vacancy count).
function sortTopCompanies(a: TopCompany, b: TopCompany): number {
  const av = a.verificationStatus === 'verified' ? 1 : 0;
  const bv = b.verificationStatus === 'verified' ? 1 : 0;
  if (av !== bv) return bv - av;
  const ar = a.rating || 0;
  const br = b.rating || 0;
  if (ar !== br) return br - ar;
  return b.activeVacancyCount - a.activeVacancyCount;
}

export function mapVacancy(row: SupabaseVacancyRow): Vacancy {
  const companyRow = unwrapCompany(row.companies);

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    requirements: row.requirements || [],
    responsibilities: row.responsibilities || [],
    benefits: row.benefits || [],
    salaryMin: row.salary_min || undefined,
    salaryMax: row.salary_max || undefined,
    salaryCurrency: row.salary_currency || 'AZN',
    showSalary: row.show_salary ?? true,
    city: row.city,
    workType: row.work_type,
    experienceLevel: row.experience_level,
    skills: row.skills || [],
    companyId: row.company_id,
    company: companyRow ? mapCompany(companyRow) : undefined,
    status: row.status,
    applicantCount: row.applicant_count || 0,
    viewCount: row.view_count || 0,
    responseRate: row.response_rate || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    expiresAt: row.expires_at || undefined,
    screeningQuestions: row.screening_questions || [],
  };
}

function getMockCandidateVacancies(): Vacancy[] {
  return mockVacancies.filter((vacancy) => vacancy.status === 'active');
}

class VacancyService {
  async fetchCandidateVacancies(): Promise<Vacancy[]> {
    if (shouldUseMockBackend()) {
      return getMockCandidateVacancies();
    }

    const { data, error } = await getSupabase()
      .from('vacancies')
      .select(vacancySelect)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return ((data || []) as SupabaseVacancyRow[]).map(mapVacancy);
  }

  async fetchEmployerVacancies(userId: string): Promise<Vacancy[]> {
    if (!userId) return [];

    if (shouldUseMockBackend()) {
      return mockVacancies.filter((vacancy) => vacancy.company?.ownerId === userId);
    }

    const { data, error } = await getSupabase()
      .from('vacancies')
      .select(vacancySelect)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return ((data || []) as SupabaseVacancyRow[])
      .map(mapVacancy)
      .filter((vacancy) => vacancy.company?.ownerId === userId);
  }

  async fetchEmployerCompany(userId: string): Promise<Company | null> {
    if (!userId) return null;

    if (shouldUseMockBackend()) {
      return mockCompanies.find((company) => company.ownerId === userId) || null;
    }

    const { data, error } = await getSupabase()
      .from('companies')
      .select(companySelect)
      .eq('owner_id', userId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return null;

    return mapCompany(data as SupabaseCompanyRow);
  }

  async updateEmployerCompany(
    companyId: string,
    updates: CompanyMutationInput
  ): Promise<Company> {
    if (!companyId) {
      throw new Error('Company id is required');
    }

    const normalized: CompanyMutationInput = {
      name: updates.name !== undefined ? updates.name.trim() || undefined : undefined,
      industry: updates.industry !== undefined ? updates.industry.trim() || undefined : undefined,
      description:
        updates.description !== undefined ? updates.description.trim() || undefined : undefined,
      logoUrl: updates.logoUrl !== undefined ? updates.logoUrl.trim() || undefined : undefined,
      coverUrl: updates.coverUrl !== undefined ? updates.coverUrl.trim() || undefined : undefined,
      website: updates.website !== undefined ? updates.website.trim() || undefined : undefined,
      employeeCount:
        updates.employeeCount !== undefined ? updates.employeeCount.trim() || undefined : undefined,
      location: updates.location !== undefined ? updates.location.trim() || undefined : undefined,
      foundedYear: updates.foundedYear,
    };

    if (shouldUseMockBackend()) {
      const company = mockCompanies.find((item) => item.id === companyId);

      if (!company) {
        throw new Error('Company not found');
      }

      Object.assign(company, {
        ...normalized,
        updatedAt: new Date().toISOString(),
      });

      return { ...company };
    }

    const { data, error } = await getSupabase()
      .from('companies')
      .update({
        name: normalized.name || null,
        industry: normalized.industry || null,
        description: normalized.description || null,
        logo_url: normalized.logoUrl || null,
        cover_url: normalized.coverUrl || null,
        website: normalized.website || null,
        employee_count: normalized.employeeCount || null,
        location: normalized.location || null,
        founded_year: normalized.foundedYear ?? null,
      })
      .eq('id', companyId)
      .select(companySelect)
      .single();

    if (error) throw new Error(error.message);

    return mapCompany(data as SupabaseCompanyRow);
  }

  async fetchCompanyById(id: string): Promise<Company | null> {
    if (!id) return null;

    if (shouldUseMockBackend()) {
      return mockCompanies.find((company) => company.id === id) || null;
    }

    const { data, error } = await getSupabase()
      .from('companies')
      .select(companySelect)
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return null;

    return mapCompany(data as SupabaseCompanyRow);
  }

  async fetchCompanyVacancies(companyId: string): Promise<Vacancy[]> {
    if (!companyId) return [];

    if (shouldUseMockBackend()) {
      return mockVacancies.filter(
        (vacancy) => vacancy.companyId === companyId && vacancy.status === 'active'
      );
    }

    const { data, error } = await getSupabase()
      .from('vacancies')
      .select(vacancySelect)
      .eq('company_id', companyId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return ((data || []) as SupabaseVacancyRow[]).map(mapVacancy);
  }

  async fetchVacancyById(id: string): Promise<Vacancy | null> {
    if (!id) return null;

    if (shouldUseMockBackend()) {
      return mockVacancies.find((vacancy) => vacancy.id === id) || null;
    }

    const { data, error } = await getSupabase()
      .from('vacancies')
      .select(vacancySelect)
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return null;

    return mapVacancy(data as SupabaseVacancyRow);
  }

  async fetchTopCompanies(limit = 12): Promise<TopCompany[]> {
    if (shouldUseMockBackend()) {
      return mockCompanies
        .map((c) => ({
          ...c,
          activeVacancyCount: mockVacancies.filter((v) => v.companyId === c.id && v.status === 'active').length,
        }))
        .sort(sortTopCompanies)
        .slice(0, limit);
    }

    const supa = getSupabase();
    const [companiesRes, vacanciesRes] = await Promise.all([
      supa.from('companies').select(companySelect).limit(200),
      supa.from('vacancies').select('company_id').eq('status', 'active').limit(5000),
    ]);

    if (companiesRes.error) throw new Error(companiesRes.error.message);
    if (vacanciesRes.error) throw new Error(vacanciesRes.error.message);

    const counts = new Map<string, number>();
    ((vacanciesRes.data || []) as { company_id: string }[]).forEach((row) => {
      counts.set(row.company_id, (counts.get(row.company_id) || 0) + 1);
    });

    return ((companiesRes.data || []) as SupabaseCompanyRow[])
      .map((row) => ({ ...mapCompany(row), activeVacancyCount: counts.get(row.id) || 0 }))
      .sort(sortTopCompanies)
      .slice(0, limit);
  }

  async createVacancy(input: VacancyMutationInput): Promise<Vacancy> {
    if (shouldUseMockBackend()) {
      const company = mockCompanies.find((item) => item.id === input.companyId);

      return {
        id: `mock-${Date.now()}`,
        title: input.title,
        description: input.description,
        requirements: input.requirements,
        responsibilities: input.responsibilities,
        benefits: input.benefits,
        salaryMin: input.salaryMin,
        salaryMax: input.salaryMax,
        salaryCurrency: input.salaryCurrency || 'AZN',
        showSalary: input.showSalary,
        city: input.city,
        workType: input.workType,
        experienceLevel: input.experienceLevel,
        skills: input.skills,
        companyId: input.companyId,
        company: company || undefined,
        status: input.status,
        screeningQuestions: input.screeningQuestions,
        applicantCount: 0,
        viewCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    const { data, error } = await getSupabase()
      .from('vacancies')
      .insert({
        title: input.title,
        description: input.description,
        requirements: input.requirements,
        responsibilities: input.responsibilities,
        benefits: input.benefits,
        salary_min: input.salaryMin ?? null,
        salary_max: input.salaryMax ?? null,
        salary_currency: input.salaryCurrency || 'AZN',
        show_salary: input.showSalary,
        city: input.city,
        work_type: input.workType,
        experience_level: input.experienceLevel,
        skills: input.skills,
        company_id: input.companyId,
        status: input.status,
        screening_questions: input.screeningQuestions,
      })
      .select(vacancySelect)
      .single();

    if (error) throw new Error(error.message);

    return mapVacancy(data as SupabaseVacancyRow);
  }

  async updateVacancy(
    id: string,
    input: VacancyMutationInput
  ): Promise<Vacancy> {
    if (!id) {
      throw new Error('Vacancy id is required');
    }

    if (shouldUseMockBackend()) {
      const vacancy = mockVacancies.find((item) => item.id === id);
      const company = mockCompanies.find((item) => item.id === input.companyId);

      if (!vacancy) {
        throw new Error('Vacancy not found');
      }

      Object.assign(vacancy, {
        title: input.title,
        description: input.description,
        requirements: input.requirements,
        responsibilities: input.responsibilities,
        benefits: input.benefits,
        salaryMin: input.salaryMin,
        salaryMax: input.salaryMax,
        salaryCurrency: input.salaryCurrency || 'AZN',
        showSalary: input.showSalary,
        city: input.city,
        workType: input.workType,
        experienceLevel: input.experienceLevel,
        skills: input.skills,
        companyId: input.companyId,
        company: company || vacancy.company,
        status: input.status,
        screeningQuestions: input.screeningQuestions,
        updatedAt: new Date().toISOString(),
      });

      return { ...vacancy };
    }

    const { data, error } = await getSupabase()
      .from('vacancies')
      .update({
        title: input.title,
        description: input.description,
        requirements: input.requirements,
        responsibilities: input.responsibilities,
        benefits: input.benefits,
        salary_min: input.salaryMin ?? null,
        salary_max: input.salaryMax ?? null,
        salary_currency: input.salaryCurrency || 'AZN',
        show_salary: input.showSalary,
        city: input.city,
        work_type: input.workType,
        experience_level: input.experienceLevel,
        skills: input.skills,
        company_id: input.companyId,
        status: input.status,
        screening_questions: input.screeningQuestions,
      })
      .eq('id', id)
      .select(vacancySelect)
      .single();

    if (error) throw new Error(error.message);

    return mapVacancy(data as SupabaseVacancyRow);
  }

  async updateVacancyStatus(
    id: string,
    status: VacancyStatus
  ): Promise<Vacancy> {
    if (!id) {
      throw new Error('Vacancy id is required');
    }

    if (shouldUseMockBackend()) {
      const vacancy = mockVacancies.find((item) => item.id === id);

      if (!vacancy) {
        throw new Error('Vacancy not found');
      }

      return {
        ...vacancy,
        status,
        updatedAt: new Date().toISOString(),
      };
    }

    const { data, error } = await getSupabase()
      .from('vacancies')
      .update({ status })
      .eq('id', id)
      .select(vacancySelect)
      .single();

    if (error) throw new Error(error.message);

    return mapVacancy(data as SupabaseVacancyRow);
  }

  async deleteVacancy(id: string): Promise<void> {
    if (!id) {
      throw new Error('Vacancy id is required');
    }

    if (shouldUseMockBackend()) {
      return;
    }

    const { error } = await getSupabase()
      .from('vacancies')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  }
}

export const vacancyService = new VacancyService();
