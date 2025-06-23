import { Effect } from '@tanstack/react-store';
import { useEffect } from 'react';
import { setNotes } from '~/editor/indexed-db';
import {
	NoteStore,
	SystemStore,
	setContent,
	setTitle,
	useNoteStore,
	useSystemStore,
} from '~/editor/store';
import { useDebounceCallback } from '~/editor/use-debounce';
import { Input } from '~/input';
import { ExternalNoteAction } from './external-note-action';
import { InternalNoteAction } from './internal-note-action';

const Metadata = () => {
	const lastUpdated = useNoteStore((state) => state.lastUpdated);
	const save = useSystemStore((state) => state.save);
	if (!lastUpdated) {
		return null;
	}

	const formattedTimestamp = Intl.DateTimeFormat(undefined, {
		dateStyle: 'full',
		timeStyle: 'full',
		hourCycle: 'h23',
	}).format(lastUpdated);

	return (
		<section>
			<time
				role="note"
				className="text-xs font-semibold text-gray-400 dark:text-gray-600 sm:text-sm transition-colors duration-300"
			>
				Last updated at {formattedTimestamp}.
			</time>

			{save !== 'idle' && (
				<span className="text-xs font-semibold text-gray-400 dark:text-gray-600 before:content-['_'] sm:text-sm transition-colors duration-300">
					{save === 'saving' && 'Saving...'}
					{save === 'saved' && 'Saved.'}
				</span>
			)}
		</section>
	);
};

const TitleEditor = () => {
	const title = useNoteStore((state) => state.title);
	const isFrozen = useNoteStore((state) => state.isFrozen);

	return (
		<section>
			<Input
				type="title"
				aria-label="Note title"
				value={title}
				readOnly={isFrozen}
				onChange={(e) => setTitle(e.currentTarget.value, Date.now())}
				placeholder="Enter a title"
			/>
		</section>
	);
};

const ContentEditor = () => {
	const content = useNoteStore((state) => state.content);
	const isFrozen = useNoteStore((state) => state.isFrozen);

	return (
		<section>
			<Input
				type="content"
				aria-label="Note content"
				value={content}
				readOnly={isFrozen}
				onChange={(e) => setContent(e.currentTarget.value, Date.now())}
				placeholder="Start writing, your progress will be automatically stored in your machine's local storage"
			/>
		</section>
	);
};

export const NoteEditor = () => {
	/**
	 * Prepare a debounced callback to be run.
	 */
	const debouncedSave = useDebounceCallback(async () => {
		await setNotes(NoteStore.state);
		SystemStore.setState((c) => ({ ...c, save: 'saved' }));
	}, 100);

	/**
	 * Listen to store changes. If the note changes we want to be able to
	 * debounce the save on Indexed DB.
	 */
	const effect = new Effect({
		fn: () => {
			SystemStore.setState((c) => ({ ...c, save: 'saving' }));
			debouncedSave.debouncedFn();
		},
		deps: [NoteStore],
	});

	/**
	 * Mount effect on load.
	 */
	useEffect(() => {
		const unmount = effect.mount();

		/**
		 * On app unmount, ensure that we unsubscribe everything, and we try
		 * on a best-effort basis to invoke the debounced save function on Indexed DB. It is
		 * almost not possible to run asychronous functions on cleanup.
		 */
		return () => {
			debouncedSave.flush();
			unmount();
		};
	}, [effect.mount, debouncedSave.flush]);

	const handleSave = async () => {
		await debouncedSave.flush();
	};

	return (
		<section className="flex flex-col gap-3 p-2">
			<Metadata />
			<TitleEditor />
			<ContentEditor />
			<InternalNoteAction onSave={handleSave} />
			<ExternalNoteAction onSave={handleSave} />
		</section>
	);
};
