import { formatEther } from 'viem';
import { useReadContract } from 'wagmi';
import { USDSStakingReward } from 'config/abi/USDSStakingReward';
import { useSkyPrice } from './useSkyPrice';

/**
 * Custom hook to fetch and process totalSupply from a staking contract
 * @param contractAddress - Address of the staking contract
 * @returns Processed totalSupply value
 */
export const useStakingTvl = (contractAddress: `0x${string}`) => {
  const {
    data,
    isLoading,
    isError
  }: {
    data?: bigint;
    isLoading: boolean;
    isError: boolean;
  } = useReadContract({
    abi: USDSStakingReward.abi,
    address: contractAddress,
    functionName: 'totalSupply'
  });

  const { skyPrice }: { skyPrice?: number } = useSkyPrice();

  const processedValue = (() => {
    if (!data) return { tvl: 0, formattedValue: 0 };

    const formattedValue = Number(formatEther(data)); // total SKY in staking
    const tvl = formattedValue * (skyPrice ?? 0); // TVL in USDS

    return { tvl, formattedValue };
  })();

  return {
    tvl: processedValue.tvl,
    totalSky: processedValue.formattedValue,
    isLoading,
    isError
  };
};

export default useStakingTvl;
