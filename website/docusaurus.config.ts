import { themes as prismThemes } from 'prism-react-renderer';
import remarkCodeImport from 'remark-code-import';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';


const config: Config = {
  title: 'Blockchain Notes',
  tagline: 'Blockchain Notes',
  favicon: 'img/favicon.ico',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://iamnivekx.github.com',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/blockchain-notes/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'iamnivekx', // Usually your GitHub org/user name.
  projectName: 'blockchain-notes', // Usually your repo name.

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'zh-Hans',
    locales: ['zh-Hans'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          path: 'docs',
          routeBasePath: '/',
          remarkPlugins: [
            remarkCodeImport,
            remarkMath
          ],
          rehypePlugins: [rehypeKatex],
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          // Useful options to enforce blogging best practices
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
          remarkPlugins: [
            remarkCodeImport,
            remarkMath
          ],
          rehypePlugins: [rehypeKatex],
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/favicon-16x16.png',
    navbar: {
      title: 'Blockchain Notes',
      logo: {
        alt: 'Blockchain Notes Logo',
        src: 'img/logo.svg',
      },
      items: [
        { to: '/intro', label: 'Docs', position: 'left' },
        { to: '/blog', label: 'Blog', position: 'left' },
        {
          href: 'https://github.com/iamnivekx/blockchain-notes',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            {
              label: 'Docs',
              to: '/intro',
            },
            {
              label: 'Blog',
              to: '/blog',
            },
            {
              label: 'Examples',
              href: 'https://github.com/iamnivekx/blockchain-notes/tree/main/examples',
            },
          ],
        },
        {
          title: 'Blockchains',
          items: [
            {
              label: 'Bitcoin',
              to: '/category/bitcoin',
            },
            {
              label: 'Ethereum',
              to: '/category/ethereum',
            },
            {
              label: 'Solana',
              to: '/category/solana',
            },
            {
              label: 'Cosmos',
              to: '/category/cosmos',
            },
          ],
        },
        {
          title: 'Resources',
          items: [
            {
              label: 'Issues & Support',
              href: 'https://github.com/iamnivekx/blockchain-notes/issues',
            },
            {
              label: 'Contributing',
              href: 'https://github.com/iamnivekx/blockchain-notes/blob/main/CONTRIBUTING.md',
            },
          ],
        },
        {
          title: 'Connect',
          items: [
            {
              label: 'Twitter',
              href: 'https://twitter.com/iamnivekx',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/iamnivekx',
            }
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} iamnivekx. Built with ❤️ for the blockchain community.`,
    },
    prism: {
      theme: prismThemes.dracula,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
