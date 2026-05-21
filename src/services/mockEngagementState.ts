import { Application, ApplicationStatus, Notification } from '@/types/models';
import {
  mockApplications,
  mockCandidateProfile,
  mockEmployerUser,
  mockNotifications,
  mockUser,
  mockVacancies,
} from './mockData';

const initialEmployerNotifications: Notification[] = [
  {
    id: 'e1',
    userId: '2',
    type: 'new_application',
    title: 'Yeni müraciət',
    body: 'Senior React Native Developer vakansiyasına yeni müraciət daxil oldu.',
    data: { vacancyId: '1' },
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 'e2',
    userId: '2',
    type: 'new_application',
    title: 'Yeni müraciət',
    body: 'DevOps Engineer vakansiyasına yeni müraciət daxil oldu.',
    data: { vacancyId: '6' },
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: 'e3',
    userId: '2',
    type: 'company_verification',
    title: 'Şirkət təsdiqləndi',
    body: 'Kapital Bank şirkəti uğurla təsdiqləndi.',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: 'e4',
    userId: '2',
    type: 'vacancy_moderation',
    title: 'Vakansiya təsdiqləndi',
    body: 'Senior React Native Developer vakansiyası dərc edildi.',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
];

let mockApplicationState: Application[] = mockApplications.map((application) => ({
  ...application,
}));

let mockCandidateNotificationState: Notification[] = mockNotifications.map((notification) => ({
  ...notification,
  data: notification.data ? { ...notification.data } : undefined,
}));

let mockEmployerNotificationState: Notification[] = initialEmployerNotifications.map((notification) => ({
  ...notification,
  data: notification.data ? { ...notification.data } : undefined,
}));

function cloneApplication(application: Application): Application {
  return {
    ...application,
    vacancy: application.vacancy
      ? {
          ...application.vacancy,
          company: application.vacancy.company ? { ...application.vacancy.company } : undefined,
        }
      : undefined,
    candidate: application.candidate
      ? {
          ...application.candidate,
          skills: [...application.candidate.skills],
          workExperience: [...application.candidate.workExperience],
          education: [...application.candidate.education],
          languages: [...application.candidate.languages],
          certifications: [...application.candidate.certifications],
          user: application.candidate.user ? { ...application.candidate.user } : undefined,
        }
      : undefined,
  };
}

function cloneNotification(notification: Notification): Notification {
  return {
    ...notification,
    data: notification.data ? { ...notification.data } : undefined,
  };
}

function enrichMockApplication(application: Application): Application {
  const vacancy = application.vacancy || mockVacancies.find((item) => item.id === application.vacancyId);

  return cloneApplication({
    ...application,
    vacancy,
    candidate: application.candidate || { ...mockCandidateProfile, user: mockUser },
  });
}

function nextId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function prependNotification(notification: Notification) {
  if (notification.userId === mockEmployerUser.id) {
    mockEmployerNotificationState = [notification, ...mockEmployerNotificationState];
    return;
  }

  mockCandidateNotificationState = [notification, ...mockCandidateNotificationState];
}

export function getMockEmployerApplications(userId: string): Application[] {
  return mockApplicationState
    .map(enrichMockApplication)
    .filter((application) => application.vacancy?.company?.ownerId === userId);
}

export function getMockCandidateApplications(userId: string): Application[] {
  if (mockCandidateProfile.userId !== userId) {
    return [];
  }

  return mockApplicationState
    .map(enrichMockApplication)
    .filter((application) => application.candidateId === mockCandidateProfile.id);
}

export function getMockApplicationById(applicationId: string): Application | undefined {
  const application = mockApplicationState.find((item) => item.id === applicationId);
  return application ? enrichMockApplication(application) : undefined;
}

export function getMockApplicationByVacancyId(vacancyId: string): Application | undefined {
  const application = mockApplicationState.find((item) => item.vacancyId === vacancyId);
  return application ? enrichMockApplication(application) : undefined;
}

export function addMockApplication(application: Application): Application {
  const vacancy = mockVacancies.find((item) => item.id === application.vacancyId);

  if (vacancy) {
    vacancy.applicantCount += 1;
    vacancy.updatedAt = new Date().toISOString();
  }

  const enriched = enrichMockApplication(application);
  mockApplicationState = [cloneApplication(enriched), ...mockApplicationState];
  return enriched;
}

export function updateMockApplicationStatus(
  applicationId: string,
  status: ApplicationStatus
): Application {
  const existing = mockApplicationState.find((item) => item.id === applicationId);

  if (!existing) {
    throw new Error('Application not found');
  }

  const updated: Application = {
    ...existing,
    status,
    reviewedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockApplicationState = mockApplicationState.map((item) =>
    item.id === applicationId ? cloneApplication(updated) : item
  );

  const enriched = enrichMockApplication(updated);
  createMockCandidateStatusNotification(enriched);
  return enriched;
}

export function updateMockApplicationReview(
  applicationId: string,
  review: { employerNotes?: string; employerRating?: number }
): Application {
  const existing = mockApplicationState.find((item) => item.id === applicationId);

  if (!existing) {
    throw new Error('Application not found');
  }

  const updated: Application = {
    ...existing,
    employerNotes: review.employerNotes,
    employerRating: review.employerRating,
    reviewedAt: existing.reviewedAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockApplicationState = mockApplicationState.map((item) =>
    item.id === applicationId ? cloneApplication(updated) : item
  );

  return enrichMockApplication(updated);
}

export function createMockEmployerApplicationNotification(application: Application): Notification {
  const vacancy = application.vacancy || mockVacancies.find((item) => item.id === application.vacancyId);

  const notification: Notification = {
    id: nextId('mock-employer-notification'),
    userId: vacancy?.company?.ownerId || mockEmployerUser.id,
    type: 'new_application',
    title: 'Yeni müraciət',
    body: `${vacancy?.title || 'Vakansiya'} vakansiyasına yeni müraciət daxil oldu.`,
    data: {
      applicationId: application.id,
      vacancyId: application.vacancyId,
    },
    read: false,
    createdAt: new Date().toISOString(),
  };

  prependNotification(notification);
  return cloneNotification(notification);
}

export function createMockCandidateStatusNotification(application: Application): Notification {
  const vacancyTitle = application.vacancy?.title || 'Vakansiya';

  const titleMap: Record<ApplicationStatus, string> = {
    pending: 'Müraciət yeniləndi',
    reviewed: 'Müraciətiniz baxıldı',
    shortlisted: 'Seçilmişlər siyahısına əlavə olundunuz',
    rejected: 'Müraciətiniz rədd edildi',
    accepted: 'Müraciətiniz qəbul edildi',
  };

  const bodyMap: Record<ApplicationStatus, string> = {
    pending: `${vacancyTitle} vakansiyası üzrə müraciət statusunuz yeniləndi.`,
    reviewed: `${vacancyTitle} vakansiyasına müraciətiniz baxıldı.`,
    shortlisted: `${vacancyTitle} vakansiyası üçün seçilmişlər siyahısına əlavə olundunuz.`,
    rejected: `${vacancyTitle} vakansiyası üçün müraciətiniz rədd edildi.`,
    accepted: `${vacancyTitle} vakansiyası üçün müraciətiniz qəbul edildi.`,
  };

  const notification: Notification = {
    id: nextId('mock-candidate-notification'),
    userId: mockCandidateProfile.userId,
    type: 'application_update',
    title: titleMap[application.status],
    body: bodyMap[application.status],
    data: {
      applicationId: application.id,
      vacancyId: application.vacancyId,
      status: application.status,
    },
    read: false,
    createdAt: new Date().toISOString(),
  };

  prependNotification(notification);
  return cloneNotification(notification);
}

export function getMockNotifications(userId: string): Notification[] {
  const source = userId === mockEmployerUser.id
    ? mockEmployerNotificationState
    : userId === mockCandidateProfile.userId
      ? mockCandidateNotificationState
      : [];

  return source
    .map(cloneNotification)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function markMockNotificationRead(notificationId: string): Notification {
  const employerNotification = mockEmployerNotificationState.find((item) => item.id === notificationId);

  if (employerNotification) {
    employerNotification.read = true;
    return cloneNotification(employerNotification);
  }

  const candidateNotification = mockCandidateNotificationState.find((item) => item.id === notificationId);

  if (!candidateNotification) {
    throw new Error('Notification not found');
  }

  candidateNotification.read = true;
  return cloneNotification(candidateNotification);
}

export function markAllMockNotificationsRead(userId: string): void {
  if (userId === mockEmployerUser.id) {
    mockEmployerNotificationState = mockEmployerNotificationState.map((notification) => ({
      ...notification,
      read: true,
    }));
    return;
  }

  if (userId === mockCandidateProfile.userId) {
    mockCandidateNotificationState = mockCandidateNotificationState.map((notification) => ({
      ...notification,
      read: true,
    }));
  }
}
