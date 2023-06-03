import {
  cleanup,
  render,
  screen,
  waitForElementToBeRemoved,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Home from '@/app/page';
import { storageKey } from '@/app/schema';

// Have to mock `matchMedia` because it's not supported in Jest yet.
// Reference: https://jestjs.io/docs/manual-mocks#mocking-methods-which-are-not-implemented-in-jsdom.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

/**
 * This `beforeEach` hook is necessary to prevent unexpected values on tests. `localStorage`
 * can persist through tests!
 */
beforeEach(() => window.localStorage.clear());

/**
 * This hook is necessary because we used a dynamic import for the `Editor` in `Home` component. We have
 * to firstly initialize the dynamic import before doing anything else to make sure we have
 * a clean and deterministic testing environment. For the subsequent tests, we don't have to
 * wait for the dynamic import because it's already cached and it can be used immediately in
 * subsequent tests.
 */
beforeAll(async () => {
  // Initializes the dynamic import before doing anything else. This is required!
  renderWithProviders();

  // Wait for the editor to load or else it'll cause an `act` warning due
  // to the dynamic import not loading the editor yet.
  expect(
    screen.getByText('Setting up the your note editor in a flash...')
  ).toBeInTheDocument();
  await waitForElementToBeRemoved(screen.queryByRole('progressbar'));

  // Teardown the component because we want to setup a deterministic, clean environment.
  cleanup();
});

const assertEditor = () => {
  const [
    title,
    content,
    clearContentButton,
    freezeNoteButton,
    undoClearButton,
  ] = [
    screen.getByRole('textbox', { name: 'Note title' }),
    screen.getByRole('textbox', { name: 'Note content' }),
    screen.getByRole('button', { name: 'Clear content' }),
    screen.getByRole('button', { name: 'Freeze note' }),
    screen.queryByRole('button', { name: 'Undo clear' }), // This is not supposed to be there on the first render.
  ];

  expect(title).toBeInTheDocument();
  expect(content).toBeInTheDocument();
  expect(clearContentButton).toBeInTheDocument();
  expect(freezeNoteButton).toBeInTheDocument();
  expect(undoClearButton).not.toBeInTheDocument(); // This is not supposed to be in the DOM on the first render.

  // We only want the title and the content and nothing else in the DOM.
  const inputs = screen.getAllByRole('textbox');
  expect(inputs).toHaveLength(2);

  // `undoClearButton` is not returned because we'd rather do the query again when we want to test it. The current state
  // of the `undoClearButton` here will be stale by the time we wanted to do tests against it.
  return { title, content, freezeNoteButton, clearContentButton };
};

const assertConfiguration = () => {
  const [colorModeSwitchButton] = [
    screen.getByRole('button', { name: 'Color mode switch' }),
  ];

  expect(colorModeSwitchButton).toBeInTheDocument();
  expect(colorModeSwitchButton).toBeEnabled();

  return { colorModeSwitchButton };
};

const renderWithProviders = () => {
  const user = userEvent.setup();

  return {
    user,
    ...render(<Home />),
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
      'Thank you so much for using Speednote! Made with ♥ in Tokyo, Japan'
    )
  ).toBeInTheDocument();

  // Should also render a link to GitHub.
  const linkToSource = screen.getByRole('link', { name: 'About' });
  expect(linkToSource).toBeInTheDocument();
  expect(linkToSource).toHaveAccessibleName('About');
  expect(linkToSource).toHaveAttribute(
    'href',
    'https://github.com/lauslim12/speednote'
  );
});

test('renders and falls back properly with bad data', async () => {
  // Put all kinds of predefined local storage.
  localStorage.setItem(storageKey.CONFIG_FROZEN_KEY, 'not boolean');
  localStorage.setItem(storageKey.LAST_UPDATED_STORAGE_KEY, 'an invalid date');
  localStorage.setItem(storageKey.CONTENT_STORAGE_KEY, '123');
  localStorage.setItem(storageKey.TITLE_STORAGE_KEY, 'Title');

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
    'Today I spent 1000 JPY for lunch at a fish shop'
  );

  // There should be a date that shows the last updated date as well.
  expect(screen.getByText(/Last updated at/i)).toBeInTheDocument();
});

test('able to clear content and undo clear', async () => {
  const { user } = renderWithProviders();

  const { content, clearContentButton } = assertEditor();
  await user.type(content, "Tears Don't Fall, Enchanted, Beautiful Trauma");
  expect(content).not.toHaveValue('');
  expect(content).toHaveValue("Tears Don't Fall, Enchanted, Beautiful Trauma");

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
  const { freezeNoteButton, title, content } = assertEditor();
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

  // Unfreeze the note.
  expect(freezeNoteButton).toBeEnabled();
  await user.click(freezeNoteButton);
  expect(freezeNoteButton).toHaveAccessibleName('Freeze note');

  // Try to type, should be possible.
  expect(title).not.toHaveAttribute('readOnly');
  expect(content).not.toHaveAttribute('readOnly');
  await user.type(title, 'Hello');
  expect(title).toHaveValue('Hello');
  await user.type(content, 'Hi there, I just wanted to type this note.');
  expect(content).toHaveValue('Hi there, I just wanted to type this note.');
});
