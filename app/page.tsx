import dynamic from 'next/dynamic';

import styles from './page.module.scss';

// Lazy-load the note editor to make sure that it is not server-side rendered, because
// we need the `localStorage` to work, so it has to be purely a client component. In Next.js 13,
// passing the `'use client'` directive does not mean purely rendering the component on the client,
// it will still have some parts pre-rendered from the server, hence why we need to set the `ssr`
// attribute here to `false`.
//
// References:
// - https://github.com/vercel/next.js/discussions/47011
// - https://github.com/vercel/next.js/discussions/49131
// - https://github.com/vercel/next.js/discussions/47028
// - https://github.com/vercel/next.js/discussions/48042
const Editor = dynamic(() => import('./Editor'), {
  ssr: false,
  loading: () => (
    <div className={styles.loader} role="progressbar">
      <p>Setting up the your note editor in a flash...</p>
    </div>
  ),
});

const Configuration = dynamic(() => import('./Configuration'), { ssr: false });

/**
 * Home component, the main page.
 *
 * @returns React Functional Component.
 */
const Home = () => {
  return (
    <>
      <header className={styles.header}>
        <Configuration />

        <a
          href="https://github.com/lauslim12/speednote"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.externalLink}
        >
          About
        </a>
      </header>

      <main className={styles.main}>
        <Editor />
      </main>

      <footer className={styles.footer}>
        <p className={styles.thanks}>
          Thank you so much for using Speednote! Made with ♥ in Tokyo, Japan
        </p>
      </footer>
    </>
  );
};

export default Home;
