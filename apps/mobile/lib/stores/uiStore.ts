/**
 * UI Store
 *
 * Local UI state management using Zustand.
 * Handles sheet states, planner filters, and pending captures.
 * Filter state is persisted to AsyncStorage.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Types of sheets/modals that can be displayed.
 */
export type SheetType = 'none' | 'noteDetail' | 'filters' | 'behaviourEditor';

/**
 * Filter configuration for planner candidates.
 */
export interface CandidateFilters {
  /** Hide items with future due dates */
  hideFuture: boolean;
  /** Filter by template types (empty = show all) */
  templateTypes: string[];
  /** Filter by tags (empty = show all) */
  tags: string[];
}

/**
 * Pending capture data before submission.
 */
export interface PendingCapture {
  title: string;
  tags: string[];
}

interface UIState {
  /** Currently active sheet/modal */
  activeSheet: SheetType;
  /** Note ID for the active sheet (if applicable) */
  sheetNoteId: string | null;
  /** Planner candidate filters */
  candidateFilters: CandidateFilters;
  /** Pending capture data (not yet submitted) */
  pendingCapture: PendingCapture | null;
}

interface UIActions {
  /**
   * Open a sheet/modal.
   * @param sheet The sheet type to open
   * @param noteId Optional note ID for note-related sheets
   */
  openSheet: (sheet: SheetType, noteId?: string) => void;

  /**
   * Close the active sheet.
   */
  closeSheet: () => void;

  /**
   * Update candidate filters (partial update).
   */
  setFilters: (filters: Partial<CandidateFilters>) => void;

  /**
   * Reset filters to defaults.
   */
  resetFilters: () => void;

  /**
   * Set pending capture data.
   */
  setPendingCapture: (capture: PendingCapture | null) => void;
}

type UIStore = UIState & UIActions;

const defaultFilters: CandidateFilters = {
  hideFuture: false,
  templateTypes: [],
  tags: [],
};

const initialState: UIState = {
  activeSheet: 'none',
  sheetNoteId: null,
  candidateFilters: defaultFilters,
  pendingCapture: null,
};

/**
 * UI store with partial persistence.
 * Only candidateFilters are persisted (user preferences).
 * Sheet state and pending capture are ephemeral.
 */
export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      ...initialState,

      openSheet: (sheet: SheetType, noteId?: string) => {
        set({
          activeSheet: sheet,
          sheetNoteId: noteId ?? null,
        });
      },

      closeSheet: () => {
        set({
          activeSheet: 'none',
          sheetNoteId: null,
        });
      },

      setFilters: (filters: Partial<CandidateFilters>) => {
        set((state) => ({
          candidateFilters: {
            ...state.candidateFilters,
            ...filters,
          },
        }));
      },

      resetFilters: () => {
        set({ candidateFilters: defaultFilters });
      },

      setPendingCapture: (capture: PendingCapture | null) => {
        set({ pendingCapture: capture });
      },
    }),
    {
      name: 'ui-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist filters (user preferences)
      partialize: (state) => ({
        candidateFilters: state.candidateFilters,
      }),
    }
  )
);
