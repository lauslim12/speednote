import { memo } from 'react';

import errorStyles from './error.module.scss';
import Link from './Link';
import pageStyles from './page.module.scss';

const NotFound = () => (
  <>
    <header className={pageStyles.header}>
      <Link type="external" href="https://github.com/lauslim12/speednote">
        About
      </Link>
    </header>

    <main className={pageStyles.main}>
      <section className={errorStyles.container}>
        <h1 className={errorStyles.title}>Page not found</h1>
        <h2 className={errorStyles.subtitle}>
          Could not find the requested resource
        </h2>

        <Link type="internal" href="/">
          Back to editor
        </Link>
      </section>
    </main>

    <footer className={pageStyles.footer}>
      <p className={pageStyles.thanks}>
        Thank you so much for using Speednote! Made with ♥ in Tokyo, Japan
      </p>

      <p className={pageStyles.hash}>{process.env.VERSION}</p>
    </footer>
  </>
);

export default memo(NotFound);
