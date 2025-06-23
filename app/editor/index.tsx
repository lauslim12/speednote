import { NoteEditor } from './note-editor';
import { NoteStorageLoader } from './note-storage-loader';
import { SharedNoteLoader } from './shared-note-loader';

/**
 * Composed note editor. Ready to be used by external APIs of the application.
 *
 * @public
 */
export const Editor = () => (
	<SharedNoteLoader>
		<NoteStorageLoader>
			<NoteEditor />
		</NoteStorageLoader>
	</SharedNoteLoader>
);
