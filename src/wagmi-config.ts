// import { http, createConfig } from 'wagmi'
// import { mainnet, sepolia, Chain } from 'wagmi/chains';
import { mainnet, Chain } from 'wagmi/chains';
// import { coinbaseWallet, injected, walletConnect } from 'wagmi/connectors'

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { createConfig, http } from '@wagmi/core';
import { mainnet as mainnetCore } from '@wagmi/core/chains';

// import { Chain } from 'wagmi'

const mainTest: Chain = {
  id: 1999999,
  name: 'MyNet',
  nativeCurrency: {
    name: 'MainToken',
    symbol: 'MTK',
    decimals: 18
  },
  rpcUrls: {
    default: {
      http: ['https://virtual.mainnet.rpc.tenderly.co/f6a7b5d3-e340-4d72-a6ec-e4984cde3422']
    },
    public: {
      http: ['https://virtual.mainnet.rpc.tenderly.co/f6a7b5d3-e340-4d72-a6ec-e4984cde3422']
    }
  },
  blockExplorers: {
    default: {
      name: 'Tenderly Explorer',
      url: 'https://dashboard.tenderly.co/'
    }
  },
  testnet: false // или true, если это тестовая сеть
};

const mainAnvil: Chain = {
  id: 12222,
  name: 'Anvil',
  nativeCurrency: {
    name: 'ANV',
    symbol: 'ANV',
    decimals: 18
  },
  rpcUrls: {
    default: {
      http: ['http://127.0.0.1:9545']
    },
    public: {
      http: ['http://127.0.0.1:9545']
    }
  },
  blockExplorers: {
    default: {
      name: 'None',
      url: ''
    }
  },
  testnet: false
};

export const config = getDefaultConfig({
  appName: 'Sky Interface',
  projectId: '7849e5f74edaf36dd455bc07ced4f166', // sky project(!!!)
  // chains: [mainnet, sepolia, mainTest],
  chains: [mainnet],
  // chains: [mainnet, mainAnvil, mainTest],
  ssr: false
});
