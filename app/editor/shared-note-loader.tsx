import { type ReactNode, useId } from 'react';
import { useSharedNote } from '~/editor/use-shared-note';
import { Input } from '~/input';
import { Link } from '~/link';

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
					id={titleId}
					aria-label="Note title"
					type="title"
					placeholder={title}
					value={decodeURIComponent(title)}
					readOnly
				/>
			</section>

			<section>
				<Input
					id={contentId}
					aria-label="Note content"
					type="content"
					placeholder={content}
					value={decodeURIComponent(content)}
					readOnly
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
		return <SharedNote title={sharedNote.title} content={sharedNote.content} />;
	}

	return children;
};
