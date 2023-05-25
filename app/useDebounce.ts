import debounce from 'lodash.debounce';
import { useEffect, useMemo, useRef } from 'react';

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
const useDebounce = (callback: () => void) => {
  const ref = useRef<(() => void) | null>(null);

  useEffect(() => {
    ref.current = callback;
  }, [callback]);

  const debouncedCallback = useMemo(() => {
    const fn = () => {
      ref.current?.();
    };

    // Debounces the callback for 100 ms.
    return debounce(fn, 100);
  }, []);

  return debouncedCallback;
};

export default useDebounce;
