import type {
  ProfileViewer,
  ProfileViewSummary,
  SavedSearch,
  SavedSearchCriteria,
} from '@/types/models';
import { mockCompanies } from './mockData';
import { getSupabase, shouldUseMockBackend } from './supabase';

/**
 * Candidate growth surfaces: "who viewed your profile" and saved searches.
 *
 * The DB tables (`profile_views`, `saved_searches`) ship in migration
 * `202607230001_talent_and_monetization.sql`, which may not be applied in
 * production yet. Every real-backend read is therefore wrapped so a missing
 * table degrades to an empty/default result instead of crashing the screen.
 */

const EMPTY_SUMMARY: ProfileViewSummary = {
  totalViews: 0,
  weeklyViews: 0,
  viewers: [],
};

type CompanyJoin =
  | { id: string; name: string; logo_url: string | null }
  | Array<{ id: string; name: string; logo_url: string | null }>
  | null;

interface ProfileViewRow {
  company_id: string;
  viewed_at: string;
  companies: CompanyJoin;
}

interface SavedSearchRow {
  id: string;
  user_id: string;
  name: string;
  filters: SavedSearchCriteria | null;
  created_at: string;
}

function unwrapCompany(
  value: CompanyJoin
): { id: string; name: string; logo_url: string | null } | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] || null : value;
}

function mapProfileViewer(row: ProfileViewRow): ProfileViewer {
  const company = unwrapCompany(row.companies);

  return {
    companyId: company?.id || row.company_id,
    companyName: company?.name || '',
    companyLogoUrl: company?.logo_url || undefined,
    viewedAt: row.viewed_at,
  };
}

function mapSavedSearch(row: SavedSearchRow): SavedSearch {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    filters: row.filters || {},
    createdAt: row.created_at,
  };
}

// ── Mock state ───────────────────────────────────────────────────────────────

function buildMockViewers(): ProfileViewer[] {
  const now = Date.now();
  const hour = 60 * 60 * 1000;
  const day = 24 * hour;

  // A handful of plausible recent viewers drawn from the seeded companies.
  return [
    { company: mockCompanies[2], ago: 3 * hour },
    { company: mockCompanies[0], ago: 20 * hour },
    { company: mockCompanies[1], ago: 2 * day },
    { company: mockCompanies[3], ago: 5 * day },
    { company: mockCompanies[4], ago: 9 * day },
  ]
    .filter((entry) => entry.company)
    .map(({ company, ago }) => ({
      companyId: company.id,
      companyName: company.name,
      companyLogoUrl: company.logoUrl,
      viewedAt: new Date(now - ago).toISOString(),
    }));
}

let mockSavedSearches: SavedSearch[] | null = null;

function getMockSavedSearches(): SavedSearch[] {
  if (mockSavedSearches === null) {
    const now = Date.now();
    mockSavedSearches = [
      {
        id: 'mock-search-1',
        userId: '1',
        name: 'React — Bakı',
        filters: { query: 'React', city: 'Bakı', workType: 'full_time' },
        createdAt: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
        newMatchCount: 4,
      },
      {
        id: 'mock-search-2',
        userId: '1',
        name: 'Remote frontend',
        filters: { query: 'Frontend', workType: 'remote', skills: ['TypeScript'] },
        createdAt: new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];
  }
  return mockSavedSearches;
}

// ── Service ──────────────────────────────────────────────────────────────────

class CandidateGrowthService {
  /**
   * "Who viewed your profile" summary. `visibility` mirrors the plan
   * entitlement: 'count' returns totals only (no viewer identities), while
   * 'list'/'history' include the resolved viewer rows.
   */
  async fetchProfileViewSummary(
    userId: string,
    visibility: 'count' | 'list' | 'history'
  ): Promise<ProfileViewSummary> {
    if (!userId) return { ...EMPTY_SUMMARY };

    if (shouldUseMockBackend()) {
      const viewers = buildMockViewers();
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const weeklyViews = viewers.filter(
        (viewer) => new Date(viewer.viewedAt).getTime() >= weekAgo
      ).length;

      return {
        totalViews: 27,
        weeklyViews: Math.max(weeklyViews, 6),
        viewers: visibility === 'count' ? [] : viewers,
      };
    }

    try {
      const supabase = getSupabase();

      // Resolve the candidate profile id for this user.
      const { data: profileRow, error: profileError } = await supabase
        .from('candidate_profiles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileError || !profileRow?.id) return { ...EMPTY_SUMMARY };

      const candidateId = profileRow.id as string;
      const weekAgoIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [{ count: totalCount }, { count: weeklyCount }] = await Promise.all([
        supabase
          .from('profile_views')
          .select('id', { count: 'exact', head: true })
          .eq('candidate_id', candidateId),
        supabase
          .from('profile_views')
          .select('id', { count: 'exact', head: true })
          .eq('candidate_id', candidateId)
          .gte('viewed_at', weekAgoIso),
      ]);

      let viewers: ProfileViewer[] = [];

      // Counts-only tier never resolves viewer identities.
      if (visibility !== 'count') {
        const limit = visibility === 'history' ? 50 : 20;
        const { data, error } = await supabase
          .from('profile_views')
          .select('company_id, viewed_at, companies ( id, name, logo_url )')
          .eq('candidate_id', candidateId)
          .order('viewed_at', { ascending: false })
          .limit(limit);

        if (!error) {
          viewers = ((data || []) as unknown as ProfileViewRow[]).map(mapProfileViewer);
        }
      }

      return {
        totalViews: totalCount ?? 0,
        weeklyViews: weeklyCount ?? 0,
        viewers,
      };
    } catch {
      return { ...EMPTY_SUMMARY };
    }
  }

  /**
   * Record that a company viewed a candidate's profile. Used by talent search.
   * No-throw: a missing table or blocked insert must never break the caller.
   */
  async recordProfileView(candidateProfileId: string, companyId: string): Promise<void> {
    if (!candidateProfileId || !companyId) return;

    if (shouldUseMockBackend()) return;

    try {
      await getSupabase()
        .from('profile_views')
        .insert({ candidate_id: candidateProfileId, company_id: companyId });
    } catch {
      // Swallow — view tracking is best-effort.
    }
  }

  async listSavedSearches(userId: string): Promise<SavedSearch[]> {
    if (!userId) return [];

    if (shouldUseMockBackend()) {
      return getMockSavedSearches().map((search) => ({ ...search }));
    }

    try {
      const { data, error } = await getSupabase()
        .from('saved_searches')
        .select('id, user_id, name, filters, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) return [];

      return ((data || []) as SavedSearchRow[]).map(mapSavedSearch);
    } catch {
      return [];
    }
  }

  async createSavedSearch(
    userId: string,
    name: string,
    filters: SavedSearchCriteria
  ): Promise<SavedSearch> {
    if (!userId) {
      throw new Error('User id is required');
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new Error('Search name is required');
    }

    if (shouldUseMockBackend()) {
      const search: SavedSearch = {
        id: `mock-search-${Date.now()}`,
        userId,
        name: trimmedName,
        filters,
        createdAt: new Date().toISOString(),
      };
      getMockSavedSearches().unshift(search);
      return { ...search };
    }

    const { data, error } = await getSupabase()
      .from('saved_searches')
      .insert({ user_id: userId, name: trimmedName, filters })
      .select('id, user_id, name, filters, created_at')
      .single();

    if (error) throw new Error(error.message);

    return mapSavedSearch(data as SavedSearchRow);
  }

  async deleteSavedSearch(id: string): Promise<void> {
    if (!id) {
      throw new Error('Saved search id is required');
    }

    if (shouldUseMockBackend()) {
      mockSavedSearches = getMockSavedSearches().filter((search) => search.id !== id);
      return;
    }

    const { error } = await getSupabase().from('saved_searches').delete().eq('id', id);

    if (error) throw new Error(error.message);
  }
}

export const candidateGrowthService = new CandidateGrowthService();
