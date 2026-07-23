import type {
  CandidateInvite,
  InviteStatus,
  SubscriptionPlanCode,
  TalentCandidate,
  TalentSearchFilters,
} from '@/types/models';
import { getSupabase, shouldUseMockBackend } from './supabase';

export interface TalentSearchResult {
  candidates: TalentCandidate[];
  /** false when the talent tables/columns aren't available yet (migration pending). */
  available: boolean;
}

// ── Mock talent pool (privacy-safe cards; no email/phone) ────────────────────
const mockTalent: TalentCandidate[] = [
  {
    id: 'talent-1', userId: 'u-t1', fullName: 'Nigar Əliyeva', title: 'Frontend Developer',
    location: 'Bakı', skills: ['React', 'TypeScript', 'CSS', 'Next.js', 'Figma'],
    availability: 'two_weeks', workPreference: 'hybrid', expectedSalary: 2500, salaryCurrency: 'AZN',
    bioSnippet: 'Frontend developer focused on clean, accessible UI.', experienceCount: 3,
    profileCompleteness: 92, plan: 'premium', isSpotlight: true,
  },
  {
    id: 'talent-2', userId: 'u-t2', fullName: 'Ramin Quliyev', title: 'Data Analyst',
    location: 'Bakı', skills: ['SQL', 'Python', 'Power BI', 'Excel', 'Statistics'],
    availability: 'immediate', workPreference: 'onsite', expectedSalary: 2000, salaryCurrency: 'AZN',
    bioSnippet: 'Turning data into decisions.', experienceCount: 4,
    profileCompleteness: 85, plan: 'pro', isSpotlight: false,
  },
  {
    id: 'talent-3', userId: 'u-t3', fullName: 'Aytən Muradova', title: 'Product Designer',
    location: 'Gəncə', skills: ['Figma', 'User Research', 'Prototyping', 'Design Systems'],
    availability: 'one_month', workPreference: 'remote', expectedSalary: 2800, salaryCurrency: 'AZN',
    bioSnippet: 'Designing products people love.', experienceCount: 5,
    profileCompleteness: 88, plan: 'free', isSpotlight: false,
  },
  {
    id: 'talent-4', userId: 'u-t4', fullName: 'Elvin Səfərov', title: 'Backend Developer',
    location: 'Bakı', skills: ['Node.js', 'PostgreSQL', 'Docker', 'REST APIs', 'AWS'],
    availability: 'immediate', workPreference: 'hybrid', expectedSalary: 3200, salaryCurrency: 'AZN',
    bioSnippet: 'Building reliable backend systems.', experienceCount: 6,
    profileCompleteness: 90, plan: 'free', isSpotlight: false,
  },
  {
    id: 'talent-5', userId: 'u-t5', fullName: 'Günel Hüseynova', title: 'Marketing Manager',
    location: 'Bakı', skills: ['SEO', 'Content', 'Social Media', 'Analytics', 'Branding'],
    availability: 'negotiable', workPreference: 'onsite', expectedSalary: 2400, salaryCurrency: 'AZN',
    bioSnippet: 'Growth-focused marketer.', experienceCount: 4,
    profileCompleteness: 80, plan: 'free', isSpotlight: false,
  },
];

let mockInvites: CandidateInvite[] = [];
let mockInviteSeq = 1;

function scoreCandidate(candidate: TalentCandidate, filters: TalentSearchFilters): number {
  let score = 0;
  const wanted = (filters.skills || []).map((s) => s.toLowerCase());
  if (wanted.length) {
    const have = candidate.skills.map((s) => s.toLowerCase());
    const overlap = wanted.filter((s) => have.includes(s)).length;
    score += (overlap / wanted.length) * 100;
  }
  if (filters.query) {
    const q = filters.query.toLowerCase();
    const hay = `${candidate.title || ''} ${candidate.bioSnippet || ''} ${candidate.skills.join(' ')}`.toLowerCase();
    if (hay.includes(q)) score += 25;
  }
  score += Math.min(candidate.profileCompleteness / 10, 10);
  return Math.round(score);
}

function matchesFilters(candidate: TalentCandidate, filters: TalentSearchFilters): boolean {
  if (filters.city && !(candidate.location || '').toLowerCase().includes(filters.city.toLowerCase())) return false;
  if (filters.workPreference && candidate.workPreference !== filters.workPreference) return false;
  if (filters.availability && candidate.availability !== filters.availability) return false;
  if (typeof filters.minSalary === 'number' && (candidate.expectedSalary ?? 0) < filters.minSalary) return false;
  if (typeof filters.maxSalary === 'number' && (candidate.expectedSalary ?? Infinity) > filters.maxSalary) return false;
  if (filters.query) {
    const q = filters.query.toLowerCase();
    const hay = `${candidate.fullName} ${candidate.title || ''} ${candidate.skills.join(' ')} ${candidate.location || ''}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  if (filters.skills && filters.skills.length) {
    const have = candidate.skills.map((s) => s.toLowerCase());
    const anyMatch = filters.skills.some((s) => have.includes(s.toLowerCase()));
    if (!anyMatch) return false;
  }
  return true;
}

// Spotlight (premium) first, then match score, then completeness.
function rankTalent(candidates: TalentCandidate[], filters: TalentSearchFilters): TalentCandidate[] {
  return candidates
    .map((c) => ({ ...c, matchScore: scoreCandidate(c, filters) }))
    .sort((a, b) => {
      if (a.isSpotlight !== b.isSpotlight) return a.isSpotlight ? -1 : 1;
      if ((b.matchScore || 0) !== (a.matchScore || 0)) return (b.matchScore || 0) - (a.matchScore || 0);
      return b.profileCompleteness - a.profileCompleteness;
    });
}

interface CandidateProfileRow {
  id: string;
  user_id: string;
  title: string | null;
  bio: string | null;
  location: string | null;
  expected_salary: number | null;
  salary_currency: string | null;
  skills: string[] | null;
  availability: TalentCandidate['availability'] | null;
  work_preference: TalentCandidate['workPreference'] | null;
  profile_completeness: number | null;
  is_discoverable?: boolean | null;
  profiles?: { id: string; full_name: string; avatar_url: string | null } | { id: string; full_name: string; avatar_url: string | null }[] | null;
  work_experiences?: { id: string }[] | null;
}

// SELECT lists ONLY safe columns — never email/phone.
const talentSelect = `
  id, user_id, title, bio, location, expected_salary, salary_currency, skills,
  availability, work_preference, profile_completeness, is_discoverable,
  profiles ( id, full_name, avatar_url ),
  work_experiences ( id )
`;

function unwrapProfile(
  value: CandidateProfileRow['profiles']
): { full_name: string; avatar_url: string | null } | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] || null : value;
}

function mapTalentRow(row: CandidateProfileRow, plans: Map<string, SubscriptionPlanCode>): TalentCandidate {
  const profile = unwrapProfile(row.profiles);
  const plan = plans.get(row.user_id) || 'free';
  return {
    id: row.id,
    userId: row.user_id,
    fullName: profile?.full_name || 'Candidate',
    avatarUrl: profile?.avatar_url || undefined,
    title: row.title || undefined,
    location: row.location || undefined,
    skills: row.skills || [],
    availability: row.availability || undefined,
    workPreference: row.work_preference || undefined,
    expectedSalary: row.expected_salary || undefined,
    salaryCurrency: row.salary_currency || 'AZN',
    bioSnippet: row.bio ? row.bio.slice(0, 140) : undefined,
    experienceCount: row.work_experiences?.length || 0,
    profileCompleteness: row.profile_completeness || 0,
    plan,
    isSpotlight: plan === 'premium',
  };
}

class TalentService {
  async searchTalent(filters: TalentSearchFilters = {}): Promise<TalentSearchResult> {
    if (shouldUseMockBackend()) {
      const filtered = mockTalent.filter((c) => matchesFilters(c, filters));
      return { candidates: rankTalent(filtered, filters), available: true };
    }

    try {
      const supa = getSupabase();
      const runQuery = (withDiscoverable: boolean) => {
        const q = supa.from('candidate_profiles').select(talentSelect).limit(80);
        return withDiscoverable ? q.eq('is_discoverable', true) : q;
      };

      let { data, error } = await runQuery(true);
      if (error && /is_discoverable/i.test(error.message)) {
        // Column not migrated yet — fall back to all profiles.
        ({ data, error } = await runQuery(false));
      }
      if (error) return { candidates: [], available: false };

      const rows = (data || []) as CandidateProfileRow[];
      const discoverable = rows.filter((r) => r.is_discoverable !== false);
      const plans = await this.fetchPlansFor(discoverable.map((r) => r.user_id));
      const mapped = discoverable
        .map((r) => mapTalentRow(r, plans))
        .filter((c) => matchesFilters(c, filters));
      return { candidates: rankTalent(mapped, filters), available: true };
    } catch {
      return { candidates: [], available: false };
    }
  }

  async getTalentCandidate(candidateId: string): Promise<TalentCandidate | null> {
    if (shouldUseMockBackend()) {
      return mockTalent.find((c) => c.id === candidateId) || null;
    }
    try {
      const { data, error } = await getSupabase()
        .from('candidate_profiles')
        .select(talentSelect)
        .eq('id', candidateId)
        .maybeSingle();
      if (error || !data) return null;
      const row = data as CandidateProfileRow;
      const plans = await this.fetchPlansFor([row.user_id]);
      return mapTalentRow(row, plans);
    } catch {
      return null;
    }
  }

  private async fetchPlansFor(userIds: string[]): Promise<Map<string, SubscriptionPlanCode>> {
    const map = new Map<string, SubscriptionPlanCode>();
    if (!userIds.length) return map;
    try {
      const { data } = await getSupabase()
        .from('candidate_subscriptions')
        .select('user_id, plan')
        .in('user_id', userIds)
        .eq('status', 'active');
      (data || []).forEach((r: { user_id: string; plan: SubscriptionPlanCode }) => map.set(r.user_id, r.plan));
    } catch {
      // subscriptions unavailable — everyone free.
    }
    return map;
  }

  async recordProfileView(candidateProfileId: string, companyId: string): Promise<void> {
    if (!candidateProfileId || !companyId) return;
    if (shouldUseMockBackend()) return;
    try {
      await getSupabase().from('profile_views').insert({ candidate_id: candidateProfileId, company_id: companyId });
    } catch {
      // profile_views not migrated yet — silently skip.
    }
  }

  async countCompanyInvitesThisMonth(companyId: string): Promise<number> {
    if (!companyId) return 0;
    const startOfMonth = (() => {
      const d = new Date();
      return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
    })();

    if (shouldUseMockBackend()) {
      return mockInvites.filter((i) => i.companyId === companyId && i.createdAt >= startOfMonth).length;
    }
    try {
      const { count } = await getSupabase()
        .from('candidate_invites')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .gte('created_at', startOfMonth);
      return count || 0;
    } catch {
      return 0;
    }
  }

  async sendInvite(input: {
    companyId: string;
    companyName?: string;
    candidateId: string;
    candidateUserId?: string;
    vacancyId?: string;
    vacancyTitle?: string;
    message?: string;
  }): Promise<CandidateInvite> {
    if (!input.companyId || !input.candidateId) throw new Error('Company and candidate are required');
    const nowIso = new Date().toISOString();

    if (shouldUseMockBackend()) {
      const invite: CandidateInvite = {
        id: `mock-invite-${mockInviteSeq++}`,
        companyId: input.companyId,
        companyName: input.companyName,
        candidateId: input.candidateId,
        candidateUserId: input.candidateUserId,
        vacancyId: input.vacancyId,
        vacancyTitle: input.vacancyTitle,
        message: input.message,
        status: 'pending',
        createdAt: nowIso,
      };
      mockInvites = [invite, ...mockInvites];
      return invite;
    }

    const { data, error } = await getSupabase()
      .from('candidate_invites')
      .insert({
        company_id: input.companyId,
        candidate_id: input.candidateId,
        vacancy_id: input.vacancyId || null,
        message: input.message || null,
        status: 'pending',
      })
      .select('id, company_id, candidate_id, vacancy_id, message, status, created_at, responded_at')
      .single();
    if (error) throw new Error(error.message);

    // Best-effort notification to the candidate.
    if (input.candidateUserId) {
      try {
        await getSupabase().from('notifications').insert({
          user_id: input.candidateUserId,
          type: 'system',
          title: input.companyName ? `${input.companyName} invited you` : 'You have a new invitation',
          body: input.message || 'An employer invited you to apply.',
          data: { type: 'invite', inviteId: (data as { id: string }).id },
        });
      } catch {
        // notifications insert is best-effort.
      }
    }

    const row = data as {
      id: string; company_id: string; candidate_id: string; vacancy_id: string | null;
      message: string | null; status: InviteStatus; created_at: string; responded_at: string | null;
    };
    return {
      id: row.id,
      companyId: row.company_id,
      companyName: input.companyName,
      candidateId: row.candidate_id,
      candidateUserId: input.candidateUserId,
      vacancyId: row.vacancy_id || undefined,
      vacancyTitle: input.vacancyTitle,
      message: row.message || undefined,
      status: row.status,
      createdAt: row.created_at,
      respondedAt: row.responded_at || undefined,
    };
  }

  async listCandidateInvites(userId: string): Promise<CandidateInvite[]> {
    if (!userId) return [];
    if (shouldUseMockBackend()) {
      return mockInvites.filter((i) => i.candidateUserId === userId);
    }
    try {
      // Resolve the candidate's profile id, then read invites addressed to it.
      const { data: profile } = await getSupabase()
        .from('candidate_profiles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      if (!profile?.id) return [];

      const { data, error } = await getSupabase()
        .from('candidate_invites')
        .select('id, company_id, candidate_id, vacancy_id, message, status, created_at, responded_at, companies ( name ), vacancies ( title )')
        .eq('candidate_id', profile.id)
        .order('created_at', { ascending: false });
      if (error) return [];
      return (data || []).map((row: Record<string, unknown>) => {
        const company = row.companies as { name?: string } | { name?: string }[] | null;
        const vacancy = row.vacancies as { title?: string } | { title?: string }[] | null;
        const companyName = Array.isArray(company) ? company[0]?.name : company?.name;
        const vacancyTitle = Array.isArray(vacancy) ? vacancy[0]?.title : vacancy?.title;
        return {
          id: row.id as string,
          companyId: row.company_id as string,
          companyName,
          candidateId: row.candidate_id as string,
          vacancyId: (row.vacancy_id as string) || undefined,
          vacancyTitle,
          message: (row.message as string) || undefined,
          status: row.status as InviteStatus,
          createdAt: row.created_at as string,
          respondedAt: (row.responded_at as string) || undefined,
        };
      });
    } catch {
      return [];
    }
  }

  async respondToInvite(inviteId: string, status: Exclude<InviteStatus, 'pending'>): Promise<void> {
    if (shouldUseMockBackend()) {
      mockInvites = mockInvites.map((i) =>
        i.id === inviteId ? { ...i, status, respondedAt: new Date().toISOString() } : i
      );
      return;
    }
    const { error } = await getSupabase()
      .from('candidate_invites')
      .update({ status, responded_at: new Date().toISOString() })
      .eq('id', inviteId);
    if (error) throw new Error(error.message);
  }
}

export const talentService = new TalentService();
