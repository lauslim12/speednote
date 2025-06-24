import { NoteEditor } from "~/editor/note-editor";
import { NoteStorageLoader } from "~/editor/note-storage-loader";
import { SharedNoteLoader } from "~/editor/shared-note-loader";

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
