import "fake-indexeddb/auto";
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { App } from "~/app";
import { generateShareNoteUrl } from "~/editor/generate-share-note-url";

/**
 * Mock `window.matchMedia` because JSDOM does not implement it.
 * {@link https://rebeccamdeprey.com/blog/mock-windowmatchmedia-in-vitest}
 */
vi.hoisted(() => {
	Object.defineProperty(window, "matchMedia", {
		value: vi.fn().mockImplementation((query) => ({
			addEventListener: vi.fn(),
			matches: false,
			media: query,
			removeEventListener: vi.fn(),
		})),
		writable: true,
	});
});

/**
 * Operate on IndexedDB in testing environment. Ensures that the database is
 * available first before doing anything else.
 */
const operateIndexedDB = async (callback?: (idb: IDBObjectStore) => void) => {
	const databaseName = "speednote";
	const storeName = "notes";

	await new Promise<void>((resolve, reject) => {
		const open = indexedDB.open(databaseName);

		open.onupgradeneeded = () => {
			const db = open.result;

			// Only create the store if it doesn't exist.
			if (!db.objectStoreNames.contains(storeName)) {
				db.createObjectStore(storeName, { keyPath: "id" });
			}
		};

		open.onsuccess = () => {
			const db = open.result;
			const tx = db.transaction(storeName, "readwrite");
			const store = tx.objectStore(storeName);

			callback?.(store);

			tx.oncomplete = () => {
				db.close();
				resolve();
			};

			tx.onerror = (e) => {
				db.close();
				reject(e);
			};
		};
	});
};

/**
 * This `beforeEach` hook is necessary to prevent unexpected values on tests. Indexed DB
 * can persist through tests, so we need to clear it down every test!
 */
beforeEach(async () => {
	await operateIndexedDB((idb) => idb.clear());
});

const assertEditor = async () => {
	const [title, content, undoClearButton] = [
		await screen.findByRole("textbox", { name: "Note title" }),
		await screen.findByRole("textbox", { name: "Note content" }),
		screen.queryByRole("button", { name: "Undo clear" }), // This is not supposed to be there on the first render.
	];

	expect(title).toBeInTheDocument();
	expect(content).toBeInTheDocument();
	expect(undoClearButton).not.toBeInTheDocument(); // This is not supposed to be in the DOM on the first render.

	// We only want the title and the content and nothing else in the DOM.
	const inputs = screen.getAllByRole("textbox");
	expect(inputs).toHaveLength(2);

	// `undoClearButton` is not returned because we'd rather do the query again when we want to test it. The current state
	// of the `undoClearButton` here will be stale by the time we wanted to do tests against it.
	//
	// For `shareNoteButton`, it will not be returned as well because it's not visible from the shared note component.
	return { content, title };
};

const assertHeader = () => {
	const [colorModeSwitchButton] = [
		screen.getByRole("button", { name: "Color mode switch" }),
	];

	expect(colorModeSwitchButton).toBeInTheDocument();
	expect(colorModeSwitchButton).toBeEnabled();

	return { colorModeSwitchButton };
};

const renderWithProviders = (route?: string) => {
	const user = userEvent.setup();

	// Push to history if required.
	if (route) {
		window.history.pushState({}, "", route);
	}

	return { user, ...render(<App />) };
};

test("renders properly", async () => {
	renderWithProviders();

	await assertEditor();
	assertHeader();

	// Sanity checks for markups, check footer and header.
	expect(screen.getByText(/About/i)).toBeInTheDocument();
	expect(
		screen.getByText(
			"Thank you so much for using Speednote! Made with ♥ in Tokyo, Japan",
		),
	).toBeInTheDocument();

	// Should also render a link to GitHub.
	const linkToSource = screen.getByRole("link", { name: /About/ });
	expect(linkToSource).toBeInTheDocument();
	expect(linkToSource).toHaveAccessibleName(/About/);
	expect(linkToSource).toHaveAttribute(
		"href",
		"https://github.com/lauslim12/speednote",
	);
});

test("renders and falls back properly with bad data", async () => {
	// Put all kinds of predefined data in Indexed DB.
	await operateIndexedDB((idb) => {
		idb.put({
			content: "123",
			id: 0,
			isFrozen: "not boolean",
			lastUpdated: "an invalid date",
			title: "Title",
		});
	});

	// Render the app, make sure it does not crash.
	renderWithProviders();

	// Make sure all values are rendered properly.
	const { title, content } = await assertEditor();
	expect(title).toHaveValue("Title");
	expect(content).toHaveValue("123");

	// Edit the content, timer should be synced again.
	await userEvent.type(content, "Adding this value.");
	expect(screen.getByRole("note")).toBeInTheDocument();
});

test("able to edit title and content", async () => {
	const { user } = renderWithProviders();
	const { title, content } = await assertEditor();

	// Type at both inputs, make sure that both have changes.
	await user.type(title, "Expenses as of 25 May 2023");
	expect(title).not.toHaveValue("");
	expect(title).toHaveValue("Expenses as of 25 May 2023");

	await user.type(content, "Today I spent 1000 JPY for lunch at a fish shop");
	expect(content).not.toHaveValue("");
	expect(content).toHaveValue(
		"Today I spent 1000 JPY for lunch at a fish shop",
	);

	// There should be a date that shows the last updated date as well.
	expect(screen.getByText(/Last updated at/i)).toBeInTheDocument();
});

test("able to clear content and undo clear", async () => {
	const { user } = renderWithProviders();

	const { content } = await assertEditor();
	await user.type(content, "Tears Don't Fall, Enchanted, Beautiful Trauma");
	expect(content).not.toHaveValue("");
	expect(content).toHaveValue("Tears Don't Fall, Enchanted, Beautiful Trauma");

	const clearContentButton = screen.getByRole("button", {
		name: "Clear content",
	});
	expect(clearContentButton).toBeEnabled();
	await user.click(clearContentButton);
	expect(content).toHaveValue("");

	// Query the `undoClearButton` again here.
	const undoClearButton = screen.getByRole("button", { name: "Undo clear" });
	expect(undoClearButton).toBeInTheDocument();
	expect(undoClearButton).toBeEnabled();
	await user.click(undoClearButton);
	expect(content).toHaveValue("Tears Don't Fall, Enchanted, Beautiful Trauma");
});

test("able to switch color mode", async () => {
	const { user } = renderWithProviders();

	const { colorModeSwitchButton } = assertHeader();
	expect(colorModeSwitchButton).toHaveTextContent("Darken");
	await user.click(colorModeSwitchButton);

	expect(colorModeSwitchButton).toHaveTextContent("Lighten");
	await user.click(colorModeSwitchButton);

	expect(colorModeSwitchButton).toHaveTextContent("Darken");
});

test("able to freeze notes and unfreeze them", async () => {
	const { user } = renderWithProviders();

	// Freeze the notes.
	const { title, content } = await assertEditor();
	const freezeNoteButton = screen.getByRole("button", { name: "Freeze note" });
	expect(freezeNoteButton).toBeInTheDocument();
	expect(freezeNoteButton).toBeEnabled();
	await user.click(freezeNoteButton);

	// Should have `readOnly` attribute.
	expect(freezeNoteButton).toHaveAccessibleName("Unfreeze note");
	expect(title).toHaveAttribute("readOnly");
	expect(content).toHaveAttribute("readOnly");

	// Try to type, but it also shouldn't be possible.
	await user.type(title, "Hello");
	expect(title).toHaveValue("");
	await user.type(content, "Hi there!");
	expect(content).toHaveValue("");

	// The `Clear content` button should be disabled.
	const clearContentButton = screen.getByRole("button", {
		name: "Clear content",
	});
	expect(clearContentButton).toBeInTheDocument();
	expect(clearContentButton).toBeDisabled();

	// Unfreeze the note.
	expect(freezeNoteButton).toBeEnabled();
	await user.click(freezeNoteButton);
	expect(freezeNoteButton).toHaveAccessibleName("Freeze note");

	// `Clear content` should not be disabled.
	expect(clearContentButton).toBeEnabled();

	// Try to type, should be possible.
	expect(title).not.toHaveAttribute("readOnly");
	expect(content).not.toHaveAttribute("readOnly");
	await user.type(title, "Hello");
	expect(title).toHaveValue("Hello");
	await user.type(content, "Hi there, I just wanted to type this note.");
	expect(content).toHaveValue("Hi there, I just wanted to type this note.");
});

test.each([
	{
		constraint: "with normal characters",
		expectedEncodedContent:
			"SSUyMGZpbmlzaGVkJTIwYSUyMHByb2plY3QlMjBhbmQlMjByZWNlaXZlZCUyMDUwMDAlMjBKUFku",
		expectedEncodedTitle: "SW5jb21l",
		inputContent: "I finished a project and received 5000 JPY.",
		inputTitle: "Income",
	},
	{
		constraint: "with japanese characters",
		expectedEncodedContent:
			"JUUzJTgxJTkzJUUzJTgxJUFFJUUzJTgzJThFJUUzJTgzJUJDJUUzJTgzJTg4JUUzJTgxJUFGJUU4JUE2JThCJUU2JTlDJUFDJUUzJTgxJUE3JUUzJTgxJTk5JUUzJTgwJTgy",
		expectedEncodedTitle:
			"JUUzJTgzJThFJUUzJTgzJUJDJUUzJTgzJTg4JUUzJTgxJUE3JUUzJTgxJTk5JUVGJUJDJTgx",
		inputContent: "このノートは見本です。",
		inputTitle: "ノートです！",
	},
	{
		constraint: "with chinese characters",
		expectedEncodedContent:
			"JUU4JUJGJTk5JUU2JTk4JUFGJUU0JUI4JTgwJUU1JUJDJUEwJUU3JUJBJUI4JUU2JTlEJUExJUU2JUEwJUI3JUU2JTlDJUFDJUUzJTgwJTgy",
		expectedEncodedTitle: "JUU0JUJEJUEwJUU1JUE1JUJEJUVGJUJDJTgx",
		inputContent: "这是一张纸条样本。",
		inputTitle: "你好！",
	},
	{
		constraint: "with special url characters",
		expectedEncodedContent:
			"dXNlciU0MGVtYWlsLmNvbSUyMCUyRiUyMElzJTIwdGhpcyUyMGNvcnJlY3QlM0YlMjAlMjYlMjBtb3Jl",
		expectedEncodedTitle: "USUyMCUyNiUyMEE%3D",
		inputContent: "user@email.com / Is this correct? & more",
		inputTitle: "Q & A",
	},
	{
		constraint: "with emojis",
		expectedEncodedContent:
			"V29yayUyMGhhcmQhJTIwJUYwJTlGJTkyJUFBJUYwJTlGJTk0JUE1",
		expectedEncodedTitle: "R29hbHMlMjAlRjAlOUYlOUElODA%3D",
		inputContent: "Work hard! 💪🔥",
		inputTitle: "Goals 🚀",
	},
	{
		constraint: "with code characters",
		expectedEncodedContent: "Y29uc29sZS5sb2coJ0hlbGxvJyklM0I%3D",
		expectedEncodedTitle: "JTNDc2NyaXB0JTNF",
		inputContent: "console.log('Hello');",
		inputTitle: "<script>",
	},
	{
		constraint: "with korean characters (Hangul)",
		expectedEncodedContent:
			"JUVDJTk1JTg4JUVCJTg1JTk1JUVEJTk1JTk4JUVDJTg0JUI4JUVDJTlBJTk0",
		expectedEncodedTitle: "S29yZWE%3D", // "Korea"
		inputContent: "안녕하세요",
		inputTitle: "Korea",
	},
	{
		constraint: "with arabic characters (Right-to-Left)",
		expectedEncodedContent: "JUQ5JTg1JUQ4JUIxJUQ4JUFEJUQ4JUE4JUQ4JUE3",
		expectedEncodedTitle: "QXJhYmlj",
		inputContent: "مرحبا",
		inputTitle: "Arabic",
	},
	{
		constraint: "with european accents (Diacritics)",
		expectedEncodedContent: "Q2FmJUMzJUE5JTIwJTI2JTIwTmElQzMlQUZ2ZQ%3D%3D",
		expectedEncodedTitle: "Q3IlQzMlQThtZSUyMEJyJUMzJUJCbCVDMyVBOWU%3D",
		inputContent: "Café & Naïve",
		inputTitle: "Crème Brûlée",
	},
	{
		constraint: "with emojis and ZWJ sequences",
		expectedEncodedContent:
			"JUYwJTlGJTlBJTgwJUUyJTlDJUE4JUYwJTlGJTkxJUE4JUUyJTgwJThEJUYwJTlGJTkxJUE5JUUyJTgwJThEJUYwJTlGJTkxJUE3JUUyJTgwJThEJUYwJTlGJTkxJUE2",
		expectedEncodedTitle: "RW1vamk%3D",
		inputContent: "🚀✨👨‍👩‍👧‍👦",
		inputTitle: "Emoji",
	},
	{
		constraint: "with URL reserved characters",
		// Input: "user?name=test&id=123" (Testing if &, ?, = break the query string)
		expectedEncodedContent: "dXNlciUzRm5hbWUlM0R0ZXN0JTI2aWQlM0QxMjM%3D",
		expectedEncodedTitle: "VVJM", // "URL"
		inputContent: "user?name=test&id=123",
		inputTitle: "URL",
	},
	{
		constraint: "with HTML injection attempt",
		expectedEncodedContent:
			"JTNDc2NyaXB0JTNFYWxlcnQoMSklM0MlMkZzY3JpcHQlM0U%3D",
		expectedEncodedTitle: "WFNT",
		inputContent: "<script>alert(1)</script>",
		inputTitle: "XSS",
	},
	{
		constraint: "with special symbols and quotes",
		expectedEncodedContent: "JTIyJTVDJTJGJTQwJTIzJTI0JTI1JTVFKg%3D%3D",
		expectedEncodedTitle: "U3ltYm9scw%3D%3D", // "Symbols"
		inputContent: '"\\/@#$%^*', // input: "\/@#$%^*
		inputTitle: "Symbols",
	},
	{
		constraint: "with very long strings (stress test)",
		// A string of 100 'a's.
		// Logic: 100 'a's -> btoa('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
		expectedEncodedContent:
			"YWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYQ%3D%3D",
		expectedEncodedTitle: "TG9uZw%3D%3D", // Long
		inputContent: "a".repeat(100),
		inputTitle: "Long",
	},
])("able to get the share note in the proper format $constraint", async ({
	inputTitle,
	inputContent,
	expectedEncodedTitle,
	expectedEncodedContent,
}) => {
	const url = generateShareNoteUrl(inputTitle, inputContent);

	expect(url).toStrictEqual(
		`${window.location.href}?title=${expectedEncodedTitle}&content=${expectedEncodedContent}`,
	);
});

// Note: I'd like to be able to test the navigation back to the `/` path, but
// JSDOM doesn't support it, so it's ok. At the end, it's tested by Playwright as well,
// so it's no problem.
test("able to see shared URL properly", async () => {
	const startQuery =
		"?title=SW5jb21l&content=SSBmaW5pc2hlZCBhIHByb2plY3QgYW5kIHJlY2VpdmVkIDUwMDAgSlBZLg%3D%3D";
	renderWithProviders(startQuery);

	const { title, content } = await assertEditor();
	expect(title).toHaveAttribute("readOnly");
	expect(content).toHaveAttribute("readOnly");
	expect(title).toHaveValue("Income");
	expect(content).toHaveValue("I finished a project and received 5000 JPY.");

	// Freeze note button should not be here.
	const freezeNoteButton = screen.queryByRole("button", {
		name: "Freeze note",
	});
	expect(freezeNoteButton).not.toBeInTheDocument();

	// Click to return to our normal note.
	const returnButton = screen.getByRole("link", {
		name: "Return to your note",
	});
	expect(returnButton).toBeInTheDocument();
	expect(returnButton).toBeEnabled();
});

test.each([
	{
		expectedContent: "No content in the shared note",
		expectedTitle: "Enchanted",
		name: "valid title, but no content",
		url: "?title=RW5jaGFudGVk",
	},
	{
		expectedContent: "Beautiful Trauma",
		expectedTitle: "No title in the shared note",
		name: "valid content, but no title",
		url: "?content=QmVhdXRpZnVsIFRyYXVtYQ==",
	},
	{
		expectedContent: "このノートは見本です。",
		expectedTitle: "ノートです！",
		name: "valid title and content, japanese characters",
		url: "?title=JUUzJTgzJThFJUUzJTgzJUJDJUUzJTgzJTg4JUUzJTgxJUE3JUUzJTgxJTk5JUVGJUJDJTgx&content=JUUzJTgxJTkzJUUzJTgxJUFFJUUzJTgzJThFJUUzJTgzJUJDJUUzJTgzJTg4JUUzJTgxJUFGJUU4JUE2JThCJUU2JTlDJUFDJUUzJTgxJUE3JUUzJTgxJTk5JUUzJTgwJTgy",
	},
	{
		expectedContent: "这是一张纸条样本。",
		expectedTitle: "你好！",
		name: "valid title and content, chinese characters",
		url: "?title=JUU0JUJEJUEwJUU1JUE1JUJEJUVGJUJDJTgx&content=JUU4JUJGJTk5JUU2JTk4JUFGJUU0JUI4JTgwJUU1JUJDJUEwJUU3JUJBJUI4JUU2JTlEJUExJUU2JUEwJUI3JUU2JTlDJUFDJUUzJTgwJTgy",
	},
	{
		expectedContent:
			"Invalid content format from the shared URL, so we cannot read it for now. Please ask the other party to re-share the URL!",
		expectedTitle:
			"Invalid title format from the shared URL, so we cannot read it.",
		name: "invalid title and content",
		url: "?title=xxx&content=yyy",
	},
	{
		expectedContent: "Beautiful Trauma",
		expectedTitle:
			"Invalid title format from the shared URL, so we cannot read it.",
		name: "invalid title only",
		url: "?title=xxx&content=QmVhdXRpZnVsIFRyYXVtYQ==",
	},
	{
		expectedContent:
			"Invalid content format from the shared URL, so we cannot read it for now. Please ask the other party to re-share the URL!",
		expectedTitle: "Enchanted",
		name: "invalid content only",
		url: "?title=RW5jaGFudGVk&content=123",
	},
])("able to handle various formats of shared note url ($name)", async ({
	url,
	expectedTitle,
	expectedContent,
}) => {
	renderWithProviders(url);

	const { content, title } = await assertEditor();
	expect(title).toHaveValue(expectedTitle);
	expect(content).toHaveValue(expectedContent);
	expect(title).toHaveAttribute("readOnly");
	expect(content).toHaveAttribute("readOnly");
});
