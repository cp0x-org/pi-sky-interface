import { useChainId } from 'wagmi';
import { skyConfig } from 'config/index';

export type NetworkId = keyof typeof skyConfig;

export const useConfigChainId = () => {
  let chainId = useChainId();

  const isSupportedNetwork = chainId in skyConfig;

  if (!isSupportedNetwork) {
    console.warn(`Unsupported network with chainId: ${chainId}`);
    chainId = 1;
  }

  const config = skyConfig[chainId as NetworkId];
  return { config, chainId: chainId as NetworkId, isSupported: true };
};
