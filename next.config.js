/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['firebasestorage.googleapis.com'],
  },
};

let exportedConfig = nextConfig;

try {
  const withSerwist = require('@serwist/next').default({
    swSrc: 'src/app/sw.ts',
    swDest: 'public/sw.js',
    reloadOnOnline: true,
    disable: process.env.NODE_ENV === 'development',
  });
  exportedConfig = withSerwist(nextConfig);
} catch {
  // @serwist/next not yet installed — run npm install first
}

module.exports = exportedConfig;
