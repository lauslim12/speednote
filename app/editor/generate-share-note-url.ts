/**
 * Generates a shareable URL format with Base64 encoded title and content.
 */
export const generateShareNoteUrl = (title: string, content: string) => {
	// Set new query parameters. Encode as URI component to prevent
	// failure when sharing Kanji characters or any other characters
	// that exist outside of the Latin1 range.
	// Reference: https://github.com/lauslim12/speednote/issues/36.
	const newSearchParams = new URLSearchParams();
	if (title !== "") {
		newSearchParams.set("title", window.btoa(encodeURIComponent(title)));
	}

	if (content !== "") {
		newSearchParams.set("content", window.btoa(encodeURIComponent(content)));
	}

	const url = `${window.location.href}?${newSearchParams.toString()}`;
	return url;
};
