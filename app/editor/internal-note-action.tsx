import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/button";
import {
	NoteStore,
	resetContent,
	setContent,
	setFrozen,
	useNoteStore,
} from "~/editor/store";

type InternalNoteActionProps = {
	onSave: () => void;
};

/**
 * Internal note action, component that enables users to do initiatives
 * related to internal, in-app actions.
 *
 * @package
 */
export const InternalNoteAction = ({ onSave }: InternalNoteActionProps) => {
	const isFrozen = useNoteStore((state) => state.isFrozen);
	const [lastChanges, setLastChanges] = useState("");

	const handleClear = () => {
		setLastChanges(NoteStore.state.content);
		resetContent(Date.now());
		onSave();
		toast.info("Note cleared!");
	};

	const handleFreezeNote = (nextValue: boolean) => () => {
		setFrozen(nextValue);
		onSave();

		if (nextValue) {
			toast.success("Note frozen!");
		} else {
			toast.success("Note unfrozen!");
		}
	};

	const handleUndo = () => {
		setContent(lastChanges, Date.now());
		setLastChanges("");
		onSave();
		toast.success("Restored last state.");
	};

	return (
		<section className="flex gap-4">
			<Button disabled={isFrozen} onClick={handleClear}>
				Clear content
			</Button>

			<Button onClick={handleFreezeNote(!isFrozen)}>
				{isFrozen ? "Unfreeze note" : "Freeze note"}
			</Button>

			{lastChanges && <Button onClick={handleUndo}>Undo clear</Button>}
		</section>
	);
};
