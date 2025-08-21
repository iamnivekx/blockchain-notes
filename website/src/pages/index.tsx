import type { ReactNode } from 'react';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useBaseUrl from '@docusaurus/useBaseUrl';
import { Button } from '../components/ui/button';

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  const bannerUrl = useBaseUrl('/img/banner.jpg');
  return (
    <header
      className="px-2 py-20 text-center text-slate-800"
      style={{
        backgroundImage: `url(${bannerUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="container">
        <Heading as="h1" className="mb-4 text-2xl font-bold md:text-3xl lg:text-5xl">
          {siteConfig.title}
        </Heading>
        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <Button asChild>
            <Link className="hover:text-primary-foreground" style={{ transition: 'all 0.3s ease' }} to="/intro">
              开始学习 📚
            </Link>
          </Button>
          <Button asChild>
            <Link to="/blog/intro" className="hover:text-primary-foreground">
              查看博客 ✨
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function HomepageFeatures() {
  const features = [
    {
      title: '比特币开发',
      description: '脚本系统、地址生成、交易构建、多签',
      icon: '₿',
      link: '/bitcoin/intro',
      color: '#f7931a',
    },
    {
      title: '以太坊生态',
      description: '智能合约、账户管理、交易签名、多签',
      icon: 'Ξ',
      link: '/ethereum/intro',
      color: '#3b82f6',
    },
    {
      title: 'Solana生态',
      description: '账户管理、交易签名、多签、事件订阅',
      icon: '☀️',
      link: '/solana/intro',
      color: '#00FFA3',
    },
    {
      title: 'Polkadot生态',
      description: '账户管理、交易签名、多签',
      icon: '🔴',
      link: '/polkadot/intro',
      color: '#E6007A',
    },
    {
      title: 'Cosmos生态',
      description: '账户管理、交易签名、多签',
      icon: '🌌',
      link: '/cosmos/intro',
      color: '#2E3148',
    },
    {
      title: 'Ripple生态',
      description: '账户管理、交易签名、多签',
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
      description: '智能合约、账户管理、交易签名、多签',
      icon: '🚀',
      link: '/aptos/intro',
      color: '#000000',
    },
    {
      title: 'Cardano生态',
      description: '智能合约、账户管理、交易签名、多签',
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
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
          {features.map((feature, idx) => (
            <div key={idx} className="text-center flex flex-col h-full">
              <div className="mb-6">
                <div
                  className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg hover:scale-110 transition-transform duration-200"
                  style={{ backgroundColor: feature.color }}
                >
                  <span className="text-3xl">{feature.icon}</span>
                </div>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">{feature.title}</h3>
              <p className="text-gray-600 mb-4 text-sm leading-relaxed flex-grow">{feature.description}</p>
              <div className="mt-auto">
                <Link
                  to={feature.link}
                  className="inline-block bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 shadow-sm hover:shadow-md"
                >
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
      link: '/solana/intro',
      difficulty: '中级',
    },
    {
      title: '跨链资产转移',
      description: '实现不同区块链间的资产转移',
      link: '/crosschain',
      difficulty: '高级',
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 text-gray-800">快速开始</h2>
          <p className="text-xl text-gray-600">选择适合你水平的教程，快速上手区块链开发</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {quickStartItems.map((item, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-800">{item.title}</h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      item.difficulty === '初级'
                        ? 'bg-green-100 text-green-800'
                        : item.difficulty === '中级'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {item.difficulty}
                  </span>
                </div>
                <div className="mb-6">
                  <p className="text-gray-600 leading-relaxed">{item.description}</p>
                </div>
                <div>
                  <Link
                    to={item.link}
                    className="inline-block bg-blue-800 hover:bg-blue-900 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
                  >
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
        <HomepageFeatures />
        <QuickStart />
      </main>
    </Layout>
  );
}
