import { useState } from 'react';

import { type Data, dataSchema, DEFAULT_DATA } from './schema';

export const STORAGE_KEY = 'speednote' as const;

export interface DataService {
  setData(data: Data): void;
  getData(): Data;
}

/**
 * Data store service provider, used to store the data in a data store somewhere.
 * The current implementation uses `localStorage` to store all of the data here,
 * so it takes the `storage` as the main argument. Utilizes dependency injection for
 * easier testability.
 */
const DataService = (storage: Storage): DataService => {
  const setData = (data: Data) => {
    storage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  const getData = () => {
    const storageData = storage.getItem(STORAGE_KEY);
    if (storageData === null) {
      storage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DATA));
      return DEFAULT_DATA;
    }

    // Will fallback to the default values if the user somehow disables JavaScript
    // and fails `JSON.parse` and `JSON.stringify`.
    try {
      return dataSchema.parse(JSON.parse(storageData));
    } catch {
      return DEFAULT_DATA;
    }
  };

  return { setData, getData };
};

/**
 * Custom hook that returns a storage for the consumer to use. The `useState`
 * for `DataService` is required so that it doesn't re-render. `useRef` is
 * basically `useState({ current: initialValue })[0]`.
 *
 * Technically if the user disables the `localStorage`, the browser will throw its own error
 * and it will render the error boundary. We cannot capture that particular error as it's
 * triggered by the browser-level, which is obviously layers above the React/Next layer.
 *
 * {@link https://twitter.com/dan_abramov/status/1099842565631819776}
 * @returns The service provider.
 */
export const useStorage = () => {
  const [service] = useState(() => DataService(localStorage));

  return service;
};
