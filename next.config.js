// Reference: https://github.com/Schular/next-with-pwa/blob/17d92aa09936824d90369745d10affecef493b2f/next.config.js
const path = require('path');
const withPWAInit = require('next-pwa');

/** @type {import('next-pwa').PWAConfig} */
const withPWA = withPWAInit({
  dest: 'public',
  // Solution: https://github.com/shadowwalker/next-pwa/issues/424#issuecomment-1399683017
  buildExcludes: ['app-build-manifest.json'],
});

const generateAppDirEntry = (entry) => {
  const packagePath = require.resolve('next-pwa');
  const packageDirectory = path.dirname(packagePath);
  const registerJs = path.join(packageDirectory, 'register.js');

  return entry().then((entries) => {
    // Register SW on App directory, solution: https://github.com/shadowwalker/next-pwa/pull/427
    if (entries['main-app'] && !entries['main-app'].includes(registerJs)) {
      if (Array.isArray(entries['main-app'])) {
        entries['main-app'].unshift(registerJs);
      } else if (typeof entries['main-app'] === 'string') {
        entries['main-app'] = [registerJs, entries['main-app']];
      }
    }
    return entries;
  });
};

const getVersion = () => {
  // Use `Date.now()` instead of `new Date()` to make sure that the time is in `ja-JP` format properly (timezone issues).
  const buildTime = Date.now();

  return Intl.DateTimeFormat('ja-JP', { dateStyle: 'long' }).format(buildTime);
};

/** @type {import('next').NextConfig} */
const nextConfig = withPWA({
  reactStrictMode: true,
  env: {
    VERSION: getVersion(),
  },
  webpack: (config) => {
    const entry = generateAppDirEntry(config.entry);
    config.entry = () => entry;

    return config;
  },
});

module.exports = nextConfig;
