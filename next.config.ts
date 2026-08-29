import type { NextConfig } from 'next';

const isGitHubPages = process.env.GITHUB_PAGES === 'true';

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: isGitHubPages ? '/actionbox-agent' : '',
  assetPrefix: isGitHubPages ? '/actionbox-agent/' : '',
};

export default nextConfig;
