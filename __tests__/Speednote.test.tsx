import {
  render,
  screen,
  waitForElementToBeRemoved,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Home from '@/app/page';

test('renders properly', async () => {
  render(<Home />);

  // Wait for the editor to load or else it'll cause an `act` warning due
  // to the dynamic import not loading the editor yet.
  expect(
    screen.getByText('Setting up the your note editor in a flash...')
  ).toBeInTheDocument();
  await waitForElementToBeRemoved(screen.queryByRole('progressbar'));

  // Assert all inputs exist.
  expect(
    screen.getByRole('textbox', { name: 'Note title' })
  ).toBeInTheDocument();
  expect(
    screen.getByRole('textbox', { name: 'Note content' })
  ).toBeInTheDocument();

  // Sanity checks for markups.
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
  const user = userEvent.setup();
  render(<Home />);

  // Presumption of why we don't have the await for progressbar here: We don't need to wait
  // for the editor to load as it has already been loaded and cached (dynamic import occurs before we
  // render the `Home` component).
  const inputs = screen.getAllByRole('textbox');
  expect(inputs).toHaveLength(2); // Title and content.

  const title = screen.getByRole('textbox', { name: 'Note title' });
  expect(title).toBeInTheDocument();

  const content = screen.getByRole('textbox', { name: 'Note content' });
  expect(content).toBeInTheDocument();

  // Type at both inputs, make sure that both have changes.
  await user.type(title, 'Expenses as of 25 May 2023');
  expect(title).not.toHaveValue('');
  expect(title).toHaveValue('Expenses as of 25 May 2023');

  await user.type(content, 'Today I spent 1000 JPY for lunch at a fish shop');
  expect(content).not.toHaveValue('');
  expect(content).toHaveValue(
    'Today I spent 1000 JPY for lunch at a fish shop'
  );

  // Should print the autosave.
  expect(screen.getByText('Autosaving...')).toBeInTheDocument();

  // There should be a date that shows the last updated date as well.
  expect(await screen.findByText(/Last updated at/i)).toBeInTheDocument();
});
