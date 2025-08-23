import { themes } from 'prism-react-renderer';
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
  headTags: [
    {
      tagName: 'meta',
      attributes: {
        name: 'algolia-site-verification',
        content: 'A6947CB4CC36D268',
      },
    },
  ],

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true,
    experimental_faster: true, // turns Docusaurus Faster on globally
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
      '@docusaurus/plugin-ideal-image',
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
          // path: 'docs',
          breadcrumbs: true,
          editUrl:
            'https://github.com/iamnivekx/blockchain-notes/tree/main',
          routeBasePath: '/',
          remarkPlugins: [
            remarkCodeImport,
            remarkMath
          ],
          rehypePlugins: [rehypeKatex]
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
          customCss: ['./src/css/custom.css'],
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/favicon-16x16.png',
    metadata: [
      { name: 'algolia-site-verification', content: 'A6947CB4CC36D268' },
    ],
    navbar: {
      title: 'Blockchain Notes',
      logo: {
        alt: 'Blockchain Notes Logo',
        src: 'img/logo.svg',
      },
      items: [
        { type: 'docSidebar', sidebarId: 'tutorialSidebar', position: 'left', label: 'Docs' },
        // { to: '/intro', label: 'Docs', position: 'left' },
        { to: '/blog', label: 'Blog', position: 'left' },
        {
          href: 'https://github.com/iamnivekx/blockchain-notes',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    docs: { sidebar: { autoCollapseCategories: true, hideable: true, }, },
    blog: { sidebar: { groupByYear: true } },
    sitemap: {
      changefreq: 'weekly',
      priority: 0.5,
    },
    footer: {
      style: 'light',
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
              href: 'https://x.com/inivek3',
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
    // algolia: {
    //   contextualSearch: true,
    //   appId: 'UBLG1RVVFZ',
    //   apiKey: 'bc19b765e456211b26fd01c36604b783',
    //   indexName: 'blockchain_notes',
    //   searchParameters: {
    //     hitsPerPage: 4,
    //   },
    // },
    prism: {
      theme: themes.dracula,
      darkTheme: themes.dracula,
      additionalLanguages: ['bash', 'diff', 'json'],
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
        language: ["en", "zh"],
        highlightSearchTermsOnTargetPage: false,
        searchResultContextMaxLength: 50,
        searchResultLimits: 5,
        searchBarShortcut: true,
        searchBarShortcutHint: true
      }
    ],
    [
      '@docusaurus/theme-mermaid',
      {
        mermaid: {
          theme: 'dark',
        },
      },
    ]
  ],
  markdown: {
    mermaid: true,
  },
};

export default config;
