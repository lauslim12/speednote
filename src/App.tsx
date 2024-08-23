import Configuration from './Configuration';
import Editor from './Editor';
import Link from './Link';

const App = () => (
  <>
    <header class="flex justify-end gap-2">
      <Configuration />

      <Link type="external" href="https://github.com/lauslim12/speednote">
        About
      </Link>
    </header>

    <main class="flex flex-1 flex-col px-0 py-8 sm:px-2 md:px-6 lg:px-12 xl:px-20">
      <Editor />
    </main>

    <footer class="flex flex-col gap-1">
      <p class="text-center text-xs text-thanks">
        Thank you so much for using Speednote! Made with ♥ in Tokyo, Japan
      </p>
      <p class="text-center text-[0.5rem] text-link">
        {import.meta.env.VITE_APP_VERSION}
      </p>
    </footer>
  </>
);

export default App;
