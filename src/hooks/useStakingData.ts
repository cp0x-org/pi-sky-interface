import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';

// Helper function to convert wad strings to ethers v6 BigNumber for accurate calculations
const wadToBigNumber = (wad: string): bigint => {
  try {
    return ethers.getBigInt(wad);
  } catch (error) {
    console.error('Error converting wad to BigNumber:', error);
    return ethers.getBigInt(0);
  }
};

// Function to calculate positions from locks and frees
const calculatePositions = (stakingLocks: StakingLock[], stakingFrees: StakingFree[], stakingDelegates: any[]): StakingPosition[] => {
  // Group locks and frees by position index
  const positionMap = new Map<
    string,
    {
      locks: StakingLock[];
      frees: StakingFree[];
      delegate?: string;
    }
  >();

  // Add all locks to the map
  stakingLocks.forEach((lock) => {
    const index = lock.index;
    if (!positionMap.has(index)) {
      positionMap.set(index, { locks: [], frees: [] });
    }
    positionMap.get(index)!.locks.push(lock);
  });

  // Add all frees to the map
  stakingFrees.forEach((free) => {
    const index = free.index;
    if (!positionMap.has(index)) {
      positionMap.set(index, { locks: [], frees: [] });
    }
    positionMap.get(index)!.frees.push(free);
  });

  // Add delegate information
  stakingDelegates.forEach((delegate) => {
    const index = delegate.index;
    if (positionMap.has(index)) {
      positionMap.get(index)!.delegate = delegate.voteDelegate?.id || '';
    }
  });

  // Convert map to array of StakingPosition objects
  return Array.from(positionMap.entries())
    .map(([indexPosition, data]) => {
      // Calculate total locked amount
      const totalLocked = data.locks.reduce((sum, lock) => sum + wadToBigNumber(lock.wad), ethers.getBigInt(0));

      // Calculate total freed amount
      const totalFreed = data.frees.reduce((sum, free) => sum + wadToBigNumber(free.wad), ethers.getBigInt(0));

      // Calculate net staked amount (locked - freed)
      const netStaked = totalLocked - totalFreed;

      // Find the most recent lock transaction
      const mostRecentLock = data.locks.reduce(
        (latest, current) => (!latest || new Date(current.blockTimestamp) > new Date(latest.blockTimestamp) ? current : latest),
        undefined as StakingLock | undefined
      );

      // Find the most recent free transaction
      const mostRecentFree = data.frees.reduce(
        (latest, current) => (!latest || new Date(current.blockTimestamp) > new Date(latest.blockTimestamp) ? current : latest),
        undefined as StakingFree | undefined
      );

      return {
        indexPosition,
        delegateID: data.delegate || '', // Use delegate ID if available
        wad: netStaked.toString(), // Convert BigNumber back to string
        lockTimestamp: mostRecentLock?.blockTimestamp || '',
        transactions: {
          lockHash: mostRecentLock?.transactionHash,
          freeHash: mostRecentFree?.transactionHash
        }
      };
    })
    .filter((position) => {
      // Allow positions with zero or positive balance, filter out only negative balance
      const wadBN = ethers.getBigInt(position.wad);
      return wadBN >= 0n;
    });
};

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

export interface StakingPosition {
  indexPosition: string;
  delegateID: string; // hash
  wad: string; // amount of tokens staked (difference between stakingLocks and stakingFrees)
  lockTimestamp: string;
  transactions: {
    lockHash?: string;
    freeHash?: string;
  };
}

export interface StakingData {
  stakingLocks: StakingLock[];
  stakingFrees: StakingFree[];
  positions: StakingPosition[]; // Array of calculated positions
  isLoading: boolean;
  error: string | null;
}

export const useStakingData = (): StakingData => {
  const { address } = useAccount();
  const [stakingData, setStakingData] = useState<{
    stakingLocks: StakingLock[];
    stakingFrees: StakingFree[];
    positions: StakingPosition[];
  }>({
    stakingLocks: [],
    stakingFrees: [],
    positions: []
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
            stakingOpens(where: {owner: "${address}"}) {
              index
              blockTimestamp
              transactionHash
            }
            stakingSelectVoteDelegates(where: { urn_: {owner: "${address}"}}) {
              index
              voteDelegate {
                id
              }
              blockTimestamp
              transactionHash
            }
            stakingSelectRewards(where: { urn_: {owner: "${address}"}}) {
              index
              reward {
                id
              }
              blockTimestamp
              transactionHash
            }
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
            stakingDraws(where: { urn_: {owner: "${address}"}}) {
              index
              wad
              blockTimestamp
              transactionHash
            }
            stakingWipes(where: { urn_: {owner: "${address}"}}) {
              index
              wad
              blockTimestamp
              transactionHash
            }
            stakingGetRewards(where: { urn_: {owner: "${address}"}}) {
              index
              reward
              amt
              blockTimestamp
              transactionHash
            }
            stakingOnKicks(where: { urn_: {owner: "${address}"}}) {
              id
              wad
              blockTimestamp
              transactionHash
              urn {
                id
              }
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

          const stakingLocks = result.data.stakingLocks || [];
          const stakingFrees = result.data.stakingFrees || [];

          // Calculate positions from locks and frees
          const positions = calculatePositions(stakingLocks, stakingFrees, result.data.stakingSelectVoteDelegates || []);

          setStakingData({
            stakingLocks,
            stakingFrees,
            positions
          });

          console.log('Staking data fetched successfully:', {
            locks: stakingLocks.length || 0,
            frees: stakingFrees.length || 0,
            positions: positions.length || 0
          });
        } catch (fetchError: any) {
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
          stakingFrees: [],
          positions: []
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

// Note: Don't forget to add ethers dependency if not already installed:
// yarn add ethers
