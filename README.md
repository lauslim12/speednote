# Speednote

Optimized Progressive Web Application (PWA) to input your thoughts as soon as possible.

## Background

I am a person who enjoys taking notes of the amount of money I spent on something every single day. In Japan, it is easy to keep track of everything because of its relative clearness with regards to prices and its no tipping culture. I usually type my expense right after spending my money to make sure that I do not forget. Problem starts to happen when I use my usual note-taking app. After a long time of using it, I realized that it is unreasonably slow and I have to navigate through different menus before being able to type my expenses. Honestly, the slowness is starting to annoy me, so I decided to make another application to fulfill my use-case.

## Features

- Blazingly fast. When you open the app, you can instantly type after the editor is mounted.
- There is an autosave function with debounce, so you don't have to worry about lag and data loss (stored in `localStorage`).
- Lightweight. I intentionally did not use any heavy UI-frameworks and decided to just use a normal CSS to make it featherweight.
- Responsive to make sure that this application could be used in various environments without losing UX.
- Tested with React Testing Library to make sure everything works properly according to the expectations.

## Limitations

- Despite its speed, this application is a bit volatile (relies on `localStorage`) and should not be used for long-term note saving. You should also not try to exceed your browser's `localStorage` size (do not make notes that are too large / too long). It is said that the maximum size for `localStorage` is 5MB.
- Actually we should await for the debounce to finish before allowing the user to close the browser, not just invoking it. If the debounce is not finished and the user closes the browser, the changes will not be saved. But, to be honest, [https://stackoverflow.com/a/46779140/13980107](from this benchmark) and [https://gomakethings.com/how-fast-is-vanilla-js-localstorage/](this benchmark), this is a very edge-case because `localStorage` can save in less than a millisecond. A good solution is to add an 'Unsaved Confirmation' before we close the browser is the debounce is still not finished yet.

## Credits

- [Flaticon](https://www.flaticon.com/free-icons/sticky-notes) for the PWA icons and favicon.
- [Mika Baumeister](https://unsplash.com/photos/LaqL8nxiacc) for the SEO image.
