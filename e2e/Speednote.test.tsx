import { chromium, expect, type Page, test } from '@playwright/test';

const getAndAssertEditor = async (page: Page) => {
  const [title, content, undoClearButton] = [
    page.getByRole('textbox', { name: 'Note title' }),
    page.getByRole('textbox', { name: 'Note content' }),
    page.getByRole('button', { name: 'Undo clear' }),
  ];

  await expect(title).toBeVisible();
  await expect(content).toBeVisible();
  await expect(undoClearButton).not.toBeVisible();

  const inputs = page.getByRole('textbox');
  await expect(inputs).toHaveCount(2);

  return { title, content };
};

const getAndAssertConfiguration = async (page: Page) => {
  const [colorModeSwitchButton] = [
    page.getByRole('button', { name: 'Color mode switch' }),
  ];

  await expect(colorModeSwitchButton).toBeVisible();
  await expect(colorModeSwitchButton).toBeEnabled();

  return { colorModeSwitchButton };
};

const renderPage = async (page: Page, route?: string) => {
  const loadedRoute = route ? route : '/';

  await page.goto(loadedRoute);
  await expect(page).toHaveURL(loadedRoute);
};

test('renders properly', async ({ page }) => {
  await renderPage(page);

  // Assert all components to make sure that they are correct.
  await getAndAssertEditor(page);
  await getAndAssertConfiguration(page);

  // Sanity checks for markups, check footer and header.
  await expect(page.getByText('About')).toBeVisible();
  await expect(
    page.getByText(
      'Thank you so much for using Speednote! Made with ♥ in Tokyo, Japan'
    )
  ).toBeVisible();

  // Should also render a link to GitHub.
  const linkToSource = page.getByRole('link', { name: 'About' });
  await expect(linkToSource).toBeVisible();
  await expect(linkToSource).toHaveAttribute(
    'href',
    'https://github.com/lauslim12/speednote'
  );
});

test('renders and falls back properly with bad data', async ({ page }) => {
  // Put all kinds of predefined local storage. We have to set the variable name
  // manually because we'll see `_schema is not defined` error on the console. In my opinion,
  // this makes sense because a normal user will not use `storageKey` variable to manipulate
  // the `localStorage`.
  await page.addInitScript(() => {
    localStorage.setItem(
      'speednote',
      JSON.stringify({
        notes: {
          title: 'Title',
          content: '123',
          lastUpdated: 'an invalid date',
          frozen: 'not boolean',
        },
      })
    );
  });

  // Render the app, make sure it does not crash.
  await renderPage(page);

  // Make sure all values are rendered properly.
  const { title, content } = await getAndAssertEditor(page);
  await expect(title).toHaveValue('Title');
  await expect(content).toHaveValue('123');

  // Make sure the time is rendered properly.
  await expect(page.getByRole('time')).not.toBeVisible();

  // Edit the content, timer should be synced again.
  await content.fill('Adding this value.');
  await expect(content).toHaveValue('Adding this value.');
  await expect(page.getByRole('time')).toBeVisible();
});

test('able to edit title and content', async ({ page }) => {
  await renderPage(page);
  const { title, content } = await getAndAssertEditor(page);

  // Type at both inputs, make sure that both have changes.
  await title.fill('Expenses as of 25 May 2023');
  await expect(title).not.toHaveValue('');
  await expect(title).toHaveValue('Expenses as of 25 May 2023');

  await content.fill('Today I spent 1000 JPY for lunch at a fish shop');
  await expect(content).not.toHaveValue('');
  await expect(content).toHaveValue(
    'Today I spent 1000 JPY for lunch at a fish shop'
  );

  // There should be a date that shows the last updated date as well.
  await expect(page.getByText(/Last updated at/i)).toBeVisible();
});

test('able to clear content and undo clear', async ({ page }) => {
  await renderPage(page);

  const { content } = await getAndAssertEditor(page);
  await content.fill("Tears Don't Fall, Enchanted, Beautiful Trauma");
  await expect(content).not.toHaveValue('');
  await expect(content).toHaveValue(
    "Tears Don't Fall, Enchanted, Beautiful Trauma"
  );

  const clearContentButton = page.getByRole('button', {
    name: 'Clear content',
  });
  await expect(clearContentButton).toBeVisible();
  await expect(clearContentButton).toBeEnabled();
  await clearContentButton.click();
  await expect(content).toHaveValue('');

  // Query the `undoClearButton` again here.
  const undoClearButton = page.getByRole('button', { name: 'Undo clear' });
  await expect(undoClearButton).toBeVisible();
  await expect(undoClearButton).toBeEnabled();
  await undoClearButton.click();
  await expect(content).toHaveValue(
    "Tears Don't Fall, Enchanted, Beautiful Trauma"
  );
});

test('able to switch color mode', async ({ page }) => {
  await renderPage(page);

  const { colorModeSwitchButton } = await getAndAssertConfiguration(page);
  await expect(colorModeSwitchButton).toHaveText('Darken');
  await colorModeSwitchButton.click();

  await expect(colorModeSwitchButton).toHaveText('Lighten');
  await colorModeSwitchButton.click();

  await expect(colorModeSwitchButton).toHaveText('Darken');
});

test('able to freeze notes and unfreeze them', async ({ page }) => {
  await renderPage(page);

  // Freeze the notes.
  const { title, content } = await getAndAssertEditor(page);
  const freezeNoteButton = page.getByRole('button', { name: 'Freeze note' });
  await expect(freezeNoteButton).toBeEnabled();
  await freezeNoteButton.click();

  // Should have `readOnly` attribute.
  await expect(freezeNoteButton).toHaveText('Unfreeze note');
  await expect(title).not.toBeEditable();
  await expect(content).not.toBeEditable();

  // Try to type, but it also shouldn't be possible. That's why we try to use `force`.
  await title.fill('Hello', { force: true });
  await expect(title).toHaveValue('');
  await content.fill('Hi there!', { force: true });
  await expect(content).toHaveValue('');

  // The `Clear content` button should be disabled.
  const clearContentButton = page.getByRole('button', {
    name: 'Clear content',
  });
  await expect(clearContentButton).toBeVisible();
  await expect(clearContentButton).toBeDisabled();

  // Unfreeze the note.
  await expect(freezeNoteButton).toBeEnabled();
  await freezeNoteButton.click();
  await expect(freezeNoteButton).toHaveText('Freeze note');

  // `Clear content` should not be disabled.
  await expect(clearContentButton).toBeEnabled();

  // Try to type, should be possible.
  await expect(title).toBeEditable();
  await expect(content).toBeEditable();
  await title.fill('Hello');
  await expect(title).toHaveValue('Hello');
  await content.fill('Hi there, I just wanted to type this note.');
  await expect(content).toHaveValue(
    'Hi there, I just wanted to type this note.'
  );
});

test('able to copy and see a shared note properly', async () => {
  // We need to use a new browser context to allow permission to write to clipboard in the headless Playwright test.
  const browser = await chromium.launch();
  const context = await browser.newContext({
    permissions: ['clipboard-write', 'clipboard-read'],
  });
  const page = await context.newPage();

  // Render the app with our new browser context.
  await renderPage(page);

  // Write something on the inputs.
  const { title, content } = await getAndAssertEditor(page);
  const freezeNoteButton = page.getByRole('button', { name: 'Freeze note' });
  await expect(freezeNoteButton).toBeVisible();
  await title.fill('Income');
  await expect(title).toHaveValue('Income');
  await content.fill('I finished a project and received 5000 JPY.');
  await expect(content).toHaveValue(
    'I finished a project and received 5000 JPY.'
  );

  // Click on the `Share note` button.
  const shareNoteButton = page.getByRole('button', { name: 'Share note' });
  await shareNoteButton.click();

  // Slightly testing implementation details, make sure that the shared URL is correct. We don't
  // care about the leading parts, we just want to make sure that the URL query params are correct.
  const expectedEncodedTitle = encodeURIComponent('SW5jb21l');
  const expectedEncodedContent = encodeURIComponent(
    'SSBmaW5pc2hlZCBhIHByb2plY3QgYW5kIHJlY2VpdmVkIDUwMDAgSlBZLg=='
  );
  const clipboardText = await page.evaluate('navigator.clipboard.readText()');
  const expectedUrl = `?title=${expectedEncodedTitle}&content=${expectedEncodedContent}`;
  expect(clipboardText).toContain(expectedUrl);

  // Summon a new page based on the copied URL query parameters.
  const newPage = await context.newPage();
  await renderPage(newPage, clipboardText as string);

  const { title: newTitle, content: newContent } = await getAndAssertEditor(
    newPage
  );
  await expect(newTitle).toHaveValue('Income');
  await expect(newContent).toHaveValue(
    'I finished a project and received 5000 JPY.'
  );

  // Freeze note button should not be here, and all of the inputs should be read only.
  const newFreezeNoteButton = newPage.getByRole('button', {
    name: 'Freeze note',
  });
  await expect(newFreezeNoteButton).not.toBeVisible();
  await expect(newTitle).not.toBeEditable();
  await expect(newContent).not.toBeEditable();

  // We should not be able to re-share the note to another person. The button should be hidden
  // as it is very confusing (which one to share? Our note or the shared note? Communicating the message
  // is difficult, so it's better to make it explicit and just do not make the button visible on a shared note).
  await expect(
    newPage.getByRole('button', { name: 'Share note' })
  ).not.toBeVisible();

  // Edge-case: update the different page, the local storage should be synced - after the user decided to return
  // to the normal note, the user should see the normal note.
  await title.clear();
  await title.fill('Expense');
  await expect(title).toHaveValue('Expense');
  await content.clear();
  await content.fill('Hi there!');
  await expect(content).toHaveValue('Hi there!');
  await freezeNoteButton.click();
  await expect(title).not.toBeEditable();
  await expect(content).not.toBeEditable();

  // Return to the normal, ensure that components and the freeze button are here.
  const returnButton = newPage.getByRole('link', {
    name: 'Return to your note',
  });
  await expect(returnButton).toBeVisible();
  await returnButton.click();

  // Should re-render again, validate again that all have rendered successfully.
  await newPage.waitForURL('/');
  await expect(newPage).toHaveURL('/');

  // Edge-case: make sure that once we get back to the normal page, the local storage is synced properly and the
  // change is using the latest one after we have updated the inputs after opening the link from the clipboard.
  const rerenderedTitle = newPage.getByRole('textbox', { name: 'Note title' });
  const rerenderedContent = newPage.getByRole('textbox', {
    name: 'Note content',
  });
  const secondUpdatedFrozenButton = newPage.getByRole('button', {
    name: 'Freeze note',
  });

  await expect(rerenderedTitle).toHaveValue('Expense');
  await expect(rerenderedContent).toHaveValue('Hi there!');
  await expect(secondUpdatedFrozenButton).toBeVisible();

  // Verify that the `Share note` button is visible again after returning to the `/` page.
  await expect(
    newPage.getByRole('button', { name: 'Share note' })
  ).toBeVisible();

  // Close all sessions.
  await context.close();
  await browser.close();
});

// Playwright doesn't support Jest's `test.each`, so we have to use this looping workaround.
const invalidFormatUrlTestCases = [
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
    name: 'invalid title and content',
    url: '?title=xxx&content=yyy',
    expectedTitle:
      'Invalid title format from the shared URL, so we cannot read it.',
    expectedContent:
      'Invalid content format from the shared URL, so we cannot read it for now. Please ask the other party to re-share the URL!',
  },
  {
    name: 'title only',
    url: '?title=xxx&content=QmVhdXRpZnVsIFRyYXVtYQ==',
    expectedTitle:
      'Invalid title format from the shared URL, so we cannot read it.',
    expectedContent: 'Beautiful Trauma',
  },
  {
    name: 'content only',
    url: '?title=RW5jaGFudGVk&content=123',
    expectedTitle: 'Enchanted',
    expectedContent:
      'Invalid content format from the shared URL, so we cannot read it for now. Please ask the other party to re-share the URL!',
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
    const freezeNoteButton = page.getByRole('button', { name: 'Freeze note' });
    await expect(freezeNoteButton).not.toBeVisible();
  });
}

test('able to handle unused query parameters', async ({ page }) => {
  // Render the app with our new browser context.
  await renderPage(page, '?has-unused-param=test&unused-try=2');

  // Write something on the inputs.
  const { title, content } = await getAndAssertEditor(page);
  await expect(title).toBeEditable();
  await expect(content).toBeEditable();
});
