import { createContext, useContext } from 'react';
import { createStore, useStore } from 'zustand';

import { type Data, type State } from './schema';

export const createApplicationStore = (initialValue: Data) =>
  createStore<State>()((set) => ({
    ...initialValue,
    setTitle: (title: string, lastUpdated: string) =>
      set((state) => ({ notes: { ...state.notes, title, lastUpdated } })),
    setContent: (content: string, lastUpdated: string) =>
      set((state) => ({ notes: { ...state.notes, content, lastUpdated } })),
    setFrozen: (frozen: boolean) =>
      set((state) => ({ notes: { ...state.notes, frozen } })),
    resetContent: (lastUpdated: string) =>
      set((state) => ({ notes: { ...state.notes, content: '', lastUpdated } })),
  }));

type Context = ReturnType<typeof createApplicationStore> | null;

export const ApplicationContext = createContext<Context>(null);

/**
 * Custom hook which returns the Zustand store properties. This function only
 * cares about the UI state, so these functions are pure and will not cause
 * any side-effects, such as writing to the database or any other.
 *
 * @param selector - The Zustand store.
 * @returns The relevant properties of the store that is selected.
 */
export const useData = <T>(selector: (state: State) => T): T => {
  const store = useContext(ApplicationContext);
  if (!store) {
    throw new Error('Context Provider does not exist in the tree.');
  }

  return useStore(store, selector);
};
