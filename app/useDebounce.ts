import { useDebouncedCallback } from 'use-debounce';

// Debounce delay in milliseconds.
const DEBOUNCE_DELAY = 100;

/**
 * A special React Hook to debounce an event. This will persist through re-renders and will
 * debounce the passed callback accordingly. This can only accept a function without arguments at
 * the moment. The basic idea of how things work is documented on the link in this JSDoc, but
 * I used another implementation.
 *
 * {@link https://www.developerway.com/posts/debouncing-in-react}
 * @param callback - Callback function to be debounced.
 * @returns Debounced callback.
 */
const useDebounce = (callback: () => void) => {
  return useDebouncedCallback(callback, DEBOUNCE_DELAY);
};

export default useDebounce;
