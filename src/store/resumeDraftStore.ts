import { create } from 'zustand';
import { ParsedResume } from '@/services/aiService';

interface ResumeDraftState {
  draft: ParsedResume | null;
  setDraft: (draft: ParsedResume | null) => void;
  clearDraft: () => void;
}

/**
 * Holds a freshly parsed CV between the upload screen and the review screen.
 * Kept out of React Query so it's a transient, one-shot handoff the user either
 * confirms (merged into the profile) or discards.
 */
export const useResumeDraftStore = create<ResumeDraftState>((set) => ({
  draft: null,
  setDraft: (draft) => set({ draft }),
  clearDraft: () => set({ draft: null }),
}));
