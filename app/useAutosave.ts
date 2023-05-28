import { useEffect, useRef } from 'react';

// Delay in milliseconds.
const AUTOSAVE_DELAY = 500;

/**
 * Autosave is technically a wrong name, but it's more like calling a recurring
 * function that would be done after every `delay`. This function is used to simulate
 * autosaves for every period.
 *
 * @param callback - Callback that would be called.
 * @param delay - Delay of the function.
 */
const useAutosave = (callback: () => void, delay: number = AUTOSAVE_DELAY) => {
  const ref = useRef<(() => void) | null>(null);

  useEffect(() => {
    ref.current = callback;
  }, [callback]);

  useEffect(() => {
    const fn = () => {
      ref.current?.();
    };

    const callbackInterval = setInterval(fn, delay);
    return () => clearInterval(callbackInterval);
  }, [delay]);
};

export default useAutosave;
