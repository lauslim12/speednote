import { chromium, expect, type Page, test } from "@playwright/test";

const getAndAssertEditor = async (page: Page) => {
	const [title, content, undoClearButton] = [
		page.getByRole("textbox", { name: "Note title" }),
		page.getByRole("textbox", { name: "Note content" }),
		page.getByRole("button", { name: "Undo clear" }),
	];

	await expect(title).toBeVisible();
	await expect(content).toBeVisible();
	await expect(undoClearButton).not.toBeVisible();

	const inputs = page.getByRole("textbox");
	await expect(inputs).toHaveCount(2);

	return { content, title };
};

const getAndAssertConfiguration = async (page: Page) => {
	const [colorModeSwitchButton] = [
		page.getByRole("button", { name: "Color mode switch" }),
	];

	await expect(colorModeSwitchButton).toBeVisible();
	await expect(colorModeSwitchButton).toBeEnabled();

	return { colorModeSwitchButton };
};

const renderPage = async (page: Page, route?: string) => {
	const loadedRoute = route ? route : "/";

	await page.goto(loadedRoute);
	await expect(page).toHaveURL(loadedRoute);
};

// The type declaration is necessary since this is going to be
// required for the implementation detail assertion.
declare global {
	interface Window {
		getDataFromIndexedDB: () => Promise<string>;
	}
}

// In Playwright, `beforeEach` is recommended for per-test isolation.
// To test Indexed DB, we have to inject additional functions into the
// `window` object because when we try to do `page.evaluate`, it can only access
// things from inside of the browser context. Also, in Playwright, we are not
// able to use `async` functions inside of `page.addInitScript` due to its
// serialization quirks.
test.beforeEach(async ({ page }) => {
	await page.addInitScript(() => {
		/**
		 * Retrieves the note with the given key from IndexedDB.
		 */
		window.getDataFromIndexedDB = () => {
			const dbName = "speednote";
			const storeName = "notes";

			return new Promise((resolve, reject) => {
				const open = indexedDB.open(dbName);

				open.onerror = reject;

				open.onsuccess = () => {
					const db = open.result;
					const tx = db.transaction(storeName, "readonly");
					const store = tx.objectStore(storeName);

					const getRequest = store.get(0);
					getRequest.onsuccess = () => {
						resolve(JSON.stringify(getRequest.result));
					};

					getRequest.onerror = reject;

					tx.oncomplete = () => db.close();
				};
			});
		};
	});
});

test("renders properly", async ({ page }) => {
	await renderPage(page);

	// Assert all components to make sure that they are correct.
	await getAndAssertEditor(page);
	await getAndAssertConfiguration(page);

	// Sanity checks for markups, check footer and header.
	await expect(page.getByText("About")).toBeVisible();
	await expect(
		page.getByText(
			"Thank you so much for using Speednote! Made with ♥ in Tokyo, Japan",
		),
	).toBeVisible();

	// Should also render a link to GitHub.
	const linkToSource = page.getByRole("link", { name: "About" });
	await expect(linkToSource).toBeVisible();
	await expect(linkToSource).toHaveAttribute(
		"href",
		"https://github.com/lauslim12/speednote",
	);
});

test("renders and falls back properly with bad data", async ({ page }) => {
	await page.addInitScript(() => {
		const dbName = "speednote";
		const storeName = "notes";
		const open = indexedDB.open(dbName);

		open.onupgradeneeded = () => {
			const db = open.result;
			// Only creates the store if it doesn't already exist.
			if (!db.objectStoreNames.contains(storeName)) {
				db.createObjectStore(storeName, { keyPath: "id" });
			}
		};

		open.onsuccess = () => {
			const db = open.result;
			const tx = db.transaction([storeName], "readwrite");
			const store = tx.objectStore(storeName);

			store.put({
				content: "123",
				id: 0,
				isFrozen: "not boolean",
				lastUpdated: "an invalid date",
				title: "Title",
			});

			tx.oncomplete = () => {
				db.close();
			};

			tx.onerror = () => {
				db.close();
			};
		};
	});

	// Render the app, make sure it does not crash.
	await renderPage(page);

	// Make sure all values are rendered properly.
	const { title, content } = await getAndAssertEditor(page);
	await expect(title).toHaveValue("Title");
	await expect(content).toHaveValue("123");

	// Make sure the time is rendered properly.
	await expect(page.getByRole("time")).not.toBeVisible();

	// Edit the content, timer should be synced again.
	await content.fill("Adding this value.");
	await expect(content).toHaveValue("Adding this value.");
	await expect(page.getByRole("note")).toBeVisible();
});

test("able to edit title and content", async ({ page }) => {
	await renderPage(page);
	const { title, content } = await getAndAssertEditor(page);

	// Type at both inputs, make sure that both have changes.
	await title.fill("Expenses as of 25 May 2023");
	await expect(title).not.toHaveValue("");
	await expect(title).toHaveValue("Expenses as of 25 May 2023");

	await content.fill("Today I spent 1000 JPY for lunch at a fish shop");
	await expect(content).not.toHaveValue("");
	await expect(content).toHaveValue(
		"Today I spent 1000 JPY for lunch at a fish shop",
	);

	// There should be a date that shows the last updated date as well.
	await expect(page.getByText(/Last updated at/i)).toBeVisible();
});

test("able to clear content and undo clear", async ({ page }) => {
	await renderPage(page);

	const { content } = await getAndAssertEditor(page);
	await content.fill("Tears Don't Fall, Enchanted, Beautiful Trauma");
	await expect(content).not.toHaveValue("");
	await expect(content).toHaveValue(
		"Tears Don't Fall, Enchanted, Beautiful Trauma",
	);

	const clearContentButton = page.getByRole("button", {
		name: "Clear content",
	});
	await expect(clearContentButton).toBeVisible();
	await expect(clearContentButton).toBeEnabled();
	await clearContentButton.click();
	await expect(content).toHaveValue("");

	// Verify that the data is already stored in the DB. This is
	// an implementation detail, but it's better to be safe: https://github.com/lauslim12/speednote/issues/31.
	const clearedValue = await page.evaluate(
		async () => await window.getDataFromIndexedDB(),
	);
	expect(clearedValue).toContain('"content":""');

	// Query the `undoClearButton` again here.
	const undoClearButton = page.getByRole("button", { name: "Undo clear" });
	await expect(undoClearButton).toBeVisible();
	await expect(undoClearButton).toBeEnabled();
	await undoClearButton.click();
	await expect(content).toHaveValue(
		"Tears Don't Fall, Enchanted, Beautiful Trauma",
	);

	// Verify the data is already stored in the Indexed DB.
	const restoredValue = await page.evaluate(
		async () => await window.getDataFromIndexedDB(),
	);
	expect(restoredValue).toContain(
		`"content":"Tears Don't Fall, Enchanted, Beautiful Trauma"`,
	);
});

test("able to switch color mode", async ({ page }) => {
	await renderPage(page);

	const { colorModeSwitchButton } = await getAndAssertConfiguration(page);
	await expect(colorModeSwitchButton).toHaveText("Darken");
	await colorModeSwitchButton.click();

	await expect(colorModeSwitchButton).toHaveText("Lighten");
	await colorModeSwitchButton.click();

	await expect(colorModeSwitchButton).toHaveText("Darken");
});

test("able to freeze notes and unfreeze them", async ({ page }) => {
	await renderPage(page);

	// Freeze the notes.
	const { title, content } = await getAndAssertEditor(page);
	const freezeNoteButton = page.getByRole("button", { name: "Freeze note" });
	await expect(freezeNoteButton).toBeEnabled();
	await freezeNoteButton.click();

	// Should have `readOnly` attribute.
	await expect(freezeNoteButton).toHaveText("Unfreeze note");
	await expect(title).not.toBeEditable();
	await expect(content).not.toBeEditable();

	// Verify that the data is already stored in the Indexed DB. This is
	// an implementation detail, but it's better to be safe: https://github.com/lauslim12/speednote/issues/31.
	const frozenValue = await page.evaluate(
		async () => await window.getDataFromIndexedDB(),
	);
	expect(frozenValue).toContain('"isFrozen":true');

	// Try to type, but it also shouldn't be possible. That's why we try to use `force`.
	await title.fill("Hello", { force: true });
	await expect(title).toHaveValue("");
	await content.fill("Hi there!", { force: true });
	await expect(content).toHaveValue("");

	// The `Clear content` button should be disabled.
	const clearContentButton = page.getByRole("button", {
		name: "Clear content",
	});
	await expect(clearContentButton).toBeVisible();
	await expect(clearContentButton).toBeDisabled();

	// Unfreeze the note.
	await expect(freezeNoteButton).toBeEnabled();
	await freezeNoteButton.click();
	await expect(freezeNoteButton).toHaveText("Freeze note");

	// Verify that the data is already stored in the Indexed DB.
	const unfrozenValue = await page.evaluate(
		async () => await window.getDataFromIndexedDB(),
	);
	expect(unfrozenValue).toContain('"isFrozen":false');

	// `Clear content` should not be disabled.
	await expect(clearContentButton).toBeEnabled();

	// Try to type, should be possible.
	await expect(title).toBeEditable();
	await expect(content).toBeEditable();
	await title.fill("Hello");
	await expect(title).toHaveValue("Hello");
	await content.fill("Hi there, I just wanted to type this note.");
	await expect(content).toHaveValue(
		"Hi there, I just wanted to type this note.",
	);
});

const copyAndSeeSharedNoteTestCases = [
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
];

for (const {
	constraint,
	inputTitle,
	inputContent,
	expectedEncodedTitle,
	expectedEncodedContent,
} of copyAndSeeSharedNoteTestCases) {
	test(`able to copy and see a shared note properly ${constraint}`, async () => {
		// We need to use a new browser context to allow permission to write to clipboard in the headless Playwright test.
		const browser = await chromium.launch();
		const context = await browser.newContext({
			permissions: ["clipboard-write", "clipboard-read"],
		});
		const page = await context.newPage();

		// Render the app with our new browser context.
		await renderPage(page);

		// Write something on the inputs.
		const { title, content } = await getAndAssertEditor(page);
		const freezeNoteButton = page.getByRole("button", { name: "Freeze note" });
		await expect(freezeNoteButton).toBeVisible();
		await title.fill(inputTitle);
		await expect(title).toHaveValue(inputTitle);
		await content.fill(inputContent);
		await expect(content).toHaveValue(inputContent);

		// Click on the `Share note` button.
		const shareNoteButton = page.getByRole("button", { name: "Share note" });
		await shareNoteButton.click();

		// Slightly testing implementation details, make sure that the shared URL is correct. We don't
		// care about the leading parts, we just want to make sure that the URL query params are correct.
		const clipboardText = await page.evaluate("navigator.clipboard.readText()");
		const expectedUrl = `?title=${expectedEncodedTitle}&content=${expectedEncodedContent}`;
		expect(clipboardText).toContain(expectedUrl);

		// Summon a new page based on the copied URL query parameters.
		const newPage = await context.newPage();
		await renderPage(newPage, clipboardText as string);

		const { title: newTitle, content: newContent } =
			await getAndAssertEditor(newPage);
		await expect(newTitle).toHaveValue(inputTitle);
		await expect(newContent).toHaveValue(inputContent);

		// Freeze note button should not be here, and all of the inputs should be read only.
		const newFreezeNoteButton = newPage.getByRole("button", {
			name: "Freeze note",
		});
		await expect(newFreezeNoteButton).not.toBeVisible();
		await expect(newTitle).not.toBeEditable();
		await expect(newContent).not.toBeEditable();

		// We should not be able to re-share the note to another person. The button should be hidden
		// as it is very confusing (which one to share? Our note or the shared note? Communicating the message
		// is difficult, so it's better to make it explicit and just do not make the button visible on a shared note).
		await expect(
			newPage.getByRole("button", { name: "Share note" }),
		).not.toBeVisible();

		// Edge-case: update the different page, the local storage should be synced - after the user decided to return
		// to the normal note, the user should see the normal note.
		await title.clear();
		await title.fill("Expense");
		await expect(title).toHaveValue("Expense");
		await content.clear();
		await content.fill("Hi there!");
		await expect(content).toHaveValue("Hi there!");
		await freezeNoteButton.click();
		await expect(title).not.toBeEditable();
		await expect(content).not.toBeEditable();

		// Return to the normal, ensure that components and the freeze button are here.
		const returnButton = newPage.getByRole("link", {
			name: "Return to your note",
		});
		await expect(returnButton).toBeVisible();
		await returnButton.click();

		// Should re-render again, validate again that all have rendered successfully.
		await newPage.waitForURL("/");
		await expect(newPage).toHaveURL("/");

		// Edge-case: make sure that once we get back to the normal page, the local storage is synced properly and the
		// change is using the latest one after we have updated the inputs after opening the link from the clipboard.
		const rerenderedTitle = newPage.getByRole("textbox", {
			name: "Note title",
		});
		const rerenderedContent = newPage.getByRole("textbox", {
			name: "Note content",
		});
		const secondUpdatedFrozenButton = newPage.getByRole("button", {
			name: "Freeze note",
		});

		await expect(rerenderedTitle).toHaveValue("Expense");
		await expect(rerenderedContent).toHaveValue("Hi there!");
		await expect(secondUpdatedFrozenButton).toBeVisible();

		// Verify that the `Share note` button is visible again after returning to the `/` page.
		await expect(
			newPage.getByRole("button", { name: "Share note" }),
		).toBeVisible();

		// Close all sessions.
		await context.close();
		await browser.close();
	});
}

// Playwright doesn't support Jest's `test.each`, so we have to use this looping workaround.
const invalidFormatUrlTestCases = [
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
		name: "title only",
		url: "?title=xxx&content=QmVhdXRpZnVsIFRyYXVtYQ==",
	},
	{
		expectedContent:
			"Invalid content format from the shared URL, so we cannot read it for now. Please ask the other party to re-share the URL!",
		expectedTitle: "Enchanted",
		name: "content only",
		url: "?title=RW5jaGFudGVk&content=123",
	},
];

for (const { name, ...testCase } of invalidFormatUrlTestCases) {
	test(`able to handle various format of shared note url (${name})`, async ({
		page,
	}) => {
		// Render the app with our new browser context.
		await renderPage(page, testCase.url);

		// Write something on the inputs.
		const { title, content } = await getAndAssertEditor(page);
		await expect(title).not.toBeEditable();
		await expect(title).toHaveValue(testCase.expectedTitle);
		await expect(content).not.toBeEditable();
		await expect(content).toHaveValue(testCase.expectedContent);

		// Freeze note button should not be here.
		const freezeNoteButton = page.getByRole("button", { name: "Freeze note" });
		await expect(freezeNoteButton).not.toBeVisible();
	});
}

test("able to handle unused query parameters", async ({ page }) => {
	// Render the app with our new browser context.
	await renderPage(page, "?has-unused-param=test&unused-try=2");

	// Write something on the inputs.
	const { title, content } = await getAndAssertEditor(page);
	await expect(title).toBeEditable();
	await expect(content).toBeEditable();
});

// // 404 pages are only testable in integration environments as it's a server-side page.
// test('able to view and recover from 404 not found', async ({ page }) => {
// 	await renderPage(page, '/404');

// 	await expect(
// 		page.getByRole('heading', { name: 'Page not found' }),
// 	).toBeVisible();
// 	await expect(
// 		page.getByRole('heading', {
// 			name: 'Could not find the requested resource',
// 		}),
// 	).toBeVisible();

// 	const backToEditorLink = page.getByRole('link', { name: 'Back to editor' });
// 	await expect(backToEditorLink).toBeVisible();
// 	await backToEditorLink.click();

// 	// Should be redirected back to the editor.
// 	await page.waitForURL('/');
// 	await expect(page).toHaveURL('/');

// 	// Check the editor.
// 	const { title, content } = await getAndAssertEditor(page);
// 	await expect(title).toBeEditable();
// 	await expect(content).toBeEditable();
// });
