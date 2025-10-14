import { formatEther } from 'viem';
import { useReadContract } from 'wagmi';
import { USDSStakingReward } from 'config/abi/USDSStakingReward';
import { useSkyPrice } from './useSkyPrice';
import { useConfigChainId } from 'hooks/useConfigChainId';
import { SPKStakingReward } from 'config/SPKStakingReward';

/**
 * Custom hook to fetch and process totalSupply from a staking contract
 * @returns Processed totalSupply value
 */
export const useStakingTvl = () => {
  const { config: skyConfig } = useConfigChainId();
  const { skyPrice }: { skyPrice?: number } = useSkyPrice();

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
    address: skyConfig.contracts.USDSStakingRewards,
    functionName: 'totalSupply'
  });

  const {
    data: dataSpk,
    isLoading: isLoadingSpk,
    isError: isErrorSpk
  }: {
    data?: bigint;
    isLoading: boolean;
    isError: boolean;
  } = useReadContract({
    abi: SPKStakingReward.abi,
    address: skyConfig.contracts.SPKStakingRewards,
    functionName: 'totalSupply'
  });

  const processedValue = (() => {
    if (!data) return { tvl: 0, formattedValue: 0 };

    let formattedValue = Number(formatEther(data)); // total SKY in staking with USDS
    let tvl = formattedValue * (skyPrice ?? 0); // TVL in USDS

    if (dataSpk) {
      formattedValue = formattedValue + Number(formatEther(dataSpk)); // add total SKY in staking with SPK
      tvl = formattedValue * (skyPrice ?? 0); // add TVL in SPK
    }

    return { tvl, formattedValue };
  })();

  return {
    tvl: processedValue.tvl,
    totalSky: processedValue.formattedValue,
    isLoading: isLoading && isLoadingSpk,
    isError: isError && isErrorSpk
  };
};

export default useStakingTvl;
