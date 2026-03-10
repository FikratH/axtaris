import { create } from 'zustand';
import {
  Vacancy,
  Application,
  ApplicationStatus,
  Company,
  CandidateProfile,
  Notification,
} from '@/types/models';
import {
  mockVacancies,
  mockApplications,
  mockCompanies,
  mockCandidateProfile,
  mockNotifications,
  mockEmployerAnalytics,
} from '@/services/mockData';

const employerNotifications: Notification[] = [
  {
    id: 'e1', userId: '2', type: 'new_application', title: 'Yeni müraciət',
    body: 'Senior React Native Developer vakansiyasına yeni müraciət daxil oldu.',
    data: { vacancyId: '1' }, read: false, createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 'e2', userId: '2', type: 'new_application', title: 'Yeni müraciət',
    body: 'DevOps Engineer vakansiyasına yeni müraciət daxil oldu.',
    data: { vacancyId: '6' }, read: false, createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: 'e3', userId: '2', type: 'company_verification', title: 'Şirkət təsdiqləndi',
    body: 'Kapital Bank şirkəti uğurla təsdiqləndi.', read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: 'e4', userId: '2', type: 'vacancy_moderation', title: 'Vakansiya təsdiqləndi',
    body: 'Senior React Native Developer vakansiyası dərc edildi.', read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
];

interface DataState {
  vacancies: Vacancy[];
  applications: Application[];
  savedJobIds: string[];
  companies: Company[];
  candidateProfile: CandidateProfile;
  candidateNotifications: Notification[];
  employerNotifications: Notification[];
  analytics: typeof mockEmployerAnalytics;

  toggleSaveJob: (vacancyId: string) => void;
  isJobSaved: (vacancyId: string) => boolean;

  applyToVacancy: (vacancyId: string) => void;
  hasApplied: (vacancyId: string) => boolean;

  updateApplicationStatus: (applicationId: string, status: ApplicationStatus) => void;

  updateCandidateProfile: (updates: Partial<CandidateProfile>) => void;
  setCvFile: (url: string, fileName: string) => void;

  addVacancy: (vacancy: Vacancy) => void;
  updateVacancy: (id: string, updates: Partial<Vacancy>) => void;
  deleteVacancy: (id: string) => void;
  changeVacancyStatus: (id: string, status: 'active' | 'paused' | 'closed') => void;

  updateCompany: (id: string, updates: Partial<Company>) => void;

  markNotificationRead: (role: 'candidate' | 'employer', id: string) => void;
  markAllNotificationsRead: (role: 'candidate' | 'employer') => void;
}

export const useDataStore = create<DataState>((set, get) => ({
  vacancies: mockVacancies,
  applications: mockApplications,
  savedJobIds: ['1', '3'],
  companies: mockCompanies,
  candidateProfile: mockCandidateProfile,
  candidateNotifications: mockNotifications,
  employerNotifications: employerNotifications,
  analytics: mockEmployerAnalytics,

  toggleSaveJob: (vacancyId) =>
    set((state) => ({
      savedJobIds: state.savedJobIds.includes(vacancyId)
        ? state.savedJobIds.filter((id) => id !== vacancyId)
        : [...state.savedJobIds, vacancyId],
    })),

  isJobSaved: (vacancyId) => get().savedJobIds.includes(vacancyId),

  applyToVacancy: (vacancyId) => {
    const state = get();
    if (state.applications.some((a) => a.vacancyId === vacancyId)) return;
    const vacancy = state.vacancies.find((v) => v.id === vacancyId);
    const newApp: Application = {
      id: Date.now().toString(),
      vacancyId,
      candidateId: state.candidateProfile.id,
      status: 'pending',
      vacancy,
      appliedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set({
      applications: [newApp, ...state.applications],
      vacancies: state.vacancies.map((v) =>
        v.id === vacancyId ? { ...v, applicantCount: v.applicantCount + 1 } : v
      ),
    });
  },

  hasApplied: (vacancyId) => get().applications.some((a) => a.vacancyId === vacancyId),

  updateApplicationStatus: (applicationId, status) =>
    set((state) => ({
      applications: state.applications.map((a) =>
        a.id === applicationId
          ? { ...a, status, reviewedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
          : a
      ),
    })),

  updateCandidateProfile: (updates) =>
    set((state) => ({
      candidateProfile: { ...state.candidateProfile, ...updates, updatedAt: new Date().toISOString() },
    })),

  setCvFile: (url, fileName) =>
    set((state) => ({
      candidateProfile: { ...state.candidateProfile, cvUrl: url, cvFileName: fileName, updatedAt: new Date().toISOString() },
    })),

  addVacancy: (vacancy) =>
    set((state) => ({
      vacancies: [vacancy, ...state.vacancies],
    })),

  updateVacancy: (id, updates) =>
    set((state) => ({
      vacancies: state.vacancies.map((v) =>
        v.id === id ? { ...v, ...updates, updatedAt: new Date().toISOString() } : v
      ),
    })),

  deleteVacancy: (id) =>
    set((state) => ({
      vacancies: state.vacancies.filter((v) => v.id !== id),
    })),

  changeVacancyStatus: (id, status) =>
    set((state) => ({
      vacancies: state.vacancies.map((v) =>
        v.id === id ? { ...v, status, updatedAt: new Date().toISOString() } : v
      ),
    })),

  updateCompany: (id, updates) =>
    set((state) => ({
      companies: state.companies.map((c) =>
        c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
      ),
    })),

  markNotificationRead: (role, id) =>
    set((state) => {
      const key = role === 'employer' ? 'employerNotifications' : 'candidateNotifications';
      return { [key]: state[key].map((n: Notification) => n.id === id ? { ...n, read: true } : n) };
    }),

  markAllNotificationsRead: (role) =>
    set((state) => {
      const key = role === 'employer' ? 'employerNotifications' : 'candidateNotifications';
      return { [key]: state[key].map((n: Notification) => ({ ...n, read: true })) };
    }),
}));
