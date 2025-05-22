// import { http, createConfig } from 'wagmi'
import { mainnet, sepolia, Chain } from 'wagmi/chains';
// import { coinbaseWallet, injected, walletConnect } from 'wagmi/connectors'

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
// import { Chain } from 'wagmi'

const mainTest: Chain = {
  id: 1999999,
  name: 'MainTest',
  nativeCurrency: {
    name: 'MainToken',
    symbol: 'MTK',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://virtual.mainnet.rpc.tenderly.co/af026b7d-3372-48a2-93af-f6a595d9fb87'],
    },
    public: {
      http: ['https://virtual.mainnet.rpc.tenderly.co/af026b7d-3372-48a2-93af-f6a595d9fb87'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Tenderly Explorer',
      url: 'https://dashboard.tenderly.co/',
    },
  },
  testnet: false, // или true, если это тестовая сеть
}

export const config = getDefaultConfig({
  appName: 'My RainbowKit App',
  projectId: '4b1f5d2b6f0a3368aba6cf7556fb00e2',
  chains: [mainnet, sepolia, mainTest],
  ssr: false
});

// export const config = createConfig({
//   chains: [mainnet, sepolia],
//   connectors: [
//     injected(),
//     coinbaseWallet(),
//     walletConnect({ projectId: import.meta.env.VITE_WC_PROJECT_ID }),
//   ],
//   transports: {
//     [mainnet.id]: http(),
//     [sepolia.id]: http(),
//   },
// })
//
// declare module 'wagmi' {
//   interface Register {
//     config: typeof config
//   }
// }
