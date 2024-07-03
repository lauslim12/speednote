import './NotFound.scss';
import './App.scss';

import Link from './Link';

const NotFound = () => (
  <>
    <header class="header">
      <Link type="external" href="https://github.com/lauslim12/speednote">
        About
      </Link>
    </header>

    <main class="main">
      <section class="container">
        <h1 class="title">Page not found</h1>
        <h2 class="subtitle">Could not find the requested resource</h2>

        <Link type="internal" href="/">
          Back to editor
        </Link>
      </section>
    </main>

    <footer class="footer">
      <p class="thanks">
        Thank you so much for using Speednote! Made with ♥ in Tokyo, Japan
      </p>

      <p class="hash">{import.meta.env.VITE_APP_VERSION}</p>
    </footer>
  </>
);

export default NotFound;
