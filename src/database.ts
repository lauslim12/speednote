import type { Data } from './schema';
import { dataSchema } from './schema';

export const STORAGE_KEY = 'speednote' as const;

export const DEFAULT_DATA: Data = {
	notes: {
		title: '',
		content: '',
		lastUpdated: '',
		frozen: false,
	},
};

export interface DatabaseService {
	setData(data: Data): void;
	getData(): Data;
}

/**
 * Database provider, used to store the data in a data store somewhere.
 * The current implementation uses `localStorage` to store all of the data here,
 * so it takes the `storage` as the main argument. Utilizes dependency injection for
 * easier testability.
 */
export const createLocalDatabase = (storage: Storage): DatabaseService => {
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
