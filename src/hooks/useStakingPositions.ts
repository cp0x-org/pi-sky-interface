import { useStakingData } from './useStakingData';
import { useAccount } from 'wagmi';
import { useState, useEffect } from 'react';
import { lockStakeContractConfig } from 'config/abi/LockStackeEngine';
import { useConfigChainId } from './useConfigChainId';
import { simulateContract } from '@wagmi/core';
import { useConfig } from 'wagmi';
import { StakingPosition, StakingPositionData } from 'types/staking';

export const useStakingPositions = (): StakingPositionData => {
  const { positions: originalPositions, error: positionsError } = useStakingData();
  const { address } = useAccount();
  const [positionsWithRewards, setPositionsWithRewards] = useState<StakingPosition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { config: skyConfig } = useConfigChainId();
  const config = useConfig();

  useEffect(() => {
    const fetchRewards = async () => {
      if (!originalPositions?.length || !address) {
        // Ensure positions have the reward property even when no fetching is needed
        const positionsWithDefaultReward = (originalPositions || []).map((position) => ({
          ...position,
          reward: { id: position.reward?.id || '' },
          rewardAmount: '0'
        }));
        setPositionsWithRewards(positionsWithDefaultReward);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const updated = await Promise.all(
          originalPositions.map(async (position) => {
            try {
              const rewardResult = await simulateContract(config, {
                abi: lockStakeContractConfig.abi,
                address: skyConfig.contracts.LockStakeEngine,
                functionName: 'getReward',
                args: [address, BigInt(position.indexPosition), skyConfig.contracts.USDSStakingRewards, address]
              });

              console.log('getReward result:', rewardResult);

              const reward = BigInt(rewardResult.result);

              return {
                ...position,
                rewardAmount: reward.toString()
              };
            } catch (e) {
              console.warn(`Error simulating getReward for position ${position.indexPosition}`, e);
              return {
                ...position,
                reward: { id: '' },
                rewardAmount: '0'
              };
            }
          })
        );

        // Sort positions by index
        const sortedPositions = updated.sort((a, b) => Number(a.indexPosition) - Number(b.indexPosition));
        console.log('sortedPositions:', sortedPositions);
        setPositionsWithRewards(sortedPositions);
        setIsLoading(false);
      } catch (e) {
        console.error('Error receiving rewards:', e);
        setError('Error receiving rewards');
        setIsLoading(false);
      }
    };

    fetchRewards();
  }, [originalPositions, address, skyConfig, config]);

  useEffect(() => {
    if (positionsError) {
      setError(positionsError);
    }
  }, [positionsError]);

  return {
    positions: positionsWithRewards,
    isLoading,
    error
  };
};
