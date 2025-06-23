import { batch } from '@tanstack/react-store';
import { type ReactNode, useEffect } from 'react';
import { Link } from '~/link';
import { getNotes } from './indexed-db';
import { SystemStore, setInitialNoteStore, useSystemStore } from './store';

/**
 * Loader to get the note data from Indexed DB.
 *
 * @package
 */
export const NoteStorageLoader = ({ children }: { children: ReactNode }) => {
	const stage = useSystemStore((state) => state.stage);
	const error = useSystemStore((state) => state.error);

	useEffect(() => {
		getNotes()
			.then((note) => {
				batch(() => {
					SystemStore.setState({ stage: 'loaded', save: 'idle', error: null });
					setInitialNoteStore(note);
				});
			})
			.catch((error) => {
				SystemStore.setState({ stage: 'error', save: 'idle', error });
			});
	}, []);

	if (stage === 'initializing') {
		return (
			<div className="flex flex-1 flex-col items-center justify-center gap-2 text-center text-gray-600 dark:text-gray-400">
				<span>Initializing the flash editor by loading from IndexedDB...</span>
				<span>
					In case it is still loading, please refresh the page by clicking the
					button below!
				</span>
				<Link href="/">Reload</Link>
			</div>
		);
	}

	if (stage === 'error') {
		return (
			<div className="flex flex-1 flex-col items-center justify-center gap-2 text-center text-gray-600 dark:text-gray-400">
				<p>We encountered an error when loading from the browser's storage.</p>
				<p>Please report this to the developer in GitHub!</p>
				<pre>{JSON.stringify(error, null, 2)}</pre>
			</div>
		);
	}

	// After everything has been loaded from IndexedDB, load the children.
	return children;
};
