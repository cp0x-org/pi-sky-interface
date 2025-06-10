import { useReadContract } from 'wagmi';
import { univ2UsdsSkyPoolContractConfig } from 'config/abi/UniswapV2';
import { apiConfig } from 'config/index';
import { useMemo } from 'react';
import { formatUnits } from 'viem';

/**
 * A hook that calculates the price of SKY token based on Uniswap V2 pool reserves
 *
 * @returns {object} An object containing the SKY price, loading state, and error
 */
export function useSkyPrice() {
  const { data, isLoading, isError, error } = useReadContract({
    ...univ2UsdsSkyPoolContractConfig,
    address: apiConfig.uniswapV2UsdsSkyPool,
    functionName: 'getReserves'
  });

  const skyPrice = useMemo(() => {
    if (!data) return undefined;

    const [reserve0, reserve1] = data;

    // Assume: token0 is SKY (18 decimals), token1 is USDS (6 decimals)
    const reserve0Formatted = Number(formatUnits(reserve0, 18)); // SKY
    const reserve1Formatted = Number(formatUnits(reserve1, 18)); // USDS

    if (reserve0Formatted === 0) return undefined;

    return reserve1Formatted / reserve0Formatted;
  }, [data]);

  return {
    skyPrice,
    isLoading,
    isError,
    error
  };
}

export default useSkyPrice;
