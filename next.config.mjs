import withSerwistInit from '@serwist/next';

const withSerwist = withSerwistInit({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
});

const getVersion = () => {
  // Use `Date.now()` instead of `new Date()` to make sure that the time is in `ja-JP` format properly (timezone issues).
  const buildTime = Date.now();

  return Intl.DateTimeFormat('ja-JP', { dateStyle: 'long' }).format(buildTime);
};

/** @type {import('next').NextConfig} */
export default withSerwist({
  reactStrictMode: true,
  env: {
    VERSION: getVersion(),
  },
});
