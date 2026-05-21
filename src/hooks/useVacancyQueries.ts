import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Company, Vacancy, VacancyStatus } from '@/types/models';
import {
  vacancyService,
  VacancyMutationInput,
  CompanyMutationInput,
} from '@/services/vacancyService';

export const vacancyQueryKeys = {
  all: ['vacancies'] as const,
  candidate: ['vacancies', 'candidate'] as const,
  employer: (userId: string) => ['vacancies', 'employer', userId] as const,
  detail: (id: string) => ['vacancies', 'detail', id] as const,
  employerCompany: (userId: string) => ['companies', 'employer', userId] as const,
};

function updateVacancyInList(
  vacancies: Vacancy[] | undefined,
  updatedVacancy: Vacancy
): Vacancy[] {
  if (!vacancies) return [updatedVacancy];

  const hasExisting = vacancies.some((vacancy) => vacancy.id === updatedVacancy.id);

  if (!hasExisting) {
    return [updatedVacancy, ...vacancies];
  }

  return vacancies.map((vacancy) =>
    vacancy.id === updatedVacancy.id ? updatedVacancy : vacancy
  );
}

export function useCandidateVacancies() {
  return useQuery({
    queryKey: vacancyQueryKeys.candidate,
    queryFn: () => vacancyService.fetchCandidateVacancies(),
  });
}

export function useEmployerVacancies(userId?: string) {
  return useQuery({
    enabled: !!userId,
    queryKey: vacancyQueryKeys.employer(userId || 'unknown'),
    queryFn: () => vacancyService.fetchEmployerVacancies(userId || ''),
  });
}

export function useEmployerCompany(userId?: string) {
  return useQuery({
    enabled: !!userId,
    queryKey: vacancyQueryKeys.employerCompany(userId || 'unknown'),
    queryFn: () => vacancyService.fetchEmployerCompany(userId || ''),
  });
}

export function useUpdateEmployerCompany(userId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      companyId,
      input,
    }: {
      companyId: string;
      input: CompanyMutationInput;
    }) => vacancyService.updateEmployerCompany(companyId, input),
    onSuccess: (company) => {
      if (userId) {
        queryClient.setQueryData<Company | null>(
          vacancyQueryKeys.employerCompany(userId),
          company
        );
      }

      queryClient.invalidateQueries({ queryKey: vacancyQueryKeys.all });
    },
  });
}

export function useVacancy(id?: string) {
  return useQuery({
    enabled: !!id,
    queryKey: vacancyQueryKeys.detail(id || 'unknown'),
    queryFn: () => vacancyService.fetchVacancyById(id || ''),
  });
}

export function useCreateVacancy(userId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: VacancyMutationInput) =>
      vacancyService.createVacancy(input),
    onSuccess: (createdVacancy) => {
      if (userId) {
        queryClient.setQueryData<Vacancy[]>(
          vacancyQueryKeys.employer(userId),
          (current) => updateVacancyInList(current, createdVacancy)
        );
      }

      if (createdVacancy.status === 'active') {
        queryClient.setQueryData<Vacancy[]>(
          vacancyQueryKeys.candidate,
          (current) => updateVacancyInList(current, createdVacancy)
        );
      }

      queryClient.setQueryData(
        vacancyQueryKeys.detail(createdVacancy.id),
        createdVacancy
      );
      queryClient.invalidateQueries({ queryKey: vacancyQueryKeys.all });
    },
  });
}

export function useUpdateVacancy(userId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: VacancyMutationInput;
    }) => vacancyService.updateVacancy(id, input),
    onSuccess: (updatedVacancy) => {
      if (userId) {
        queryClient.setQueryData<Vacancy[]>(
          vacancyQueryKeys.employer(userId),
          (current) => updateVacancyInList(current, updatedVacancy)
        );
      }

      queryClient.setQueryData<Vacancy[]>(
        vacancyQueryKeys.candidate,
        (current) => {
          const next = updateVacancyInList(current, updatedVacancy);
          return next.filter((vacancy) => vacancy.status === 'active');
        }
      );

      queryClient.setQueryData(
        vacancyQueryKeys.detail(updatedVacancy.id),
        updatedVacancy
      );
      queryClient.invalidateQueries({ queryKey: vacancyQueryKeys.all });
    },
  });
}

export function useUpdateVacancyStatus(userId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: VacancyStatus }) =>
      vacancyService.updateVacancyStatus(id, status),
    onSuccess: (updatedVacancy) => {
      if (userId) {
        queryClient.setQueryData<Vacancy[]>(
          vacancyQueryKeys.employer(userId),
          (current) => updateVacancyInList(current, updatedVacancy)
        );
      }

      queryClient.setQueryData<Vacancy[]>(
        vacancyQueryKeys.candidate,
        (current) => {
          const next = updateVacancyInList(current, updatedVacancy);
          return next.filter((vacancy) => vacancy.status === 'active');
        }
      );

      queryClient.setQueryData(
        vacancyQueryKeys.detail(updatedVacancy.id),
        updatedVacancy
      );
      queryClient.invalidateQueries({ queryKey: vacancyQueryKeys.all });
    },
  });
}

export function useDeleteVacancy(userId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => vacancyService.deleteVacancy(id),
    onSuccess: (_, deletedId) => {
      if (userId) {
        queryClient.setQueryData<Vacancy[]>(
          vacancyQueryKeys.employer(userId),
          (current) =>
            (current || []).filter((vacancy) => vacancy.id !== deletedId)
        );
      }

      queryClient.setQueryData<Vacancy[]>(
        vacancyQueryKeys.candidate,
        (current) =>
          (current || []).filter((vacancy) => vacancy.id !== deletedId)
      );

      queryClient.removeQueries({
        queryKey: vacancyQueryKeys.detail(deletedId),
      });
      queryClient.invalidateQueries({ queryKey: vacancyQueryKeys.all });
    },
  });
}
