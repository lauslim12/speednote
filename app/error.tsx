'use client';

import Button from './Button';
import errorStyles from './error.module.scss';
import Link from './Link';
import pageStyles from './page.module.scss';

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

const Error = ({ reset }: ErrorProps) => (
  <>
    <header className={pageStyles.header}>
      <Link type="external" href="https://github.com/lauslim12/speednote">
        About
      </Link>
    </header>

    <main className={pageStyles.main}>
      <section className={errorStyles.container}>
        <h1 className={errorStyles.title}>Unexpected error</h1>
        <h2 className={errorStyles.subtitle}>
          This error is potentially caused by the local storage being disabled.
          Please enable the local storage to use this application.
        </h2>

        <Button onClick={reset}>Try again</Button>
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

export default Error;
