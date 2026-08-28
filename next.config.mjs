import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.resolve(__dirname),
  serverExternalPackages: [
    'better-sqlite3',
    'linkedin-jobs-api',
    'sharp',
    'tesseract.js',
    'canvas',
    'pdf-parse'
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb',
    },
  },
};

export default nextConfig;
