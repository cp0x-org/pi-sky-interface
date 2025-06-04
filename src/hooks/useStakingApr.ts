import { useMemo } from 'react';
import { useReadContracts } from 'wagmi';
import { USDSStakingReward } from 'config/abi/USDSStakingReward';
import { useConfigChainId } from './useConfigChainId';

const SECONDS_IN_YEAR = 31_536_000n;

export function useStakingApr() {
  const { config: skyConfig } = useConfigChainId();

  const { data, isLoading, error } = useReadContracts({
    contracts: [
      {
        address: skyConfig.contracts.USDSStakingRewards,
        abi: USDSStakingReward.abi,
        functionName: 'rewardRate'
      },
      {
        address: skyConfig.contracts.USDSStakingRewards,
        abi: USDSStakingReward.abi,
        functionName: 'rewardsDuration'
      },
      {
        address: skyConfig.contracts.USDSStakingRewards,
        abi: USDSStakingReward.abi,
        functionName: 'totalSupply'
      }
    ]
  });

  const apr = useMemo(() => {
    if (!data || data.some((d) => !d.result)) return null;

    const rewardRate = BigInt(data[0].result as string); // USDS per second (in wei)
    const rewardsDuration = BigInt(data[1].result as string); // not used in this case
    const totalSupply = BigInt(data[2].result as string); // SKY total staked (in wei)

    if (totalSupply === 0n) return 0;

    // Set current SKY price in USDS manually or from an oracle
    const stakingTokenPriceInUSDS = 0.0764;

    // Step 1: Calculate annual reward in USDS (from rewardRate in wei)
    const annualRewardUSDS = rewardRate * SECONDS_IN_YEAR; // still in wei

    // Step 2: Total value of staked SKY in USDS
    const totalStakedValueUSDS = (Number(totalSupply) / 1e18) * stakingTokenPriceInUSDS;

    // Step 3: Calculate APR
    const aprPercent = (Number(annualRewardUSDS) / 1e18 / totalStakedValueUSDS) * 100;

    return aprPercent;
  }, [data]);

  return {
    apr,
    isLoading,
    error
  };
}
