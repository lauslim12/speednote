import './App.scss';

import Configuration from './Configuration';
import Editor from './Editor';
import Link from './Link';

const App = () => (
  <>
    <header class="header">
      <Configuration />

      <Link type="external" href="https://github.com/lauslim12/speednote">
        About
      </Link>
    </header>

    <main class="main">
      <Editor />
    </main>

    <footer class="footer">
      <p class="thanks">
        Thank you so much for using Speednote! Made with ♥ in Tokyo, Japan
      </p>

      <p class="hash">{import.meta.env.VITE_APP_VERSION}</p>
    </footer>
  </>
);

export default App;
