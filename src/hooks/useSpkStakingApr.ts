import { useMemo } from 'react';
import { useReadContracts } from 'wagmi';
import { useConfigChainId } from './useConfigChainId';
import { useSkyPrice } from './useSkyPrice';
import { SPKStakingReward } from 'config/SPKStakingReward';
const SECONDS_IN_YEAR = 31_536_000n;

export function useSpkStakingApr() {
  const { config: skyConfig } = useConfigChainId();

  const { skyPrice } = useSkyPrice();

  const { data, isLoading, error } = useReadContracts({
    contracts: [
      {
        address: skyConfig.contracts.SPKStakingRewards,
        abi: SPKStakingReward.abi,
        functionName: 'rewardRate'
      },
      {
        address: skyConfig.contracts.SPKStakingRewards,
        abi: SPKStakingReward.abi,
        functionName: 'rewardsDuration'
      },
      {
        address: skyConfig.contracts.SPKStakingRewards,
        abi: SPKStakingReward.abi,
        functionName: 'totalSupply'
      }
    ]
  });

  const apr = useMemo(() => {
    if (!data || data.some((d) => !d.result)) return null;

    const rewardRate = data[0].result ? BigInt(data[0].result.toString()) : 0n; // Spk per second (in wei)
    // const rewardsDuration = data[1].result ? BigInt(data[1].result.toString()) : 0n; // not used in this case
    const totalSupply = data[2].result ? BigInt(data[2].result.toString()) : 0n; // SKY total staked (in wei)

    if (totalSupply === 0n) return 0;

    // Set current SKY price in SPK manually or from an oracle
    const stakingTokenPriceInSpk = skyPrice ? skyPrice : 0;

    // Step 1: Calculate annual reward in SPK (from rewardRate in wei)
    const annualRewardSpk = rewardRate * SECONDS_IN_YEAR; // still in wei

    // Step 2: Total value of staked SKY in SPK
    const totalStakedValueSpk = (Number(totalSupply) / 1e18) * stakingTokenPriceInSpk;
    let aprPercent;
    if (totalStakedValueSpk) {
      // Step 3: Calculate APR
      aprPercent = (Number(annualRewardSpk) / 1e18 / totalStakedValueSpk) * 100;
    } else {
      aprPercent = 0;
    }

    return aprPercent;
  }, [data, skyPrice]);

  return {
    apr,
    isLoading,
    error
  };
}
