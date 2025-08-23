import type { ReactNode } from 'react';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useBaseUrl from '@docusaurus/useBaseUrl';
import { Button } from '../components/ui/button';

// 数据配置
const BLOCKCHAIN_FEATURES = [
  {
    title: '比特币开发',
    description: '脚本系统、地址生成、交易构建、多签',
    icon: 'icons/btc.svg',
    link: '/bitcoin/intro',
    color: 'from-yellow-500 to-yellow-600',
  },
  {
    title: '以太坊生态',
    description: '智能合约、账户管理、交易签名、多签',
    icon: 'icons/eth.svg',
    link: '/ethereum/intro',
    color: 'from-blue-500 to-blue-600',
  },
  {
    title: 'Solana生态',
    description: '账户管理、交易签名、多签、事件订阅',
    icon: 'icons/sol.svg',
    link: '/solana/intro',
    color: 'from-green-400 to-green-500',
  },
  {
    title: 'Polkadot生态',
    description: '账户管理、交易签名、多签',
    icon: 'icons/dot.svg',
    link: '/polkadot/intro',
    color: 'from-pink-500 to-pink-600',
  },
  {
    title: 'Cosmos生态',
    description: '账户管理、交易签名、多签',
    icon: 'icons/atom.svg',
    link: '/cosmos/intro',
    color: 'from-slate-600 to-slate-700',
  },
  {
    title: 'Ripple生态',
    description: '账户管理、交易签名、多签',
    icon: 'icons/xrp.svg',
    link: '/ripple/intro',
    color: 'from-gray-700 to-gray-800',
  },
  {
    title: 'Avalanche生态',
    description: '高性能区块链、智能合约、账户管理、交易签名',
    icon: 'icons/avax.svg',
    link: '/avalanche/intro',
    color: 'from-red-500 to-red-600',
  },
  {
    title: 'Aptos生态',
    description: '智能合约、账户管理、交易签名、多签',
    icon: 'icons/apt.svg',
    link: '/aptos/intro',
    color: 'from-black to-gray-800',
  },
  {
    title: 'Cardano生态',
    description: '智能合约、账户管理、交易签名、多签',
    icon: 'icons/ada.svg',
    link: '/cardano/intro',
    color: 'from-blue-600 to-blue-700',
  },
  {
    title: '跨链技术',
    description: 'AnySwap 桥接协议、ABI 处理、代币授权、USDT/CLV 桥接',
    icon: 'icons/gswap.svg',
    link: '/crosschain/anyswap/intro',
    color: 'from-emerald-500 to-emerald-600',
  },
];

const QUICK_START_ITEMS = [
  {
    title: '比特币地址生成',
    description: '学习如何生成和验证比特币地址',
    link: '/bitcoin/address',
    difficulty: '初级',
    color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200',
  },
  {
    title: '以太坊多签名钱包',
    description: '使用Gnosis Safe构建安全的多签名钱包',
    link: '/ethereum/multisig/safe/gnosis',
    difficulty: '中级',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200',
  },
  {
    title: 'Solana程序开发',
    description: '构建Solana区块链上的去中心化应用',
    link: '/solana/intro',
    difficulty: '中级',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200',
  },
  {
    title: '跨链资产转移',
    description: '实现不同区块链间的资产转移',
    link: '/crosschain',
    difficulty: '高级',
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200',
  },
];

// 组件
function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  const bannerUrl = useBaseUrl('banner.jpg');

  return (
    <header
      className="relative px-2 py-20 text-center"
      style={{
        backgroundImage: `url(${bannerUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* 叠加蒙层 */}
      <div className="absolute inset-0 bg-black/60"></div>

      {/* 内容容器 */}
      <div className="container relative z-10">
        <Heading as="h1" className="mb-4 text-2xl font-bold text-white md:text-3xl lg:text-5xl">
          {siteConfig.title}
        </Heading>
        <div className="flex flex-col-1 sm:flex-row gap-6 justify-center">
          <Button asChild>
            <Link className="hover:text-primary-foreground transition-all duration-300" to="/intro">
              开始学习 📚
            </Link>
          </Button>
          <Button asChild>
            <Link to="/blog" className="hover:text-primary-foreground transition-all duration-300">
              查看博客 ✨
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function FeatureCard({
  link,
  title,
  description,
  icon,
  color,
}: {
  link: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}) {
  return (
    <div className="group text-center flex flex-col h-full p-0.5 rounded-xl transition-all duration-300 bg-card border border-border/50 hover:!border-primary/50 hover:shadow-[0_0_15px_theme(colors.primary/50%)]">
      <div className="bg-card rounded-[11px] h-full flex flex-col">
        <div className="mb-8 pt-6">
          <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-lg transition-all duration-300 group-hover:scale-110">
            <img src={useBaseUrl(icon)} alt={title} className="w-14 h-14" />
          </div>
        </div>
        <h3 className="text-xl font-bold mb-3 text-foreground">{title}</h3>
        <p className="text-muted-foreground mb-4 text-sm leading-relaxed flex-grow px-4">{description}</p>
        <div className="mt-auto pb-6">
          <Link
            to={link}
            className="inline-block bg-secondary hover:bg-secondary/80 text-secondary-foreground px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md"
          >
            了解更多
          </Link>
        </div>
      </div>
    </div>
  );
}

function HomepageFeatures() {
  return (
    <section className="py-20 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
          {BLOCKCHAIN_FEATURES.map((feature, idx) => (
            <FeatureCard key={idx} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}

function QuickStartCard({
  title,
  description,
  link,
  difficulty,
  color,
}: {
  title: string;
  description: string;
  link: string;
  difficulty: string;
  color: string;
}) {
  return (
    <div className="bg-card rounded-xl shadow-lg border border-border/50 hover:shadow-xl transition-all duration-300 backdrop-blur-sm hover:!border-primary/50 hover:shadow-[0_0_15px_theme(colors.primary/50%)]">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-foreground">{title}</h3>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${color}`}>{difficulty}</span>
        </div>
        <div className="mb-6">
          <p className="text-muted-foreground leading-relaxed">{description}</p>
        </div>
        <div>
          <Link
            to={link}
            className="inline-block bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg font-medium transition-all duration-200"
          >
            开始学习
          </Link>
        </div>
      </div>
    </div>
  );
}

function QuickStart() {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 text-foreground">快速开始</h2>
          <p className="text-xl text-muted-foreground">选择适合你水平的教程，快速上手区块链开发</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {QUICK_START_ITEMS.map((item, idx) => (
            <QuickStartCard key={idx} {...item} />
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
