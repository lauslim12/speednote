import debounce from 'lodash.debounce';
import { useLayoutEffect, useMemo, useRef } from 'react';

/**
 * A special React Hook to debounce an event. This will persist through re-renders and will
 * debounce the passed callback accordingly. This can only accept a function without arguments at
 * the moment. I followed the tutorial from the link below, and TypeScript'd it so that it can
 * accept types.
 *
 * {@link https://www.developerway.com/posts/debouncing-in-react}
 * @param callback - Callback function to be debounced.
 * @returns Debounced callback.
 */

export const useDebounce = (callback: (...args: any[]) => void) => {
  const ref = useRef<((...args: any[]) => void) | null>(null);

  // Only called in the initial render before browser finished
  // painting the screen.
  useLayoutEffect(() => {
    ref.current = callback;
  });

  const debouncedCallback = useMemo(() => {
    const fn = (...args: any[]) => {
      ref.current?.(...args);
    };

    return debounce((...args: any[]) => fn(...args), 100);
  }, []);

  return debouncedCallback;
};
