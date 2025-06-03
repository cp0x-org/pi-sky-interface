import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

export interface StakingLock {
  index: string;
  wad: string;
  blockTimestamp: string;
  transactionHash: string;
}

export interface StakingFree {
  index: string;
  wad: string;
  blockTimestamp: string;
  transactionHash: string;
}

export interface StakingData {
  stakingLocks: StakingLock[];
  stakingFrees: StakingFree[];
  isLoading: boolean;
  error: string | null;
}

export const useStakingData = (): StakingData => {
  const { address } = useAccount();
  const [stakingData, setStakingData] = useState<{
    stakingLocks: StakingLock[];
    stakingFrees: StakingFree[];
  }>({
    stakingLocks: [],
    stakingFrees: []
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStakingData = async () => {
      if (!address) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const query = `
          {
            stakingLocks(where: { urn_: {owner: "${address}"}}) {
              index
              wad
              blockTimestamp
              transactionHash
            }
            stakingFrees(where: { urn_: {owner: "${address}"}}) {
              index
              wad
              blockTimestamp
              transactionHash
            }
          }
        `;

        // Add a timeout to prevent hanging if the GraphQL endpoint is slow
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        try {
          const response = await fetch('https://query-subgraph.sky.money/subgraphs/name/jetstreamgg/sky-subgraph-mainnet', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query }),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`Error fetching staking data: ${response.statusText}`);
          }

          const result = await response.json();

          if (result.errors) {
            throw new Error(`GraphQL errors: ${result.errors.map((e: any) => e.message).join(', ')}`);
          }

          if (!result.data) {
            throw new Error('GraphQL response missing data field');
          }

          setStakingData({
            stakingLocks: result.data.stakingLocks || [],
            stakingFrees: result.data.stakingFrees || []
          });

          console.log('Staking data fetched successfully:', {
            locks: result.data.stakingLocks?.length || 0,
            frees: result.data.stakingFrees?.length || 0
          });
        } catch (fetchError) {
          if (fetchError.name === 'AbortError') {
            throw new Error('GraphQL request timed out');
          }
          throw fetchError;
        }
      } catch (err) {
        console.error('Error fetching staking data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
        // Continue with empty data rather than failing completely
        setStakingData({
          stakingLocks: [],
          stakingFrees: []
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStakingData();
  }, [address]);

  return {
    ...stakingData,
    isLoading,
    error
  };
};
