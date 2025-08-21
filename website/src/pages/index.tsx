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
      link: '/bitcoin/intro',
      color: '#f7931a',
    },
    {
      title: '以太坊生态',
      description: '智能合约、账户管理、交易签名、多签名安全',
      icon: 'Ξ',
      link: '/ethereum/intro',
      color: '#3b82f6',
    },
    {
      title: 'Solana生态',
      description: '账户管理、交易签名、多签名、事件订阅',
      icon: '☀️',
      link: '/solana/intro',
      color: '#00FFA3',
    },
    {
      title: 'Polkadot生态',
      description: '账户管理、交易签名、多重签名',
      icon: '🔴',
      link: '/polkadot/intro',
      color: '#E6007A',
    },
    {
      title: 'Cosmos生态',
      description: '账户管理、交易签名、多重签名',
      icon: '🌌',
      link: '/cosmos/intro',
      color: '#2E3148',
    },
    {
      title: 'Ripple生态',
      description: '账户管理、交易签名、多签名安全',
      icon: '💧',
      link: '/ripple/intro',
      color: '#23292F',
    },
    {
      title: 'Avalanche生态',
      description: '高性能区块链、智能合约、账户管理、交易签名',
      icon: '❄️',
      link: '/avalanche/intro',
      color: '#e84142',
    },
    {
      title: 'Aptos生态',
      description: '智能合约、账户管理、交易签名、多签名安全',
      icon: '🚀',
      link: '/aptos/intro',
      color: '#000000',
    },
    {
      title: 'Cardano生态',
      description: '智能合约、账户管理、交易签名、多签名安全',
      icon: '🔵',
      link: '/cardano/intro',
      color: '#0033AD',
    },
    {
      title: '跨链技术',
      description: 'AnySwap 桥接协议、ABI 处理、代币授权、USDT/CLV 桥接',
      icon: '🔗',
      link: '/crosschain/anyswap/intro',
      color: '#10b981',
    },
  ];

  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {features.map((feature, idx) => (
            <div key={idx} className="col col--3">
              <div className="text--center padding-horiz--md">
                <div className={styles.featureIcon} style={{ backgroundColor: feature.color }}>
                  {feature.iconType === 'svg' ? (
                    <div dangerouslySetInnerHTML={{ __html: feature.iconSvg }} />
                  ) : feature.iconType === 'image' ? (
                    <img
                      src={feature.iconSrc}
                      alt={feature.title}
                      style={{
                        width: '2rem',
                        height: '2rem',
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: '2rem' }}>{feature.icon}</span>
                  )}
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
      link: '/bitcoin/address/address',
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
      link: '/solana/token/transfer',
      difficulty: '中级',
    },
    {
      title: '跨链资产转移',
      description: '实现不同区块链间的资产转移',
      link: '/crosschain/anyswap/README',
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

export default function Home(): ReactNode {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout title={siteConfig.title} description="全面的区块链开发指南与实践教程，涵盖比特币、以太坊、Solana等主流区块链平台">
      <HomepageHeader />
      <main>
        <BlockchainFeatures />
        <QuickStart />
      </main>
    </Layout>
  );
}
