import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useUIStore, type CandidateFilters, type PendingCapture } from '../uiStore';

// Mock AsyncStorage
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn().mockResolvedValue(null),
    setItem: vi.fn().mockResolvedValue(undefined),
    removeItem: vi.fn().mockResolvedValue(undefined),
  },
}));

const defaultFilters: CandidateFilters = {
  hideFuture: false,
  templateTypes: [],
  tags: [],
};

describe('uiStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useUIStore.setState({
      activeSheet: 'none',
      sheetNoteId: null,
      candidateFilters: { ...defaultFilters },
      pendingCapture: null,
    });
  });

  describe('openSheet', () => {
    it('should set activeSheet', () => {
      useUIStore.getState().openSheet('noteDetail');

      expect(useUIStore.getState().activeSheet).toBe('noteDetail');
    });

    it('should set sheetNoteId when provided', () => {
      useUIStore.getState().openSheet('noteDetail', 'note-123');

      const state = useUIStore.getState();
      expect(state.activeSheet).toBe('noteDetail');
      expect(state.sheetNoteId).toBe('note-123');
    });

    it('should set sheetNoteId to null when not provided', () => {
      useUIStore.setState({ sheetNoteId: 'previous-note' });
      useUIStore.getState().openSheet('filters');

      expect(useUIStore.getState().sheetNoteId).toBeNull();
    });
  });

  describe('closeSheet', () => {
    it('should reset activeSheet to none', () => {
      useUIStore.setState({ activeSheet: 'noteDetail', sheetNoteId: 'note-123' });

      useUIStore.getState().closeSheet();

      const state = useUIStore.getState();
      expect(state.activeSheet).toBe('none');
      expect(state.sheetNoteId).toBeNull();
    });
  });

  describe('setFilters', () => {
    it('should merge filters with existing state', () => {
      useUIStore.getState().setFilters({ hideFuture: true });

      expect(useUIStore.getState().candidateFilters).toEqual({
        hideFuture: true,
        templateTypes: [],
        tags: [],
      });
    });

    it('should update templateTypes', () => {
      useUIStore.getState().setFilters({ templateTypes: ['Task', 'Recipe'] });

      expect(useUIStore.getState().candidateFilters.templateTypes).toEqual(['Task', 'Recipe']);
    });

    it('should update tags', () => {
      useUIStore.getState().setFilters({ tags: ['home', 'work'] });

      expect(useUIStore.getState().candidateFilters.tags).toEqual(['home', 'work']);
    });

    it('should preserve other filter properties when updating one', () => {
      useUIStore.setState({
        candidateFilters: {
          hideFuture: true,
          templateTypes: ['Task'],
          tags: ['home'],
        },
      });

      useUIStore.getState().setFilters({ hideFuture: false });

      expect(useUIStore.getState().candidateFilters).toEqual({
        hideFuture: false,
        templateTypes: ['Task'],
        tags: ['home'],
      });
    });
  });

  describe('resetFilters', () => {
    it('should reset filters to defaults', () => {
      useUIStore.setState({
        candidateFilters: {
          hideFuture: true,
          templateTypes: ['Task', 'Recipe'],
          tags: ['home', 'work', 'urgent'],
        },
      });

      useUIStore.getState().resetFilters();

      expect(useUIStore.getState().candidateFilters).toEqual(defaultFilters);
    });
  });

  describe('setPendingCapture', () => {
    it('should set pending capture data', () => {
      const capture: PendingCapture = {
        title: 'Buy groceries',
        tags: ['shopping', 'home'],
      };

      useUIStore.getState().setPendingCapture(capture);

      expect(useUIStore.getState().pendingCapture).toEqual(capture);
    });

    it('should clear pending capture when set to null', () => {
      useUIStore.setState({
        pendingCapture: { title: 'Something', tags: [] },
      });

      useUIStore.getState().setPendingCapture(null);

      expect(useUIStore.getState().pendingCapture).toBeNull();
    });
  });
});
