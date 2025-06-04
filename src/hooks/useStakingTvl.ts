import { formatEther } from 'viem';
import { useReadContract } from 'wagmi';
import { USDSStakingReward } from 'config/abi/USDSStakingReward';
import { apiConfig } from '../config/index';

/**
 * Custom hook to fetch and process totalSupply from a staking contract
 * @param contractAddress - Address of the staking contract
 * @returns Processed totalSupply value
 */
export const useStakingTvl = (contractAddress: `0x${string}`) => {
  const { data, isLoading, isError } = useReadContract({
    abi: USDSStakingReward.abi,
    address: contractAddress,
    functionName: 'totalSupply'
  });

  const processedValue = (() => {
    if (!data) return 0;

    // Convert from BigInt to string, removing 18 decimal places
    const formattedValue = Number(formatEther(data));

    // Divide by 0.0764 as requested
    return formattedValue * apiConfig.SKY_PRICE;
  })();

  return {
    tvl: processedValue,
    isLoading,
    isError
  };
};

export default useStakingTvl;
