import { useId, useState } from "react";
import { toast } from "sonner";
import { Button } from "~/button";
import { NoteStore } from "~/editor/store";
import { Input } from "~/input.tsx";
import { generateShareNoteUrl } from "./generate-share-note-url.ts";

type ExternalNoteActionProps = {
	onSave: () => Promise<void>;
};

/**
 * External note actions. There is an accessibility quirk here:
 *
 * - `aria-live`: announces the shared URL to screen readers when it appears
 * or updates, without interrupting the user's current action.
 * - `aria-atomic`: ensures the entire container (Label + Input) is announced
 * together, so the user hears "Copied URL: [link]" rather than just the changed text.
 *
 * @package
 */
export const ExternalNoteAction = ({ onSave }: ExternalNoteActionProps) => {
	const inputId = useId();
	const labelId = useId();
	const [generatedUrl, setGeneratedUrl] = useState("");

	const handleShareNote = async () => {
		// Save the note initially, so that we're sure that the changes are committed.
		await onSave();

		// Get the title and content, and use it to generate the URL.
		const { title, content } = NoteStore.state;
		const url = generateShareNoteUrl(title, content);

		// Update the generated text.
		setGeneratedUrl(url);

		// Copy the URL the user's clipboard. I know that the `writeText` is supposed
		// to be asynchronous, but for some reason, if I `await` it, it doesn't work
		// in one phone, but works in other devices. Because it's really strange, I decided
		// to just not put `await` in front of the function call.
		void navigator.clipboard.writeText(url);
		toast.success("Shared note URL has been copied to clipboard.");
	};

	return (
		<section className="flex flex-col gap-4">
			<Button className="w-fit" onClick={handleShareNote}>
				Copy/share note link
			</Button>

			<div aria-atomic="true" aria-live="polite">
				{generatedUrl && (
					<div className="flex w-full flex-col">
						<label
							className="text-gray-500 text-xs transition-colors duration-300 dark:text-gray-600"
							htmlFor={inputId}
							id={labelId}
						>
							Copied URL:
						</label>

						<Input
							aria-labelledby={labelId}
							className="text-[0.5rem]"
							id={inputId}
							onClick={({ currentTarget }) => currentTarget.select()}
							readOnly
							type="generic"
							value={generatedUrl}
						/>
					</div>
				)}
			</div>
		</section>
	);
};
