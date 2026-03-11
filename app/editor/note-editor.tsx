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
				<output className="font-semibold text-gray-400 text-xs transition-colors duration-300 before:content-['_'] sm:text-sm dark:text-gray-600">
					{save === "saving" && "Saving..."}
					{save === "saved" && "Saved."}
				</output>
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
	 * Mount effect on load.
	 */
	useEffect(() => {
		/**
		 * Listen to store changes. If the note changes we want to be able to
		 * debounce the save on Indexed DB. This store is only mounted once during the
		 * application's lifecycle.
		 */
		const { unsubscribe } = NoteStore.subscribe(() => {
			SystemStore.setState((c) => ({ ...c, save: "saving" }));
			debouncedSave.debouncedFn();
		});

		/**
		 * If the user switched tabs, minimized the browser, or closed the page,
		 * immediately save and unmount the effect.
		 */
		const handleVisibilityChange = async () => {
			if (document.visibilityState === "visible") {
				return;
			}

			await debouncedSave.flush();
		};

		/**
		 * If the user is using an old browser, we handle the tab close with another function
		 * that does the same thing as the above.
		 */
		const handlePageHide = async () => {
			await debouncedSave.flush();
		};

		/**
		 * Listen for visibility changes.
		 */
		document.addEventListener("visibilitychange", handleVisibilityChange);

		/**
		 * Listen for page hide, as the fallback.
		 */
		window.addEventListener("pagehide", handlePageHide);

		/**
		 * On app unmount, remove all of the event listeners.
		 */
		return () => {
			unsubscribe();
			document.removeEventListener("visibilitychange", handleVisibilityChange);
			window.removeEventListener("pagehide", handlePageHide);
		};
	}, [debouncedSave]);

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
