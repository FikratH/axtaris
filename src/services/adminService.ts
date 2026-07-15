import {
  AdminUserSummary,
  Company,
  ModerationFlag,
  PlatformStats,
  UserRole,
  Vacancy,
  VacancyStatus,
  VerificationStatus,
} from '@/types/models';
import { mockApplications, mockCompanies, mockEmployerUser, mockUser, mockVacancies } from './mockData';
import { getSupabase, shouldUseMockBackend } from './supabase';
import {
  companySelect,
  mapCompany,
  mapVacancy,
  SupabaseCompanyRow,
  SupabaseVacancyRow,
  vacancySelect,
} from './vacancyService';

interface ProfileRow {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  avatar_url: string | null;
  is_active: boolean | null;
  created_at: string;
}

interface FlagRow {
  id: string;
  entity_type: ModerationFlag['entityType'];
  entity_id: string;
  reason: string;
  status: ModerationFlag['status'];
  reviewed_by: string | null;
  created_at: string;
  reviewed_at: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function countOf(query: any): Promise<number> {
  const { count, error } = await query;
  if (error) throw new Error(error.message);
  return count || 0;
}

function mapProfile(row: ProfileRow): AdminUserSummary {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    fullName: row.full_name,
    avatarUrl: row.avatar_url || undefined,
    isActive: row.is_active ?? true,
    createdAt: row.created_at,
  };
}

function mapFlag(row: FlagRow): ModerationFlag {
  return {
    id: row.id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    reason: row.reason,
    status: row.status,
    reviewedBy: row.reviewed_by || undefined,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at || undefined,
  };
}

class AdminService {
  async fetchPlatformStats(): Promise<PlatformStats> {
    if (shouldUseMockBackend()) {
      return {
        totalUsers: 6,
        candidates: 4,
        employers: 1,
        admins: 1,
        totalCompanies: mockCompanies.length,
        verifiedCompanies: mockCompanies.filter((c) => c.verificationStatus === 'verified').length,
        pendingVerificationCompanies: mockCompanies.filter((c) => c.verificationStatus === 'pending').length,
        totalVacancies: mockVacancies.length,
        activeVacancies: mockVacancies.filter((v) => v.status === 'active').length,
        pendingModerationVacancies: mockVacancies.filter((v) => v.status === 'pending_moderation').length,
        totalApplications: mockApplications.length,
        openFlags: 0,
      };
    }

    const supa = getSupabase();
    const profiles = () => supa.from('profiles').select('id', { count: 'exact', head: true });
    const companies = () => supa.from('companies').select('id', { count: 'exact', head: true });
    const vacancies = () => supa.from('vacancies').select('id', { count: 'exact', head: true });

    const [
      totalUsers,
      candidates,
      employers,
      admins,
      totalCompanies,
      verifiedCompanies,
      pendingVerificationCompanies,
      totalVacancies,
      activeVacancies,
      pendingModerationVacancies,
      totalApplications,
      openFlags,
    ] = await Promise.all([
      countOf(profiles()),
      countOf(profiles().eq('role', 'candidate')),
      countOf(profiles().eq('role', 'employer')),
      countOf(profiles().eq('role', 'admin')),
      countOf(companies()),
      countOf(companies().eq('verification_status', 'verified')),
      countOf(companies().eq('verification_status', 'pending')),
      countOf(vacancies()),
      countOf(vacancies().eq('status', 'active')),
      countOf(vacancies().eq('status', 'pending_moderation')),
      countOf(supa.from('applications').select('id', { count: 'exact', head: true })),
      countOf(supa.from('moderation_flags').select('id', { count: 'exact', head: true }).eq('status', 'pending')),
    ]);

    return {
      totalUsers,
      candidates,
      employers,
      admins,
      totalCompanies,
      verifiedCompanies,
      pendingVerificationCompanies,
      totalVacancies,
      activeVacancies,
      pendingModerationVacancies,
      totalApplications,
      openFlags,
    };
  }

  async fetchUsers(search?: string): Promise<AdminUserSummary[]> {
    if (shouldUseMockBackend()) {
      return [mockUser, mockEmployerUser].map((u) => ({
        id: u.id,
        email: u.email,
        role: u.role,
        fullName: u.fullName,
        avatarUrl: u.avatarUrl,
        isActive: true,
        createdAt: u.createdAt,
      }));
    }

    let query = getSupabase()
      .from('profiles')
      .select('id,email,role,full_name,avatar_url,is_active,created_at')
      .order('created_at', { ascending: false })
      .limit(100);

    if (search?.trim()) {
      const term = `%${search.trim()}%`;
      query = query.or(`full_name.ilike.${term},email.ilike.${term}`);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return ((data || []) as ProfileRow[]).map(mapProfile);
  }

  async updateUserRole(userId: string, role: UserRole): Promise<void> {
    if (shouldUseMockBackend()) return;
    const { error } = await getSupabase().from('profiles').update({ role }).eq('id', userId);
    if (error) throw new Error(error.message);
  }

  async setUserActive(userId: string, isActive: boolean): Promise<void> {
    if (shouldUseMockBackend()) return;
    const { error } = await getSupabase().from('profiles').update({ is_active: isActive }).eq('id', userId);
    if (error) throw new Error(error.message);
  }

  async fetchModerationVacancies(): Promise<Vacancy[]> {
    if (shouldUseMockBackend()) {
      return mockVacancies.filter((v) => v.status === 'pending_moderation' || v.status === 'active');
    }

    const { data, error } = await getSupabase()
      .from('vacancies')
      .select(vacancySelect)
      .in('status', ['pending_moderation', 'active'])
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw new Error(error.message);
    return ((data || []) as SupabaseVacancyRow[]).map(mapVacancy);
  }

  async setVacancyStatus(vacancyId: string, status: VacancyStatus): Promise<void> {
    if (shouldUseMockBackend()) return;
    const { error } = await getSupabase().from('vacancies').update({ status }).eq('id', vacancyId);
    if (error) throw new Error(error.message);
  }

  async fetchCompanies(): Promise<Company[]> {
    if (shouldUseMockBackend()) {
      return [...mockCompanies].sort((a, b) =>
        a.verificationStatus === 'pending' ? -1 : b.verificationStatus === 'pending' ? 1 : 0
      );
    }

    const { data, error } = await getSupabase()
      .from('companies')
      .select(companySelect)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw new Error(error.message);
    return ((data || []) as SupabaseCompanyRow[]).map(mapCompany);
  }

  async setCompanyVerification(companyId: string, status: VerificationStatus): Promise<void> {
    if (shouldUseMockBackend()) return;
    const { error } = await getSupabase()
      .from('companies')
      .update({ verification_status: status })
      .eq('id', companyId);
    if (error) throw new Error(error.message);
  }

  async fetchFlags(): Promise<ModerationFlag[]> {
    if (shouldUseMockBackend()) return [];
    const { data, error } = await getSupabase()
      .from('moderation_flags')
      .select('id,entity_type,entity_id,reason,status,reviewed_by,created_at,reviewed_at')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return ((data || []) as FlagRow[]).map(mapFlag);
  }

  async resolveFlag(flagId: string, status: ModerationFlag['status']): Promise<void> {
    if (shouldUseMockBackend()) return;
    const { error } = await getSupabase()
      .from('moderation_flags')
      .update({ status, reviewed_at: new Date().toISOString() })
      .eq('id', flagId);
    if (error) throw new Error(error.message);
  }
}

export const adminService = new AdminService();
