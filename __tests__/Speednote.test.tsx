import { MemoryRouter, Route, createMemoryHistory } from '@solidjs/router';
import { render, screen } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';

import App from '../src/App';
import NotFound from '../src/NotFound';
import { STORAGE_KEY } from '../src/database';
import { DEFAULT_DATA } from '../src/database';

// Mocking is essential in this case as two properties are not supported yet in JSDOM:
//
// - `window.matchMedia` (for the dark mode)
// - `window.scrollTo` (SolidJS uses `scrollTo` when navigating from shared note to the normal note)
//
// {@link https://jestjs.io/docs/manual-mocks#mocking-methods-which-are-not-implemented-in-jsdom}
Object.defineProperties(window, {
	matchMedia: {
		writable: true,
		value: vi.fn().mockImplementation(() => ({ matches: false })),
	},
	scrollTo: {
		value: vi.fn().mockImplementation(() => {}),
	},
});

/**
 * This `beforeEach` hook is necessary to prevent unexpected values on tests. `localStorage`
 * can persist through tests!
 */
beforeEach(() => {
	window.localStorage.clear();
	window.localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DATA));
});

const assertEditor = () => {
	const [title, content, undoClearButton] = [
		screen.getByRole('textbox', { name: 'Note title' }),
		screen.getByRole('textbox', { name: 'Note content' }),
		screen.queryByRole('button', { name: 'Undo clear' }), // This is not supposed to be there on the first render.
	];

	expect(title).toBeInTheDocument();
	expect(content).toBeInTheDocument();
	expect(undoClearButton).not.toBeInTheDocument(); // This is not supposed to be in the DOM on the first render.

	// We only want the title and the content and nothing else in the DOM.
	const inputs = screen.getAllByRole('textbox');
	expect(inputs).toHaveLength(2);

	// `undoClearButton` is not returned because we'd rather do the query again when we want to test it. The current state
	// of the `undoClearButton` here will be stale by the time we wanted to do tests against it.
	//
	// For `shareNoteButton`, it will not be returned as well because it's not visible from the shared note component.
	return { title, content };
};

const assertConfiguration = () => {
	const [colorModeSwitchButton] = [
		screen.getByRole('button', { name: 'Color mode switch' }),
	];

	expect(colorModeSwitchButton).toBeInTheDocument();
	expect(colorModeSwitchButton).toBeEnabled();

	return { colorModeSwitchButton };
};

const renderWithProviders = (route?: string) => {
	const user = userEvent.setup();

	// Memory history is required for testing purposes if we want to test a different route.
	const history = createMemoryHistory();
	history.set({ value: route || '/' });

	return {
		user,
		...render(() => (
			<MemoryRouter history={history}>
				<Route path="/" component={App} />
				<Route path="*" component={NotFound} />
			</MemoryRouter>
		)),
	};
};

test('renders properly', () => {
	renderWithProviders();

	// Presumption of why we don't have the await for progressbar here: We don't need to wait
	// for the editor to load as it has already been loaded and cached (dynamic import occurs before we
	// render the `Home` component). Just assert the components to make sure that everything's correct.
	assertEditor();
	assertConfiguration();

	// Sanity checks for markups, check footer and header.
	expect(screen.getByText('About')).toBeInTheDocument();
	expect(
		screen.getByText(
			'Thank you so much for using Speednote! Made with ♥ in Tokyo, Japan',
		),
	).toBeInTheDocument();

	// Should also render a link to GitHub.
	const linkToSource = screen.getByRole('link', { name: 'About' });
	expect(linkToSource).toBeInTheDocument();
	expect(linkToSource).toHaveAccessibleName('About');
	expect(linkToSource).toHaveAttribute(
		'href',
		'https://github.com/lauslim12/speednote',
	);
});

test('renders and falls back properly with bad data', async () => {
	// Put all kinds of predefined local storage.
	localStorage.setItem(
		STORAGE_KEY,
		JSON.stringify({
			notes: {
				title: 'Title',
				content: '123',
				lastUpdated: 'an invalid date',
				frozen: 'not boolean',
			},
		}),
	);

	// Render the app, make sure it does not crash.
	renderWithProviders();

	// Make sure all values are rendered properly.
	const { title, content } = assertEditor();
	expect(title).toHaveValue('Title');
	expect(content).toHaveValue('123');

	// Make sure the time is rendered properly.
	expect(screen.queryByRole('time')).not.toBeInTheDocument();

	// Edit the content, timer should be synced again.
	await userEvent.type(content, 'Adding this value.');
	expect(screen.getByRole('time')).toBeInTheDocument();
});

test('able to edit title and content', async () => {
	const { user } = renderWithProviders();
	const { title, content } = assertEditor();

	// Type at both inputs, make sure that both have changes.
	await user.type(title, 'Expenses as of 25 May 2023');
	expect(title).not.toHaveValue('');
	expect(title).toHaveValue('Expenses as of 25 May 2023');

	await user.type(content, 'Today I spent 1000 JPY for lunch at a fish shop');
	expect(content).not.toHaveValue('');
	expect(content).toHaveValue(
		'Today I spent 1000 JPY for lunch at a fish shop',
	);

	// There should be a date that shows the last updated date as well.
	expect(screen.getByText(/Last updated at/i)).toBeInTheDocument();
});

test('able to clear content and undo clear', async () => {
	const { user } = renderWithProviders();

	const { content } = assertEditor();
	await user.type(content, "Tears Don't Fall, Enchanted, Beautiful Trauma");
	expect(content).not.toHaveValue('');
	expect(content).toHaveValue("Tears Don't Fall, Enchanted, Beautiful Trauma");

	const clearContentButton = screen.getByRole('button', {
		name: 'Clear content',
	});
	expect(clearContentButton).toBeEnabled();
	await user.click(clearContentButton);
	expect(content).toHaveValue('');

	// Query the `undoClearButton` again here.
	const undoClearButton = screen.getByRole('button', { name: 'Undo clear' });
	expect(undoClearButton).toBeInTheDocument();
	expect(undoClearButton).toBeEnabled();
	await user.click(undoClearButton);
	expect(content).toHaveValue("Tears Don't Fall, Enchanted, Beautiful Trauma");
});

test('able to switch color mode', async () => {
	const { user } = renderWithProviders();

	const { colorModeSwitchButton } = assertConfiguration();
	expect(colorModeSwitchButton).toHaveTextContent('Darken');
	await user.click(colorModeSwitchButton);

	expect(colorModeSwitchButton).toHaveTextContent('Lighten');
	await user.click(colorModeSwitchButton);

	expect(colorModeSwitchButton).toHaveTextContent('Darken');
});

test('able to freeze notes and unfreeze them', async () => {
	const { user } = renderWithProviders();

	// Freeze the notes.
	const { title, content } = assertEditor();
	const freezeNoteButton = screen.getByRole('button', { name: 'Freeze note' });
	expect(freezeNoteButton).toBeInTheDocument();
	expect(freezeNoteButton).toBeEnabled();
	await user.click(freezeNoteButton);

	// Should have `readOnly` attribute.
	expect(freezeNoteButton).toHaveAccessibleName('Unfreeze note');
	expect(title).toHaveAttribute('readOnly');
	expect(content).toHaveAttribute('readOnly');

	// Try to type, but it also shouldn't be possible.
	await user.type(title, 'Hello');
	expect(title).toHaveValue('');
	await user.type(content, 'Hi there!');
	expect(content).toHaveValue('');

	// The `Clear content` button should be disabled.
	const clearContentButton = screen.getByRole('button', {
		name: 'Clear content',
	});
	expect(clearContentButton).toBeInTheDocument();
	expect(clearContentButton).toBeDisabled();

	// Unfreeze the note.
	expect(freezeNoteButton).toBeEnabled();
	await user.click(freezeNoteButton);
	expect(freezeNoteButton).toHaveAccessibleName('Freeze note');

	// `Clear content` should not be disabled.
	expect(clearContentButton).toBeEnabled();

	// Try to type, should be possible.
	expect(title).not.toHaveAttribute('readOnly');
	expect(content).not.toHaveAttribute('readOnly');
	await user.type(title, 'Hello');
	expect(title).toHaveValue('Hello');
	await user.type(content, 'Hi there, I just wanted to type this note.');
	expect(content).toHaveValue('Hi there, I just wanted to type this note.');
});

test.each([
	{
		constraint: 'with normal characters',
		inputTitle: 'Income',
		inputContent: 'I finished a project and received 5000 JPY.',
		expectedEncodedTitle: 'SW5jb21l',
		expectedEncodedContent:
			'SSUyMGZpbmlzaGVkJTIwYSUyMHByb2plY3QlMjBhbmQlMjByZWNlaXZlZCUyMDUwMDAlMjBKUFku',
	},
	{
		constraint: 'with japanese characters',
		inputTitle: 'ノートです！',
		inputContent: 'このノートは見本です。',
		expectedEncodedTitle:
			'JUUzJTgzJThFJUUzJTgzJUJDJUUzJTgzJTg4JUUzJTgxJUE3JUUzJTgxJTk5JUVGJUJDJTgx',
		expectedEncodedContent:
			'JUUzJTgxJTkzJUUzJTgxJUFFJUUzJTgzJThFJUUzJTgzJUJDJUUzJTgzJTg4JUUzJTgxJUFGJUU4JUE2JThCJUU2JTlDJUFDJUUzJTgxJUE3JUUzJTgxJTk5JUUzJTgwJTgy',
	},
	{
		constraint: 'with chinese characters',
		inputTitle: '你好！',
		inputContent: '这是一张纸条样本。',
		expectedEncodedTitle: 'JUU0JUJEJUEwJUU1JUE1JUJEJUVGJUJDJTgx',
		expectedEncodedContent:
			'JUU4JUJGJTk5JUU2JTk4JUFGJUU0JUI4JTgwJUU1JUJDJUEwJUU3JUJBJUI4JUU2JTlEJUExJUU2JUEwJUI3JUU2JTlDJUFDJUUzJTgwJTgy',
	},
])(
	'able to copy shared note properly $constraint',
	async ({
		inputTitle,
		inputContent,
		expectedEncodedTitle,
		expectedEncodedContent,
	}) => {
		// Because it's important to ensure that the title and the content is encoded properly,
		// I decided to spy on this function to make sure that it doesn't do anything unexpected.
		const mockWriteText = vi
			.spyOn(window.navigator.clipboard, 'writeText')
			.mockImplementation(async () => {});

		// Render the app with our new browser context.
		const { user } = renderWithProviders();

		// Write something on the inputs.
		const { title, content } = assertEditor();
		await user.type(title, inputTitle);
		expect(title).toHaveValue(inputTitle);
		await user.type(content, inputContent);
		expect(content).toHaveValue(inputContent);

		// Click on the `Share note` button.
		const shareNoteButton = screen.getByRole('button', {
			name: 'Copy/share note link',
		});
		await user.click(shareNoteButton);

		const expectedUrl = `${window.location.href}?title=${expectedEncodedTitle}&content=${expectedEncodedContent}`;
		expect(mockWriteText).toHaveBeenCalledTimes(1);
		expect(mockWriteText).toHaveBeenCalledWith(expectedUrl);
	},
);

test('able to see shared URL properly', async () => {
	const startUrl = `${window.location.href}?title=SW5jb21l&content=SSBmaW5pc2hlZCBhIHByb2plY3QgYW5kIHJlY2VpdmVkIDUwMDAgSlBZLg%3D%3D`;
	const { user } = renderWithProviders(startUrl);

	const { title, content } = assertEditor();
	expect(title).toHaveAttribute('readOnly');
	expect(content).toHaveAttribute('readOnly');
	expect(title).toHaveValue('Income');
	expect(content).toHaveValue('I finished a project and received 5000 JPY.');

	// Freeze note button should not be here.
	const freezeNoteButton = screen.queryByRole('button', {
		name: 'Freeze note',
	});
	expect(freezeNoteButton).not.toBeInTheDocument();

	// Click to return to our normal note.
	const returnButton = screen.getByRole('link', {
		name: 'Return to your note',
	});
	expect(returnButton).toBeInTheDocument();
	expect(returnButton).toBeEnabled();
	await user.click(returnButton);

	// Should expect that the title and content have disappeared because we returned back to
	// the page without the URL query parameters. As this is a redirect, re-fetch the editor and see the results.
	const { title: notSharedTitle, content: notSharedContent } = assertEditor();
	expect(notSharedTitle).toHaveValue('');
	expect(notSharedContent).toHaveValue('');

	const updatedFreezeNoteButton = screen.getByRole('button', {
		name: 'Freeze note',
	});
	expect(updatedFreezeNoteButton).toBeInTheDocument();
});

test.each([
	{
		name: 'valid title, but no content',
		url: '?title=RW5jaGFudGVk',
		expectedTitle: 'Enchanted',
		expectedContent: 'No content in the shared note',
	},
	{
		name: 'valid content, but no title',
		url: '?content=QmVhdXRpZnVsIFRyYXVtYQ==',
		expectedTitle: 'No title in the shared note',
		expectedContent: 'Beautiful Trauma',
	},
	{
		name: 'valid title and content, japanese characters',
		url: '?title=JUUzJTgzJThFJUUzJTgzJUJDJUUzJTgzJTg4JUUzJTgxJUE3JUUzJTgxJTk5JUVGJUJDJTgx&content=JUUzJTgxJTkzJUUzJTgxJUFFJUUzJTgzJThFJUUzJTgzJUJDJUUzJTgzJTg4JUUzJTgxJUFGJUU4JUE2JThCJUU2JTlDJUFDJUUzJTgxJUE3JUUzJTgxJTk5JUUzJTgwJTgy',
		expectedTitle: 'ノートです！',
		expectedContent: 'このノートは見本です。',
	},
	{
		name: 'valid title and content, chinese characters',
		url: '?title=JUU0JUJEJUEwJUU1JUE1JUJEJUVGJUJDJTgx&content=JUU4JUJGJTk5JUU2JTk4JUFGJUU0JUI4JTgwJUU1JUJDJUEwJUU3JUJBJUI4JUU2JTlEJUExJUU2JUEwJUI3JUU2JTlDJUFDJUUzJTgwJTgy',
		expectedTitle: '你好！',
		expectedContent: '这是一张纸条样本。',
	},
	{
		name: 'invalid title and content',
		url: '?title=xxx&content=yyy',
		expectedTitle:
			'Invalid title format from the shared URL, so we cannot read it.',
		expectedContent:
			'Invalid content format from the shared URL, so we cannot read it for now. Please ask the other party to re-share the URL!',
	},
	{
		name: 'invalid title only',
		url: '?title=xxx&content=QmVhdXRpZnVsIFRyYXVtYQ==',
		expectedTitle:
			'Invalid title format from the shared URL, so we cannot read it.',
		expectedContent: 'Beautiful Trauma',
	},
	{
		name: 'invalid content only',
		url: '?title=RW5jaGFudGVk&content=123',
		expectedTitle: 'Enchanted',
		expectedContent:
			'Invalid content format from the shared URL, so we cannot read it for now. Please ask the other party to re-share the URL!',
	},
])(
	'able to handle various formats of shared note url ($name)',
	async ({ url, expectedTitle, expectedContent }) => {
		renderWithProviders(url);

		const { content, title } = assertEditor();
		expect(title).toHaveValue(expectedTitle);
		expect(content).toHaveValue(expectedContent);
		expect(title).toHaveAttribute('readOnly');
		expect(content).toHaveAttribute('readOnly');
	},
);
