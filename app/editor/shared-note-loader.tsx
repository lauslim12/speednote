import { type ReactNode, useId } from "react";
import { useSharedNote } from "~/editor/use-shared-note";
import { Input } from "~/input";
import { Link } from "~/link";

type SharedNoteProps = {
	title: string;
	content: string;
};

/**
 * In this component, the `value` of the `title` and `content` has to be inserted into
 * `decodeURIComponent` to prevent errors when sharing notes with Kanji characters, or any
 * other characters outside of the `Latin1` range.
 *
 * {@link https://github.com/lauslim12/speednote/issues/36}
 * @package
 */
export const SharedNote = ({ title, content }: SharedNoteProps) => {
	const titleId = useId();
	const contentId = useId();

	return (
		<section>
			<section>
				<Input
					aria-label="Note title"
					id={titleId}
					placeholder={title}
					readOnly
					type="title"
					value={decodeURIComponent(title)}
				/>
			</section>

			<section>
				<Input
					aria-label="Note content"
					id={contentId}
					placeholder={content}
					readOnly
					type="content"
					value={decodeURIComponent(content)}
				/>
			</section>

			<section>
				<Link href="/">Return to your note</Link>
			</section>
		</section>
	);
};

/**
 * The shared loader of the editor. Will see if the URL search parameters contains
 * any special query parameters that marks of a shared note. If observing a shared
 * note, IndexedDB will not be loaded, but system will be loaded.
 */
export const SharedNoteLoader = ({ children }: { children: ReactNode }) => {
	const sharedNote = useSharedNote();

	if (sharedNote.isShared) {
		return <SharedNote content={sharedNote.content} title={sharedNote.title} />;
	}

	return children;
};
