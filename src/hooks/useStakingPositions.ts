import { useQuery } from '@tanstack/react-query';
import { StakingPositionRaw, useStakingData } from './useStakingData';
import { useAccount } from 'wagmi';
import { lockStakeContractConfig } from 'config/abi/LockStackeEngine';
import { useConfigChainId } from './useConfigChainId';
import { readContract, simulateContract } from '@wagmi/core';
import { useConfig } from 'wagmi';
import { StakingPosition } from 'types/staking';

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

export const useStakingPositions = () => {
  const { positions: originalPositions, error: positionsError } = useStakingData();
  const { address } = useAccount();
  const { config: skyConfig } = useConfigChainId();
  const config = useConfig();

  const query = useQuery({
    queryKey: ['staking-positions', address, originalPositions],
    enabled: Boolean(address), // запускать только если есть адрес
    queryFn: async () => {
      if (!originalPositions?.length || !address) {
        return (originalPositions || []).map((p) => ({
          ...transformPosition(p)
        }));
      }

      const updated = await Promise.all(
        originalPositions.map(async (rawPosition) => {
          const position = transformPosition(rawPosition);

          try {
            const [rewardUSDSResult, rewardSPKResult, rewardSKYResult] = await Promise.all([
              simulateContract(config, {
                abi: lockStakeContractConfig.abi,
                address: skyConfig.contracts.LockStakeEngine,
                functionName: 'getReward',
                args: [address, BigInt(position.indexPosition), skyConfig.contracts.USDSStakingRewards, address]
              }),
              simulateContract(config, {
                abi: lockStakeContractConfig.abi,
                address: skyConfig.contracts.LockStakeEngine,
                functionName: 'getReward',
                args: [address, BigInt(position.indexPosition), skyConfig.contracts.SPKStakingRewards, address]
              }),
              simulateContract(config, {
                abi: lockStakeContractConfig.abi,
                address: skyConfig.contracts.LockStakeEngine,
                functionName: 'getReward',
                args: [address, BigInt(position.indexPosition), skyConfig.contracts.SKYStakingRewards, address]
              })
            ]);

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

            position.defaultRewardId = farmAddress;

            return position;
          } catch (e) {
            console.warn(`Error simulating getReward for position ${position.indexPosition}`, e);
            return {
              ...position,
              rewards: {},
              defaultRewardId: ''
            };
          }
        })
      );

      return updated.sort((a, b) => Number(a.indexPosition) - Number(b.indexPosition));
    }
  });

  return {
    positions: query.data ?? [],
    isLoading: query.isLoading,
    error: positionsError || query.error?.message,
    refetch: query.refetch // ← вот оно!
  };
};
