import type { ReactNode } from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">区块链开发指南与实践教程</p>
        <p className="hero__description">从比特币脚本到以太坊智能合约，从多签名钱包到跨链交易</p>
        <div className={styles.buttons}>
          <Link className="button button--secondary button--lg" to="/docs">
            开始学习 📚
          </Link>
          <Link className="button button--primary button--lg" to="/blog">
            查看博客 ✨
          </Link>
        </div>
      </div>
    </header>
  );
}

function BlockchainFeatures() {
  const features = [
    {
      title: '比特币开发',
      description: '脚本系统、地址生成、交易构建、多签名钱包',
      icon: '₿',
      link: '/docs/bitcoin/intro',
      color: '#f7931a',
    },
    {
      title: '以太坊生态',
      description: '智能合约、账户管理、交易签名、多签名安全',
      icon: 'Ξ',
      link: '/docs/ethereum/intro',
      color: '#3b82f6',
    },
    {
      title: '跨链技术',
      description: '原子交换、跨链桥接、多链资产管理',
      icon: '🔗',
      link: '/docs/cross-chain/intro',
      color: '#10b981',
    },
    {
      title: '其他公链',
      description: 'Solana、Polkadot、Cosmos、Cardano等',
      icon: '🌐',
      link: '/docs/solana/intro',
      color: '#8b5cf6',
    },
  ];

  return (
    <section className={styles.features}>
      <div className="container">
        <div className="text--center margin-bottom--xl">
          <Heading as="h2">核心技术栈</Heading>
          <p>覆盖主流区块链平台，提供完整的开发解决方案</p>
        </div>
        <div className="row">
          {features.map((feature, idx) => (
            <div key={idx} className="col col--3">
              <div className="text--center padding-horiz--md">
                <div className={styles.featureIcon} style={{ backgroundColor: feature.color }}>
                  <span style={{ fontSize: '2rem' }}>{feature.icon}</span>
                </div>
                <Heading as="h3">{feature.title}</Heading>
                <p>{feature.description}</p>
                <Link to={feature.link} className="button button--outline button--secondary">
                  了解更多
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function QuickStart() {
  const quickStartItems = [
    {
      title: '比特币地址生成',
      description: '学习如何生成和验证比特币地址',
      link: '/bitcoin/address',
      difficulty: '初级',
    },
    {
      title: '以太坊多签名钱包',
      description: '使用Gnosis Safe构建安全的多签名钱包',
      link: '/ethereum/multisig/safe/gnosis',
      difficulty: '中级',
    },
    {
      title: 'Solana程序开发',
      description: '构建Solana区块链上的去中心化应用',
      link: '/solana/spl-token/account',
      difficulty: '中级',
    },
    {
      title: '跨链资产转移',
      description: '实现不同区块链间的资产转移',
      link: '/cross-chain/anyswap/README',
      difficulty: '高级',
    },
  ];

  return (
    <section className={styles.quickStart}>
      <div className="container">
        <div className="text--center margin-bottom--xl">
          <Heading as="h2">快速开始</Heading>
          <p>选择适合你水平的教程，快速上手区块链开发</p>
        </div>
        <div className="row">
          {quickStartItems.map((item, idx) => (
            <div key={idx} className="col col--6 margin-bottom--lg">
              <div className="card">
                <div className="card__header">
                  <h3>{item.title}</h3>
                  <span
                    className={`badge badge--${
                      item.difficulty === '初级' ? 'primary' : item.difficulty === '中级' ? 'secondary' : 'warning'
                    }`}
                  >
                    {item.difficulty}
                  </span>
                </div>
                <div className="card__body">
                  <p>{item.description}</p>
                </div>
                <div className="card__footer">
                  <Link to={item.link} className="button button--primary button--sm">
                    开始学习
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CommunitySection() {
  return (
    <section className={styles.community}>
      <div className="container">
        <div className="text--center">
          <Heading as="h2">加入社区</Heading>
          <p>与其他区块链开发者交流，分享经验和见解</p>
          <div className={styles.communityButtons}>
            <Link className="button button--outline button--primary" to="/blog">
              阅读博客文章
            </Link>
            <Link className="button button--outline button--secondary" to="https://github.com/iamnivekx/blockchain-notes">
              GitHub 仓库
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout title={siteConfig.title} description="全面的区块链开发指南与实践教程，涵盖比特币、以太坊、Solana等主流区块链平台">
      <HomepageHeader />
      <main>
        <BlockchainFeatures />
        <QuickStart />
        <CommunitySection />
      </main>
    </Layout>
  );
}
