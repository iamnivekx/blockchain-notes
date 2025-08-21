import { themes as prismThemes } from 'prism-react-renderer';
import remarkCodeImport from 'remark-code-import';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';


/** @type {import('@docusaurus/types').Config} */
const config: Config = {
  title: 'Blockchain Notes',
  tagline: 'Blockchain Notes',
  favicon: 'img/favicon.ico',
  staticDirectories: ['public', 'static'],

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

  plugins: [
    async function tailwindPlugin(context, options) {
      return {
        name: 'tailwind-plugin',
        configurePostCss(postcssOptions) {
          postcssOptions.plugins = [require('@tailwindcss/postcss')]
          return postcssOptions
        }
      }
    },
    [
      'ideal-image',
      /** @type {import('@docusaurus/plugin-ideal-image').PluginOptions} */
      {
        quality: 70,
        max: 1030, // max resized image's size.
        min: 640, // min resized image's size. if original is lower, use that size.
        steps: 2, // the max number of images generated between min and max (inclusive)
        disableInDev: false,
      },
    ],
  ],

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
    languageTabs: [
      { highlight: 'python', language: 'python', logoClass: 'python' },
      { highlight: 'bash', language: 'curl', logoClass: 'curl' },
      { highlight: 'csharp', language: 'csharp', logoClass: 'csharp' },
      { highlight: 'go', language: 'go', logoClass: 'go' },
      { highlight: 'javascript', language: 'nodejs', logoClass: 'nodejs' },
      { highlight: 'ruby', language: 'ruby', logoClass: 'ruby' },
      { highlight: 'php', language: 'php', logoClass: 'php' },
      { highlight: 'java', language: 'java', logoClass: 'java', variant: 'unirest' },
      { highlight: 'powershell', language: 'powershell', logoClass: 'powershell' },
      { highlight: 'dart', language: 'dart', logoClass: 'dart' },
      { highlight: 'javascript', language: 'javascript', logoClass: 'javascript' },
      { highlight: 'c', language: 'c', logoClass: 'c' },
      { highlight: 'objective-c', language: 'objective-c', logoClass: 'objective-c' },
      { highlight: 'ocaml', language: 'ocaml', logoClass: 'ocaml' },
      { highlight: 'r', language: 'r', logoClass: 'r' },
      { highlight: 'swift', language: 'swift', logoClass: 'swift' },
      { highlight: 'kotlin', language: 'kotlin', logoClass: 'kotlin' },
      { highlight: 'rust', language: 'rust', logoClass: 'rust' }
    ]
  } satisfies Preset.ThemeConfig,
  themes: [
    [
      require.resolve('@easyops-cn/docusaurus-search-local'),
      {
        indexPages: true,
        docsRouteBasePath: '/docs',
        hashed: true,
        language: ['en'],
        highlightSearchTermsOnTargetPage: false,
        searchResultContextMaxLength: 50,
        searchResultLimits: 8,
        searchBarShortcut: true,
        searchBarShortcutHint: true
      }
    ]
  ],
};

export default config;
