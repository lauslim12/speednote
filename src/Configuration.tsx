import { createSignal } from 'solid-js';

import Button from './Button';

const Configuration = () => {
  const [isDark, setIsDark] = createSignal(
    window.matchMedia('(prefers-color-scheme: dark').matches,
  );

  const handleThemeChange = () => {
    const root = document.documentElement;
    if (isDark()) {
      root.removeAttribute('data-theme');
      root.setAttribute('data-theme', 'light');
      setIsDark(false);
      return;
    }

    root.removeAttribute('data-theme');
    root.setAttribute('data-theme', 'dark');
    setIsDark(true);
  };

  return (
    <>
      <Button aria-label="Color mode switch" onClick={handleThemeChange}>
        {isDark() ? 'Lighten' : 'Darken'}
      </Button>
    </>
  );
};

export default Configuration;
