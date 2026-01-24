# Speednote

Optimized Progressive Web Application (PWA) to input your thoughts as soon as possible.

## Background

I am a person who enjoys taking notes of the amount of money I spent on something every single day. In Japan, it is easy to keep track of everything because of its relative clearness with regards to prices and its no tipping culture. I usually type my expense right after spending my money to make sure that I do not forget (on the spot). Problem starts to happen when I use my usual note-taking app. After a long time of using it, I realized that it is unreasonably slow and I have to navigate through different menus before being able to type my expenses. My usual note-taking app is good for my usual note-taking activities, but not for this very specific activity. It is not just about expenses, sometimes I wrote something so I did not forget it later, and I usually don't want to create another note just for that specific purpose.

Honestly, the slowness and the overload of features is starting to get the better of me, so I decided to make another application to fulfill my personal use-case.

## Architecture and Concept

The concept of this application is just a single note with a title that you could use according to your use-case. You will type whatever you need / have been thinking about in that single note, and you **should move it to other note applications when you have the chance to do so**. This application should only be used for writing a general idea of something on the spot so that you do not forget it. At the moment, there are two terminologies when using Speednote: `title` is the title of the note, and `content` is the content of the note.

The data store that is used by this application is [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API), a robust, structured, and asynchronous database with [objectively fast performance](https://stackoverflow.com/a/22580545). The saving is done by implementing autosaves with debounce to make sure that it does not overload the browser. However, despite its speed, it should be kept in mind that this application **is not supposed to and should not be used for long-term note saving**. It is also recommended to not exceed the browser's IndexedDB size (making notes that are too long). You could check the maximum size of Indexed DB via the [following website](https://rxdb.info/articles/indexeddb-max-storage-limit.html).

## Features

- Blazingly fast. When you open the app, you can instantly type after the editor is mounted.
- Configurable theme, it will respect the system's theme initially, but you can always change it.
- Frozen notes. If you are afraid of accidentally deleting your note, just click on `Freeze note` to freeze your notes from changes. You cannot clear your notes if it's frozen, the button will be disabled.
- Shareable notes. You can share your note to other people by clicking `Copy/share note link` button. It will automatically copy your note-specific link to your clipboard. The format of the shared note is `https://<SPEEDNOTE_URL>/?title=<BASE64_ENCODED_TEXT>&content=<BASE64_ENCODED_TEXT>`. You can just share the `title` or the `content`, and anything else will be ignored if there are unknown query parameters.
- Complete with autosave function with reasonable debounce, so you don't have to worry about performance hits, lag, and data loss (stored in Indexed DB).
- The storage that is used, IndexedDB, is known to be a robust client-side storage that can store significant amounts of data without blocking the main thread.
- Versioned with the build date on the footer to know if the user is in the latest version of the application or not.
- Lightweight. I intentionally did not use any heavy UI-frameworks and decided to just use a normal CSS, augmented with TailwindCSS to make it featherweight.
- Minimalist. Designed with comfort and minimalism in mind, to ensure that note-taking would be a pleasant experience.
- Utilizes performance optimizations: re-rendering optimization (only on relevant components), and TanStack's Store for maximum performance.
- Responsive to make sure that this application could be used in various environments without losing UX.
- Works offline without any internet connection because this is a Progressive Web Application.
- Tested with React Testing Library to make sure everything works properly according to the expectations.
- Tested with Playwright (full end-to-end tests) as a way to assure that this application works in the browser properly and according to the expectations.

## Comparison

**To be kept in mind, the comparison is definitely not apple-to-apple as Speednote is only designed to fulfill a specific use-case, not a general use-case**. Table below will compare Speednote with several other note-taking applications:

|    Product     | Application Size | Require Authentication |                  Platform                  |                   Maximum Note Size                    |                                                                   Concept / Standout Feature                                                                    |
| :------------: | :--------------: | :--------------------: | :----------------------------------------: | :----------------------------------------------------: | :-------------------------------------------------------------------------------------------------------------------------------------------------------------: |
|   Speednote    |     ~300 KB      |           No           |             Web, Mobile (PWA)              |           Depends on your IndexedDB capacity           |  Single-note, text-only, completely independent of account systems, and designed to be a temporary note storage before the content is moved to other platforms  |
|  Google Keep   |      16 MB       |          Yes           | Web, Mobile (Standalone and PWA available) |     15 GB (free version, uses your Google account)     |     Multiple notes, supports placing images and audio, checkboxes for to-do lists, labels, drawing, also possible to add collaborator and reminders as well     |
|     Notion     |      38 MB       |          Yes           |          Web, Mobile (Standalone)          |                       Unlimited                        |    Feature-rich, unique building blocks (lists, callouts, dividers, etc.), bookmarks, public pages, hierarchical organization, amazing tables, and many more    |
|    Evernote    |      120 MB      |          Yes           |          Web, Mobile (Standalone)          |                   25 MB for one note                   | Feature-rich, connectivity with various SaaS products, tasks management, customized search, templates, annotations, version history, web clipper, and many more |
|    OneNote     |      80 MB       |          Yes           |          Web, Mobile (Standalone)          | Free up to 5GB for notes (uses your Microsoft account) |                                     Very free, you can add text anywhere, supports placing images and rich-text formatting                                      |
| Standard Notes |      45 MB       |           No           | Web, Mobile (Standalone and PWA available) |                       Unlimited                        |    Encrpyted, supports rich-text editing (includes Markdown), customizable themes, unique search, smart views, doubles as Authenticator + blogging platform     |

Note that the comparison was made on **August 26, 2024**.

## Tech Stack

- [React 19](https://react.dev/)
- [TailwindCSS](https://tailwindcss.com/)
- [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [GitHub Actions](https://github.com/features/actions) as the CI/CD part of the application
- [Vercel](https://vercel.com/) as the deployment platform

## Requirements

You only need these software packages to run this application:

- [Node.js](https://nodejs.org/en) according to the [`.node-version`](./.node-version)
- [PNPM](https://pnpm.io/) according to the version in [`package.json`](./package.json)

## Development

To start development quickly, please follow the steps below:

```bash
git clone git@github.com:lauslim12/speednote.git
cd speednote
pnpm i
pnpm dev
```

To create a production build, you need to follow the steps below:

```bash
pnpm build
pnpm preview
```

There are no dependencies (environment variables or the like), this is a standalone project.

## Tests

Because this project is still small, we can achieve a relatively high enough code coverage. There are two test libraries used in this project: React Testing Library and Playwright.

```bash
# To run RTL tests, do the commands below:
pnpm test
pnpm test-ci

# To run Playwright tests, do the commands below:
pnpm e2e
pnpm e2e-ci
pnpm e2e-prod
```

## Contributions

Have a question? Discovered a problem? Wanted to contribute to this project? Feel free to open an issue or a pull request, they are always welcome!

## Credits

- [Flaticon](https://www.flaticon.com/free-icons/sticky-notes) for the PWA icons and favicon.
- [Mika Baumeister](https://unsplash.com/photos/LaqL8nxiacc) for the SEO image.
