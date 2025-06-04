import { useStakingData } from './useStakingData';
import { useAccount } from 'wagmi';
import { useState, useEffect } from 'react';
import { lockStakeContractConfig } from '../config/abi/LockStackeEngine';
import { useConfigChainId } from './useConfigChainId';
import { simulateContract } from '@wagmi/core';
import { config } from 'wagmi-config';

export interface StakingPositionData {
  positions: Array<{
    indexPosition: string;
    delegateID: string;
    wad: string;
    lockTimestamp: string;
    reward?: bigint;
    transactions: {
      lockHash?: string;
      freeHash?: string;
    };
  }>;
  isLoading: boolean;
  error: string | null;
}

export const useStakingPositions = (): StakingPositionData => {
  const { positions: originalPositions, isLoading: isLoadingPositions, error: positionsError } = useStakingData();
  const { address } = useAccount();
  const [positionsWithRewards, setPositionsWithRewards] = useState<StakingPositionData['positions']>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { config: skyConfig } = useConfigChainId();

  useEffect(() => {
    const fetchRewards = async () => {
      if (!originalPositions?.length || !address) {
        setPositionsWithRewards(originalPositions || []);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const updated = await Promise.all(
          originalPositions.map(async (position) => {
            try {
              // const reward = await simulateGetReward({
              //   address,
              //   indexPosition: BigInt(position.indexPosition),
              //   stakingRewardAddress: skyConfig.contracts.USDSStakingRewards,
              //   contractAddress: skyConfig.contracts.LockStakeEngine,
              //   abi: lockStakeContractConfig.abi
              // });

              const rewardResult = await simulateContract(config, {
                abi: lockStakeContractConfig.abi,
                address: skyConfig.contracts.LockStakeEngine,
                functionName: 'getReward',
                args: [address, position.indexPosition, skyConfig.contracts.USDSStakingRewards, address]
              });

              const reward = BigInt(rewardResult.result);

              return {
                ...position,
                reward
              };
            } catch (e) {
              console.warn(`Ошибка при симуляции getReward для позиции ${position.indexPosition}`, e);
              return {
                ...position,
                reward: 0n
              };
            }
          })
        );

        setPositionsWithRewards(updated);
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
