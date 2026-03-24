import { mainnet } from 'wagmi/chains';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { loadConfig } from './configLoader';

export async function createWagmiConfig() {
  const cfg = await loadConfig();

  const mainnetCustom = {
    ...mainnet,
    rpcUrls: {
      default: { http: [cfg.rpcUrl] }
    }
  };

  return getDefaultConfig({
    appName: 'Sky Interface',
    projectId: cfg.projectId,
    chains: [mainnetCustom],
    ssr: false
  });
}

export async function getSubgraphUrl(): Promise<string> {
  const cfg = await loadConfig();
  return cfg.subgraphUrl;
}
