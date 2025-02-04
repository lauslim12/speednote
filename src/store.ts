import { createStore, unwrap } from 'solid-js/store';

import type { Data } from './schema';

export interface StoreService {
	getState: () => Data;
	setTitle: (title: string, lastUpdated: string) => void;
	setContent: (content: string, lastUpdated: string) => void;
	setFrozen: (frozen: boolean) => void;
	resetContent: (lastUpdated: string) => void;
}

export const createApplicationStore = (initial: Data) => {
	const [state, setState] = createStore(initial);

	const setTitle = (title: string, lastUpdated: string) => {
		setState('notes', (state) => ({ ...state, title, lastUpdated }));
	};

	const setContent = (content: string, lastUpdated: string) => {
		setState('notes', (state) => ({ ...state, content, lastUpdated }));
	};

	const setFrozen = (frozen: boolean) => {
		setState('notes', 'frozen', frozen);
	};

	const resetContent = (lastUpdated: string) => {
		setState('notes', (state) => ({ ...state, content: '', lastUpdated }));
	};

	const getState = () => {
		return unwrap(state);
	};

	const store: StoreService = {
		getState,
		setTitle,
		setContent,
		setFrozen,
		resetContent,
	};

	return { state, store };
};
