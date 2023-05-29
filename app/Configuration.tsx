'use client';

import { memo, useState } from 'react';

import styles from './Configuration.module.scss';

const Configuration = () => {
  const [isDark, setIsDark] = useState(
    window.matchMedia('(prefers-color-scheme: dark').matches
  );

  const handleThemeChange = () => {
    const root = document.documentElement;
    if (isDark) {
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
      <button
        className={styles.button}
        aria-label="Color mode switch"
        onClick={handleThemeChange}
      >
        {isDark ? 'Lighten' : 'Darken'}
      </button>
    </>
  );
};

export default memo(Configuration);
