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
          reward: position.reward || '0'
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
                reward: reward.toString()
              };
            } catch (e) {
              console.warn(`Ошибка при симуляции getReward для позиции ${position.indexPosition}`, e);
              return {
                ...position,
                reward: '0'
              };
            }
          })
        );

        // Convert bigint rewards to strings to match the StakingPosition interface
        const sortedPositions = updated
          .map((position) => ({
            ...position,
            reward: position.reward.toString() // Convert bigint to string
          }))
          .sort((a, b) => Number(a.indexPosition) - Number(b.indexPosition));

        setPositionsWithRewards(sortedPositions);
        setIsLoading(false);
      } catch (e) {
        console.error('Ошибка при получении наград:', e);
        setError('Ошибка при получении наград');
        setIsLoading(false);
      }
    };

    fetchRewards();
  }, [originalPositions, address, skyConfig]);

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
