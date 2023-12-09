import { useCallback, useState } from 'react';

import { type Data } from './schema';

/**
 * Custom hook which returns the required states for the notes and the application.
 * Only cares about the UI state, so these functions are pure and will not cause any
 * side-effects, such as writing to the database or any other.
 *
 * {@link https://kentcdodds.com/blog/should-i-usestate-or-usereducer}
 * @param initialValue - Initial value of the state.
 * @returns The state and the relevant functions.
 */
export const useData = (initialValue: Data) => {
  const [state, setState] = useState<Data>(initialValue);

  const setTitle = useCallback((title: string, lastUpdated: string) => {
    setState((prev) => ({
      ...prev,
      notes: { ...prev.notes, title, lastUpdated },
    }));
  }, []);

  const setContent = useCallback((content: string, lastUpdated: string) => {
    setState((prev) => ({
      ...prev,
      notes: { ...prev.notes, content, lastUpdated },
    }));
  }, []);

  const setFrozen = useCallback((frozen: boolean) => {
    setState((prev) => ({ ...prev, notes: { ...prev.notes, frozen } }));
  }, []);

  const reset = useCallback((lastUpdated: string) => {
    setState((prev) => ({
      ...prev,
      notes: { title: '', content: '', frozen: false, lastUpdated },
    }));
  }, []);

  return { state, setTitle, setContent, setFrozen, reset };
};
