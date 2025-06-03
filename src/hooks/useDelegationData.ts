import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useConfigChainId } from './useConfigChainId';

interface DelegationEvent {
  lockAmount: string;
  blockTimestamp: string;
  hash: string;
  isStakingEngine: boolean;
}

export interface DelegatedToItem {
  address: string;
  lockAmount: string;
  events: DelegationEvent[];
}

export interface DelegationData {
  delegatedTo: DelegatedToItem[];
  totalDelegated: number;
  isLoading: boolean;
  error: string | null;
}

export const useDelegationData = (): DelegationData => {
  const { address } = useAccount();
  const { config: skyConfig } = useConfigChainId();
  
  const [delegationData, setDelegationData] = useState<{
    delegatedTo: DelegatedToItem[];
    totalDelegated: number;
  }>({
    delegatedTo: [],
    totalDelegated: 0
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDelegationData = async () => {
      if (!address) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Format the URL with the address placeholders
        const url = `https://vote.sky.money/api/address/${address}/delegated-to?address=${address}&network=mainnet`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Error fetching delegation data: ${response.statusText}`);
        }
        
        const data = await response.json();
        setDelegationData(data);
      } catch (err) {
        console.error('Error fetching delegation data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDelegationData();
  }, [address]);

  return {
    ...delegationData,
    isLoading,
    error
  };
};
