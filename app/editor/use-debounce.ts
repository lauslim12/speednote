import { useCallback, useEffect, useRef } from 'react';

/**
 * Return value of useDebounceCallback. Provides the debounced function,
 * plus methods to immediately invoke (flush) or cancel any pending calls.
 *
 * @template CallbackArgs - Arguments passed to the debounced function.
 * @template CallbackResult - Return value of the debounced function.
 */
interface UseDebounceCallbackReturn<
	CallbackArgs extends unknown[],
	CallbackResult,
> {
	/**
	 * The debounced function. Calls the original callback after the delay.
	 * If called again before the delay, resets the timer.
	 */
	debouncedFn: (...args: CallbackArgs) => void;
	/**
	 * Executes the pending callback immediately with the last arguments,
	 * cancelling any pending debounced call.
	 * @returns The callback's return value, or undefined if not called.
	 */
	flush: () => CallbackResult | undefined;
	/**
	 * Cancels any pending debounced call. The callback will not be fired.
	 */
	cancel: () => void;
}

/**
 * React hook to debounce a callback function.
 *
 * Returns a debounced version of the callback, plus `flush` and `cancel` methods.
 * The debounced function will wait for the specified delay after the last call
 * before invoking the callback. The most recent arguments are always used.
 *
 * @template F - The function type to debounce.
 * @param callback - The function to debounce.
 * @param delay - Delay in milliseconds.
 * @returns Object with the debounced function (`debouncedFn`), `flush`, and `cancel` methods.
 *
 * @example
 * const { debouncedFn, flush, cancel } = useDebounceCallback((text) => save(text), 500);
 * debouncedFn('hello'); // Will call save('hello') after 500ms if not called again
 *
 * @package
 */
export function useDebounceCallback<F extends (...args: unknown[]) => unknown>(
	callback: F,
	delay: number,
): UseDebounceCallbackReturn<Parameters<F>, ReturnType<F>> {
	const callbackRef = useRef<F>(callback);

	const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
	const lastArgsRef = useRef<Parameters<F> | undefined>(undefined);
	const lastResultRef = useRef<ReturnType<F> | undefined>(undefined);

	// Keep callbackRef updated to always use the latest function
	useEffect(() => {
		callbackRef.current = callback;
	}, [callback]);

	/**
	 * Debounced function: schedules the callback to run after the delay.
	 * If called again before the delay, resets the timer.
	 */
	const debouncedFn = useCallback(
		(...args: Parameters<F>) => {
			lastArgsRef.current = args;

			if (timerRef.current !== undefined) {
				clearTimeout(timerRef.current);
			}

			timerRef.current = setTimeout(() => {
				// Only run if arguments are still present
				if (!lastArgsRef.current) {
					return;
				}
				lastResultRef.current = callbackRef.current(
					...lastArgsRef.current,
				) as ReturnType<F>;
				timerRef.current = undefined;
				lastArgsRef.current = undefined;
			}, delay);
		},
		[delay],
	);

	/**
	 * Immediately runs the pending callback with the last arguments and clears any timer.
	 * Does nothing if no debounced call is pending.
	 */
	const flush = useCallback((): ReturnType<F> | undefined => {
		if (timerRef.current === undefined || !lastArgsRef.current) {
			return lastResultRef.current;
		}

		clearTimeout(timerRef.current);
		lastResultRef.current = callbackRef.current(
			...lastArgsRef.current,
		) as ReturnType<F>;

		timerRef.current = undefined;
		lastArgsRef.current = undefined;
		return lastResultRef.current;
	}, []);

	/**
	 * Cancels any pending debounced call, discarding arguments and timer.
	 */
	const cancel = useCallback(() => {
		if (timerRef.current === undefined) {
			return;
		}
		clearTimeout(timerRef.current);
		timerRef.current = undefined;
		lastArgsRef.current = undefined;
	}, []);

	// Cleanup on unmount: clear any pending timer for this hook instance.
	useEffect(() => {
		const currentTimerId = timerRef.current;
		return () => {
			if (currentTimerId !== undefined) {
				clearTimeout(currentTimerId);
			}
		};
	}, []);

	return { debouncedFn, flush, cancel };
}
