import { Store, useStore } from '@tanstack/react-store';

/**
 * Type definition for the `NoteStore` state.
 * Represents the content and metadata of the current note.
 */
type NoteStore = {
	/** The note's title */
	title: string;
	/** The note's content */
	content: string;
	/** Whether the note is frozen (read-only) */
	isFrozen: boolean;
	/** The timestamp (epoch ms) when the note was last updated */
	lastUpdated: number;
};

/**
 * Type definition for the `SystemStore` state.
 * Tracks global system status and error info.
 */
type SystemStore = {
	/** The loading stage of the app */
	stage: 'initializing' | 'loaded' | 'error';
	/** The note save status */
	save: 'idle' | 'saving' | 'saved';
	/** Any error caught during system operations */
	error: unknown;
};

/**
 * The global system state store.
 * Manages app lifecycle status, save progress, and error reporting.
 *
 * @package
 */
export const SystemStore = new Store<SystemStore>({
	stage: 'initializing',
	save: 'idle',
	error: null,
});

/**
 * React hook to select a slice of the system store.
 * Use for reactive UI updates based on system state.
 *
 * @param selector Function to select a piece of SystemStore state.
 * @returns The selected value, triggers re-render on change.
 * @package
 */
export const useSystemStore = <T>(selector: (state: SystemStore) => T): T => {
	return useStore(SystemStore, selector);
};

/**
 * The store representing the current note's content and status.
 *
 * @package
 */
export const NoteStore = new Store<NoteStore>({
	title: '',
	content: '',
	isFrozen: false,
	lastUpdated: Date.now(),
});

/**
 * Updates the note's title and sets the new last updated timestamp.
 *
 * @package
 */
export const setTitle = (title: string, lastUpdated: number) => {
	NoteStore.setState((state) => ({ ...state, title, lastUpdated }));
};

/**
 * Updates the note's content and sets the new last updated timestamp.
 *
 * @package
 */
export const setContent = (content: string, lastUpdated: number) => {
	NoteStore.setState((state) => ({ ...state, content, lastUpdated }));
};

/**
 * Updates the frozen state of the note.
 * When frozen, the note will be read-only and cannot be edited.
 *
 * @package
 */
export const setFrozen = (isFrozen: boolean) => {
	NoteStore.setState((state) => ({ ...state, isFrozen }));
};

/**
 * Resets the note's content to an empty string and updates the last updated timestamp.
 *
 * @package
 */
export const resetContent = (lastUpdated: number) => {
	NoteStore.setState((state) => ({
		...state,
		content: '',
		lastUpdated,
	}));
};

/**
 * Sets the entire note store state at once (e.g., when loading from storage).
 *
 * @package
 */
export const setInitialNoteStore = (note: NoteStore) => {
	NoteStore.setState(note);
};

/**
 * React hook to select a slice of the note store.
 * Use to reactively update UI based on note changes.
 *
 * @param selector Function to select a piece of NoteStore state.
 * @returns The selected value, triggers re-render on change.
 * @package
 */
export const useNoteStore = <T>(selector: (state: NoteStore) => T): T => {
	return useStore(NoteStore, selector);
};
