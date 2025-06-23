import { toast } from 'sonner';
import { Button } from '~/button';
import { NoteStore } from './store';

type ExternalNoteActionProps = {
	onSave: () => void;
};

/**
 * External note actions.
 *
 * @package
 */
export const ExternalNoteAction = ({ onSave }: ExternalNoteActionProps) => {
	const handleShareNote = () => {
		// Save the note initially, so that we're sure that the changes are committed.
		onSave();

		// Get the current, last updated.
		const { title, content } = NoteStore.state;

		// Set new query parameters. Encode as URI component to prevent
		// failure when sharing Kanji characters or any other characters
		// that exist outside of the Latin1 range.
		// Reference: https://github.com/lauslim12/speednote/issues/36.
		const newSearchParams = new URLSearchParams();
		if (title !== '') {
			newSearchParams.set('title', window.btoa(encodeURIComponent(title)));
		}

		if (content !== '') {
			newSearchParams.set('content', window.btoa(encodeURIComponent(content)));
		}

		// Copy the URL the user's clipboard. I know that the `writeText` is supposed
		// to be asynchronous, but for some reason, if I `await` it, it doesn't work
		// in one phone, but works in other devices. Because it's really strange, I decided
		// to just not put `await` in front of the function call.
		const url = `${window.location.href}?${newSearchParams.toString()}`;
		navigator.clipboard.writeText(url);
		toast.success('Shared note URL has been copied to clipboard.');
	};

	return (
		<section className="flex gap-4">
			<Button onClick={handleShareNote}>Copy/share note link</Button>
		</section>
	);
};
