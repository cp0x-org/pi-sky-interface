import { useMemo } from 'react';
import { useReadContracts } from 'wagmi';
import { USDSStakingReward } from 'config/abi/USDSStakingReward';
import { useConfigChainId } from './useConfigChainId';
import { apiConfig } from '../config/index';

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

    const rewardRate = data[0].result ? BigInt(data[0].result.toString()) : 0n; // USDS per second (in wei)
    // const rewardsDuration = data[1].result ? BigInt(data[1].result.toString()) : 0n; // not used in this case
    const totalSupply = data[2].result ? BigInt(data[2].result.toString()) : 0n; // SKY total staked (in wei)

    if (totalSupply === 0n) return 0;

    // Set current SKY price in USDS manually or from an oracle
    const stakingTokenPriceInUSDS = apiConfig.SKY_PRICE;

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
