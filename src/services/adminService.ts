import {
  AdminDashboardStats,
  AdminUserSummary,
  Company,
  FinanceStats,
  ModerationFlag,
  PlatformStats,
  SubscriptionPlanCode,
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
  reported_by: string | null;
  reviewed_by: string | null;
  created_at: string;
  reviewed_at: string | null;
  reporter: { full_name: string } | null;
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
    reportedBy: row.reported_by || undefined,
    reporterName: row.reporter?.full_name || undefined,
    reviewedBy: row.reviewed_by || undefined,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at || undefined,
  };
}

// Raw JSONB shape returned by the admin_dashboard_stats RPC (snake_case leaves).
interface DashboardStatsRow {
  users: { total: number; candidates: number; employers: number; admins: number; inactive: number; new_today: number; new_7d: number; new_30d: number; with_push_token: number };
  candidates: { with_cv: number; avg_completeness: number };
  companies: { total: number; verified: number; pending_verification: number };
  vacancies: { total: number; active: number; draft: number; pending_moderation: number; paused: number; closed: number; featured: number; new_7d: number; total_views: number };
  applications: { total: number; today: number; last_7d: number; pending: number; reviewed: number; shortlisted: number; accepted: number; rejected: number };
  funnel_30d: { vacancy_views: number; application_submits: number; conversion_pct: number };
  messaging: { messages_today: number; messages_7d: number; conversations_total: number; active_conversations_7d: number; support_conversations: number };
  invites: { total: number; pending: number; accepted: number; declined: number };
  talent: { profile_views_30d: number; saved_jobs: number; saved_searches: number };
  notifications_7d: { type: string; count: number }[];
  moderation: { open_flags: number; resolved_7d: number; blocked_pairs: number };
  ai: { uses_today: number; uses_30d: number; users_30d: number };
  revenue: { candidate_mrr: number; employer_mrr: number; paying_candidates: number; paying_employers: number };
  daily_14d: { day: string; new_users: number; applications: number; messages: number }[];
}

function mapDashboardStats(r: DashboardStatsRow): AdminDashboardStats {
  return {
    users: {
      total: r.users.total,
      candidates: r.users.candidates,
      employers: r.users.employers,
      admins: r.users.admins,
      inactive: r.users.inactive,
      newToday: r.users.new_today,
      new7d: r.users.new_7d,
      new30d: r.users.new_30d,
      withPushToken: r.users.with_push_token,
    },
    candidates: { withCv: r.candidates.with_cv, avgCompleteness: r.candidates.avg_completeness },
    companies: {
      total: r.companies.total,
      verified: r.companies.verified,
      pendingVerification: r.companies.pending_verification,
    },
    vacancies: {
      total: r.vacancies.total,
      active: r.vacancies.active,
      draft: r.vacancies.draft,
      pendingModeration: r.vacancies.pending_moderation,
      paused: r.vacancies.paused,
      closed: r.vacancies.closed,
      featured: r.vacancies.featured,
      new7d: r.vacancies.new_7d,
      totalViews: r.vacancies.total_views,
    },
    applications: {
      total: r.applications.total,
      today: r.applications.today,
      last7d: r.applications.last_7d,
      pending: r.applications.pending,
      reviewed: r.applications.reviewed,
      shortlisted: r.applications.shortlisted,
      accepted: r.applications.accepted,
      rejected: r.applications.rejected,
    },
    funnel30d: {
      vacancyViews: r.funnel_30d.vacancy_views,
      applicationSubmits: r.funnel_30d.application_submits,
      conversionPct: r.funnel_30d.conversion_pct,
    },
    messaging: {
      messagesToday: r.messaging.messages_today,
      messages7d: r.messaging.messages_7d,
      conversationsTotal: r.messaging.conversations_total,
      activeConversations7d: r.messaging.active_conversations_7d,
      supportConversations: r.messaging.support_conversations,
    },
    invites: r.invites,
    talent: {
      profileViews30d: r.talent.profile_views_30d,
      savedJobs: r.talent.saved_jobs,
      savedSearches: r.talent.saved_searches,
    },
    notifications7d: r.notifications_7d,
    moderation: {
      openFlags: r.moderation.open_flags,
      resolved7d: r.moderation.resolved_7d,
      blockedPairs: r.moderation.blocked_pairs,
    },
    ai: { usesToday: r.ai.uses_today, uses30d: r.ai.uses_30d, users30d: r.ai.users_30d },
    revenue: {
      candidateMrr: r.revenue.candidate_mrr,
      employerMrr: r.revenue.employer_mrr,
      payingCandidates: r.revenue.paying_candidates,
      payingEmployers: r.revenue.paying_employers,
    },
    daily14d: r.daily_14d.map((d) => ({
      day: d.day,
      newUsers: d.new_users,
      applications: d.applications,
      messages: d.messages,
    })),
  };
}

class AdminService {
  async fetchDashboardStats(): Promise<AdminDashboardStats> {
    if (shouldUseMockBackend()) {
      return {
        users: { total: 6, candidates: 4, employers: 1, admins: 1, inactive: 0, newToday: 1, new7d: 3, new30d: 6, withPushToken: 2 },
        candidates: { withCv: 3, avgCompleteness: 72 },
        companies: { total: mockCompanies.length, verified: 2, pendingVerification: 1 },
        vacancies: { total: mockVacancies.length, active: 4, draft: 1, pendingModeration: 1, paused: 0, closed: 0, featured: 1, new7d: 2, totalViews: 640 },
        applications: { total: mockApplications.length, today: 1, last7d: 4, pending: mockApplications.length - 3, reviewed: 1, shortlisted: 1, accepted: 1, rejected: 0 },
        funnel30d: { vacancyViews: 128, applicationSubmits: 34, conversionPct: 26.6 },
        messaging: { messagesToday: 4, messages7d: 57, conversationsTotal: 12, activeConversations7d: 6, supportConversations: 1 },
        invites: { total: 9, pending: 3, accepted: 5, declined: 1 },
        talent: { profileViews30d: 41, savedJobs: 17, savedSearches: 8 },
        notifications7d: [
          { type: 'new_application', count: 12 },
          { type: 'new_message', count: 9 },
        ],
        moderation: { openFlags: 0, resolved7d: 2, blockedPairs: 1 },
        ai: { usesToday: 3, uses30d: 44, users30d: 5 },
        revenue: { candidateMrr: 35, employerMrr: 19, payingCandidates: 3, payingEmployers: 1 },
        daily14d: Array.from({ length: 14 }, (_, i) => ({
          day: `2026-08-${String(6 + i).padStart(2, '0')}`,
          newUsers: (i * 3) % 4,
          applications: (i * 5) % 6,
          messages: (i * 7) % 9,
        })),
      };
    }

    const { data, error } = await getSupabase().rpc('admin_dashboard_stats');
    if (error) throw new Error(error.message);
    return mapDashboardStats(data as DashboardStatsRow);
  }

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

  async fetchFinanceStats(): Promise<FinanceStats> {
    if (shouldUseMockBackend()) {
      const byPlan = [
        { plan: 'pro' as SubscriptionPlanCode, audience: 'candidate' as const, subscribers: 3, mrr: 27 },
        { plan: 'premium' as SubscriptionPlanCode, audience: 'candidate' as const, subscribers: 1, mrr: 19 },
        { plan: 'pro' as SubscriptionPlanCode, audience: 'employer' as const, subscribers: 1, mrr: 19 },
      ];
      const mrr = byPlan.reduce((sum, p) => sum + p.mrr, 0);
      const paying = byPlan.reduce((sum, p) => sum + p.subscribers, 0);
      return {
        currency: 'AZN',
        mrr,
        arr: mrr * 12,
        arpu: paying ? Math.round(mrr / paying) : 0,
        payingSubscribers: paying,
        activeSubscriptions: paying + 3,
        byPlan,
      };
    }

    // Revenue = active candidate + employer subscriptions (both sides of the
    // marketplace monetize). For large volumes this should move to a SQL
    // aggregate/RPC; the row caps keep it bounded.
    const supa = getSupabase();
    const [candidate, employer] = await Promise.all(
      (['candidate_subscriptions', 'employer_subscriptions'] as const).map(async (table) => {
        const { data, error } = await supa
          .from(table)
          .select('plan, price_amount, status')
          .eq('status', 'active')
          .limit(10000);
        if (error) throw new Error(error.message);
        return (data || []) as { plan: SubscriptionPlanCode; price_amount: number | null }[];
      })
    );

    const audiences = [
      { audience: 'candidate' as const, rows: candidate },
      { audience: 'employer' as const, rows: employer },
    ];
    const activeSubscriptions = candidate.length + employer.length;
    const byPlan: FinanceStats['byPlan'] = [];
    let mrr = 0;
    let payingSubscribers = 0;

    for (const { audience, rows } of audiences) {
      const planMap = new Map<SubscriptionPlanCode, { subscribers: number; mrr: number }>();
      for (const r of rows) {
        if ((r.price_amount || 0) <= 0) continue;
        const cur = planMap.get(r.plan) || { subscribers: 0, mrr: 0 };
        cur.subscribers += 1;
        cur.mrr += r.price_amount || 0;
        planMap.set(r.plan, cur);
      }
      for (const [plan, v] of planMap) {
        byPlan.push({ plan, audience, ...v });
        mrr += v.mrr;
        payingSubscribers += v.subscribers;
      }
    }

    return {
      currency: 'AZN',
      mrr,
      arr: mrr * 12,
      arpu: payingSubscribers ? Math.round(mrr / payingSubscribers) : 0,
      payingSubscribers,
      activeSubscriptions,
      byPlan,
    };
  }

  async fetchEngagement(days = 30): Promise<{ event: string; count: number }[]> {
    const events = ['vacancy_view', 'application_submit', 'message_sent', 'vacancy_publish'];

    if (shouldUseMockBackend()) {
      return [
        { event: 'vacancy_view', count: 128 },
        { event: 'application_submit', count: 34 },
        { event: 'message_sent', count: 57 },
        { event: 'vacancy_publish', count: 9 },
      ];
    }

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    return Promise.all(
      events.map(async (event) => {
        const { count, error } = await getSupabase()
          .from('analytics_events')
          .select('id', { count: 'exact', head: true })
          .eq('event', event)
          .gte('created_at', since);
        if (error) throw new Error(error.message);
        return { event, count: count || 0 };
      })
    );
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

    // email is relationship-gated at the DB level (see get_profile_contact);
    // the bulk admin list/search goes through a dedicated admin-only RPC
    // that checks is_admin() itself rather than relying on column grants.
    const { data, error } = await getSupabase().rpc('admin_list_profiles', {
      search_term: search?.trim() || null,
    });
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
      .select(
        'id,entity_type,entity_id,reason,status,reported_by,reviewed_by,created_at,reviewed_at,reporter:profiles!moderation_flags_reported_by_fkey(full_name)'
      )
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return (data || []).map((row) => mapFlag(row as unknown as FlagRow));
  }

  async resolveFlag(flagId: string, status: ModerationFlag['status']): Promise<void> {
    if (shouldUseMockBackend()) return;
    const supa = getSupabase();
    const reviewerId = (await supa.auth.getUser()).data.user?.id ?? null;
    const { error } = await supa
      .from('moderation_flags')
      .update({ status, reviewed_at: new Date().toISOString(), reviewed_by: reviewerId })
      .eq('id', flagId);
    if (error) throw new Error(error.message);
  }
}

export const adminService = new AdminService();
