import * as v from 'valibot';

/**
 * Base64 regular expression to parse.
 */
const BASE64_REGEX =
	/^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;

/**
 * Shared title schema.
 */
const sharedTitleSchema = v.pipe(
	v.fallback(v.string(), ''),
	v.transform((val) => {
		if (!val) {
			return 'No title in the shared note';
		}

		if (!BASE64_REGEX.test(val)) {
			return 'Invalid title format from the shared URL, so we cannot read it.';
		}

		return window.atob(val);
	}),
);

/**
 * Shared content schema.
 */
const sharedContentSchema = v.pipe(
	v.fallback(v.string(), ''),
	v.transform((val) => {
		if (!val) {
			return 'No content in the shared note';
		}

		if (!BASE64_REGEX.test(val)) {
			return 'Invalid content format from the shared URL, so we cannot read it for now. Please ask the other party to re-share the URL!';
		}

		return window.atob(val);
	}),
);

/**
 * Hook to process and return the query parameters from the URL. Special query
 * parameters are treated as special characters to identify a special shared note.
 *
 * @package
 */
export const useSharedNote = () => {
	const searchParams = new URLSearchParams(window.location.search);
	const sharedTitle = searchParams.get('title');
	const sharedContent = searchParams.get('content');

	const sharedNote = {
		isShared: [sharedTitle, sharedContent].some((val) => val !== null),
		title: v.parse(sharedTitleSchema, sharedTitle),
		content: v.parse(sharedContentSchema, sharedContent),
	};

	return sharedNote;
};
