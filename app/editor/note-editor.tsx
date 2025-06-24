import { Effect } from "@tanstack/react-store";
import { useEffect } from "react";
import { ExternalNoteAction } from "~/editor/external-note-action";
import { setNotes } from "~/editor/indexed-db";
import { InternalNoteAction } from "~/editor/internal-note-action";
import {
	NoteStore,
	SystemStore,
	setContent,
	setTitle,
	useNoteStore,
	useSystemStore,
} from "~/editor/store";
import { useDebounceCallback } from "~/editor/use-debounce";
import { Input } from "~/input";

const Metadata = () => {
	const lastUpdated = useNoteStore((state) => state.lastUpdated);
	const save = useSystemStore((state) => state.save);
	if (!lastUpdated) {
		return null;
	}

	const formattedTimestamp = Intl.DateTimeFormat(undefined, {
		dateStyle: "full",
		hourCycle: "h23",
		timeStyle: "full",
	}).format(lastUpdated);

	return (
		<section>
			<time
				className="font-semibold text-gray-400 text-xs transition-colors duration-300 sm:text-sm dark:text-gray-600"
				role="note"
			>
				Last updated at {formattedTimestamp}.
			</time>

			{save !== "idle" && (
				<span className="font-semibold text-gray-400 text-xs transition-colors duration-300 before:content-['_'] sm:text-sm dark:text-gray-600">
					{save === "saving" && "Saving..."}
					{save === "saved" && "Saved."}
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
				aria-label="Note title"
				onChange={({ currentTarget: { value } }) => setTitle(value, Date.now())}
				placeholder="Enter a title"
				readOnly={isFrozen}
				type="title"
				value={title}
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
				aria-label="Note content"
				onChange={({ currentTarget: { value } }) =>
					setContent(value, Date.now())
				}
				placeholder="Start writing, your progress will be automatically stored in your machine's local storage"
				readOnly={isFrozen}
				type="content"
				value={content}
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
		SystemStore.setState((c) => ({ ...c, save: "saved" }));
	}, 100);

	/**
	 * Listen to store changes. If the note changes we want to be able to
	 * debounce the save on Indexed DB.
	 */
	const effect = new Effect({
		deps: [NoteStore],
		fn: () => {
			SystemStore.setState((c) => ({ ...c, save: "saving" }));
			debouncedSave.debouncedFn();
		},
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
		<section className="flex flex-col gap-3 p-1">
			<Metadata />
			<TitleEditor />
			<ContentEditor />
			<InternalNoteAction onSave={handleSave} />
			<ExternalNoteAction onSave={handleSave} />
		</section>
	);
};
