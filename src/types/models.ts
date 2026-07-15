export type UserRole = 'candidate' | 'employer' | 'admin';
export type ApplicationStatus = 'pending' | 'reviewed' | 'shortlisted' | 'rejected' | 'accepted';
export type VacancyStatus = 'draft' | 'pending_moderation' | 'active' | 'paused' | 'closed' | 'rejected';
export type WorkType = 'full_time' | 'part_time' | 'remote' | 'hybrid' | 'onsite' | 'internship';
export type ExperienceLevel = 'no_experience' | 'junior' | 'mid' | 'senior' | 'lead' | 'executive';
export type VerificationStatus = 'not_verified' | 'pending' | 'verified' | 'rejected';
export type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'flagged';
export type SubscriptionPlanCode = 'free' | 'pro' | 'premium';

export interface TopCompany extends Company {
  activeVacancyCount: number;
}

export interface FinancePlanBreakdown {
  plan: SubscriptionPlanCode;
  subscribers: number;
  mrr: number;
}

export interface FinanceStats {
  currency: string;
  mrr: number;
  arr: number;
  arpu: number;
  payingSubscribers: number;
  activeSubscriptions: number;
  byPlan: FinancePlanBreakdown[];
}
export type SubscriptionStatus = 'active' | 'canceled' | 'expired';
export type SubscriptionAudience = 'candidate' | 'employer';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CandidateProfile {
  id: string;
  userId: string;
  title?: string;
  location?: string;
  expectedSalary?: number;
  salaryCurrency?: string;
  skills: string[];
  workExperience: WorkExperience[];
  education: Education[];
  languages: LanguageSkill[];
  certifications: Certification[];
  portfolioUrl?: string;
  cvUrl?: string;
  cvFileName?: string;
  availability?: 'immediate' | 'two_weeks' | 'one_month' | 'negotiable';
  workPreference?: WorkType;
  profileCompleteness: number;
  bio?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkExperience {
  id: string;
  jobTitle: string;
  company: string;
  location?: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  description?: string;
  highlights?: string[];
}

export interface Education {
  id: string;
  degree: string;
  fieldOfStudy: string;
  institution: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  description?: string;
}

export interface LanguageSkill {
  id: string;
  language: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'native';
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  credentialUrl?: string;
}

export interface SubscriptionPlan {
  code: SubscriptionPlanCode;
  name: string;
  monthlyPriceAzn?: number;
  monthlyPriceLabel: string;
  dailyApplicationLimit: number | null;
  visibilityLabel: string;
  sortPriority: number;
  isPopular?: boolean;
}

export interface SubscriptionFeatureComparisonRow {
  id: string;
  label: string;
  free: string;
  pro: string;
  premium: string;
}

export interface CandidateSubscription {
  id: string;
  userId: string;
  plan: SubscriptionPlanCode;
  status: SubscriptionStatus;
  priceAmount: number;
  priceCurrency: string;
  billingInterval: 'month';
  startedAt: string;
  expiresAt?: string;
  canceledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CandidateSubscriptionSummary {
  subscription: CandidateSubscription;
  dailyApplicationLimit: number | null;
  applicationsUsedToday: number;
  applicationsRemainingToday: number | null;
  visibilityScore: number;
  visibilityLabel: string;
}

export interface Company {
  id: string;
  name: string;
  industry: string;
  description?: string;
  logoUrl?: string;
  coverUrl?: string;
  website?: string;
  employeeCount?: string;
  location?: string;
  foundedYear?: number;
  verificationStatus: VerificationStatus;
  rating?: number;
  vacancyCount?: number;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmployerProfile {
  id: string;
  userId: string;
  companyId?: string;
  position?: string;
  company?: Company;
  createdAt: string;
  updatedAt: string;
}

export type ConversationKind = 'application' | 'support';

export interface Conversation {
  id: string;
  kind: ConversationKind;
  applicationId?: string;
  vacancyId?: string;
  companyId?: string;
  participantA: string;
  participantB?: string;
  subject?: string;
  lastMessage?: string;
  lastMessageAt: string;
  createdAt: string;
  vacancyTitle?: string;
  candidateName?: string;
  companyName?: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  kind: 'text' | 'image';
  imageUrl?: string;
  createdAt: string;
}

export interface ScreeningQuestion {
  id: string;
  question: string;
  required: boolean;
}

export interface ScreeningAnswer {
  question: string;
  answer: string;
}

export interface Vacancy {
  id: string;
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
  company?: Company;
  status: VacancyStatus;
  applicantCount: number;
  viewCount: number;
  responseRate?: number;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  screeningQuestions?: ScreeningQuestion[];
}

export interface Application {
  id: string;
  vacancyId: string;
  candidateId: string;
  status: ApplicationStatus;
  subscriptionPlan?: SubscriptionPlanCode;
  visibilityScore?: number;
  coverLetter?: string;
  cvUrl?: string;
  employerNotes?: string;
  employerRating?: number;
  screeningAnswers?: ScreeningAnswer[];
  vacancy?: Vacancy;
  candidate?: CandidateProfile & { user?: User };
  appliedAt: string;
  reviewedAt?: string;
  updatedAt: string;
}

export interface SavedJob {
  id: string;
  userId: string;
  vacancyId: string;
  vacancy?: Vacancy;
  savedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'application_update' | 'new_application' | 'new_job_match' | 'profile_reminder' | 'company_verification' | 'vacancy_moderation' | 'system';
  title: string;
  body: string;
  data?: Record<string, string>;
  read: boolean;
  createdAt: string;
}

export interface AIResumeSession {
  id: string;
  userId: string;
  type: 'build' | 'improve' | 'rewrite' | 'suggest_skills';
  inputData?: Record<string, unknown>;
  outputData?: Record<string, unknown>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
}

export interface ModerationFlag {
  id: string;
  entityType: 'vacancy' | 'company' | 'user';
  entityId: string;
  reason: string;
  status: ModerationStatus;
  reviewedBy?: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface PlatformStats {
  totalUsers: number;
  candidates: number;
  employers: number;
  admins: number;
  totalCompanies: number;
  verifiedCompanies: number;
  pendingVerificationCompanies: number;
  totalVacancies: number;
  activeVacancies: number;
  pendingModerationVacancies: number;
  totalApplications: number;
  openFlags: number;
}

export interface AdminUserSummary {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
}

export interface AnalyticsSummary {
  totalVacancies: number;
  totalApplicants: number;
  totalViews: number;
  weeklyApplicants: number;
  shortlisted: number;
  hired: number;
  rejected: number;
  responseRate: number;
}
