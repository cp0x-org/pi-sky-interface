import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useConfigChainId } from './useConfigChainId';
import { useStakingData } from './useStakingData';

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
  positionIndex?: string; // Added position index
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

  // Get staking data, but don't let it block our component if it fails
  const { stakingLocks, isLoading: isStakingLoading, error: stakingError } = useStakingData();

  const [delegationData, setDelegationData] = useState<{
    delegatedTo: DelegatedToItem[];
    totalDelegated: number;
  }>({
    delegatedTo: [],
    totalDelegated: 0
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [stakingDataMerged, setStakingDataMerged] = useState<boolean>(false);

  // First, fetch delegation data
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
        setStakingDataMerged(false); // Reset flag as we have new delegation data
      } catch (err) {
        console.error('Error fetching delegation data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDelegationData();
  }, [address]);

  // Then, when staking data changes, try to merge it with delegation data
  useEffect(() => {
    // Skip if we're still loading delegation data or if staking data is still loading
    if (isLoading || !delegationData.delegatedTo || stakingDataMerged) {
      return;
    }

    // Only attempt to merge if we have valid staking locks and no errors
    if (stakingLocks && stakingLocks.length > 0 && !stakingError) {
      console.log('STAKING LOCKS: ', stakingLocks);
      try {
        const enhancedDelegatedTo = delegationData.delegatedTo.map((item: DelegatedToItem) => {
          // Try to find a matching transaction hash in the staking locks
          const latestEvent = item.events.reduce((latest, current) => {
            return new Date(current.blockTimestamp) > new Date(latest.blockTimestamp) ? current : latest;
          });

          const matchingLock = stakingLocks.find(
            (lock) => lock.transactionHash && latestEvent.hash && lock.transactionHash.toLowerCase() === latestEvent.hash.toLowerCase()
          );

          if (matchingLock) {
            console.log('MATCHING LOCK FOUND FOR LATEST EVENT:', matchingLock.index);
            return {
              ...item,
              positionIndex: Number(matchingLock.index) // <- если нужно в виде числа
            };
          } else {
            console.warn('NO MATCHING LOCK FOUND FOR LATEST EVENT:', latestEvent.hash);
            return item;
          }

          return item;
        });

        setDelegationData((prev) => ({
          ...prev,
          delegatedTo: enhancedDelegatedTo
        }));

        setStakingDataMerged(true);
        console.log('Successfully merged staking data with delegation data');
      } catch (err) {
        // Log error but don't fail the component - just use the original delegation data
        console.error('Error merging staking data:', err);
      }
    } else if (stakingError) {
      // Log the staking error but don't block the component
      console.warn('Staking data error, using delegation data without position indexes:', stakingError);
    }
  }, [stakingLocks, stakingError, delegationData.delegatedTo, isLoading, stakingDataMerged]);

  // Only show loading if the main delegation data is loading
  // Don't block on staking data loading - it's enhancement data only

  // Only report the delegation data error, not the staking error
  // since the app can work without staking data

  return {
    ...delegationData,
    isLoading,
    error
  };
};
