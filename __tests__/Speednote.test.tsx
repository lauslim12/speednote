import {
  render,
  screen,
  waitForElementToBeRemoved,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Home from '@/app/page';

beforeEach(() => {
  // Prevent unexpected values on tests. `localStorage` can persist through tests!
  window.localStorage.clear();
});

const assertEditor = () => {
  const [title, content, clearContentButton, undoClearButton] = [
    screen.getByRole('textbox', { name: 'Note title' }),
    screen.getByRole('textbox', { name: 'Note content' }),
    screen.getByRole('button', { name: 'Clear content' }),
    screen.queryByRole('button', { name: 'Undo clear' }), // This is not supposed to be there on the first render.
  ];

  expect(title).toBeInTheDocument();
  expect(content).toBeInTheDocument();
  expect(clearContentButton).toBeInTheDocument();
  expect(undoClearButton).not.toBeInTheDocument(); // This is not supposed to be in the DOM on the first render.

  // We only want the title and the content and nothing else in the DOM.
  const inputs = screen.getAllByRole('textbox');
  expect(inputs).toHaveLength(2);

  // `undoClearButton` is not returned because we'd rather do the query again when we want to test it. The current state
  // of the `undoClearButton` here will be stale by the time we wanted to do tests against it.
  return { title, content, clearContentButton };
};

const renderWithProviders = () => {
  const user = userEvent.setup();

  return {
    user,
    ...render(<Home />),
  };
};

test('renders properly', async () => {
  renderWithProviders();

  // Wait for the editor to load or else it'll cause an `act` warning due
  // to the dynamic import not loading the editor yet.
  expect(
    screen.getByText('Setting up the your note editor in a flash...')
  ).toBeInTheDocument();
  await waitForElementToBeRemoved(screen.queryByRole('progressbar'));

  // Assert the editor.
  assertEditor();

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

test('able to edit title and content', async () => {
  const { user } = renderWithProviders();

  // Presumption of why we don't have the await for progressbar here: We don't need to wait
  // for the editor to load as it has already been loaded and cached (dynamic import occurs before we
  // render the `Home` component).
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
