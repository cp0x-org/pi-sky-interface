import { StakingPositionRaw, useStakingData } from './useStakingData';
import { useAccount } from 'wagmi';
import { useState, useEffect } from 'react';
import { lockStakeContractConfig } from 'config/abi/LockStackeEngine';
import { useConfigChainId } from './useConfigChainId';
import { readContract, simulateContract } from '@wagmi/core';
import { useConfig } from 'wagmi';
import { StakingPosition, StakingPositionData } from 'types/staking';

function transformPosition(raw: StakingPositionRaw): StakingPosition {
  return {
    indexPosition: raw.indexPosition,
    delegateID: raw.delegateID,
    wad: raw.wad,
    lockTimestamp: raw.lockTimestamp,
    defaultRewardId: '',
    rewards: {},
    transactions: raw.transactions
  };
}

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
      console.log('Fetching rewards for positions:', originalPositions);
      if (!originalPositions?.length || !address) {
        console.log('No positions to fetch rewards for');
        // Ensure positions have the reward property even when no fetching is needed
        const positionsWithDefaultReward = (originalPositions || []).map((position) => ({
          ...position,
          rewards: {},
          defaultRewardId: ''
        }));
        setPositionsWithRewards(positionsWithDefaultReward);
        setIsLoading(false);
        return;
      }

      console.log('Fetching rewards for positions:', originalPositions);

      setIsLoading(true);

      try {
        const updated = await Promise.all(
          originalPositions.map(async (rawPosition) => {
            let position: StakingPosition = transformPosition(rawPosition);

            try {
              const rewardUSDSResult = await simulateContract(config, {
                abi: lockStakeContractConfig.abi,
                address: skyConfig.contracts.LockStakeEngine,
                functionName: 'getReward',
                args: [address, BigInt(position.indexPosition), skyConfig.contracts.USDSStakingRewards, address] // !!!
              });

              const rewardSPKResult = await simulateContract(config, {
                abi: lockStakeContractConfig.abi,
                address: skyConfig.contracts.LockStakeEngine,
                functionName: 'getReward',
                args: [address, BigInt(position.indexPosition), skyConfig.contracts.SPKStakingRewards, address]
              });

              const rewardSKYResult = await simulateContract(config, {
                abi: lockStakeContractConfig.abi,
                address: skyConfig.contracts.LockStakeEngine,
                functionName: 'getReward',
                args: [address, BigInt(position.indexPosition), skyConfig.contracts.SKYStakingRewards, address]
              });
              const rewardUSDS = BigInt(rewardUSDSResult.result);
              const rewardSPK = BigInt(rewardSPKResult.result);
              const rewardSKY = BigInt(rewardSKYResult.result);

              const urnAddress = await readContract(config, {
                abi: lockStakeContractConfig.abi,
                address: skyConfig.contracts.LockStakeEngine,
                functionName: 'ownerUrns',
                args: [address, BigInt(position.indexPosition)]
              });

              const farmAddress = await readContract(config, {
                abi: lockStakeContractConfig.abi,
                address: skyConfig.contracts.LockStakeEngine,
                functionName: 'urnFarms',
                args: [urnAddress]
              });

              if (rewardUSDS > 0n) {
                position.rewards[skyConfig.contracts.USDSStakingRewards] = {
                  amount: rewardUSDS.toString(),
                  id: skyConfig.contracts.USDSStakingRewards,
                  symbol: 'USDS'
                };
              }

              if (rewardSPK > 0n) {
                position.rewards[skyConfig.contracts.SPKStakingRewards] = {
                  amount: rewardSPK.toString(),
                  id: skyConfig.contracts.SPKStakingRewards,
                  symbol: 'SPK'
                };
              }

              if (rewardSKY > 0n) {
                position.rewards[skyConfig.contracts.SKYStakingRewards] = {
                  amount: rewardSKY.toString(),
                  id: skyConfig.contracts.SKYStakingRewards,
                  symbol: 'SKY'
                };
              }

              return {
                ...position,
                defaultRewardId: farmAddress
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
