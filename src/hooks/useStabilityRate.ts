import { useMemo } from 'react';
import { ethers } from 'ethers';
import { useAccount, useReadContract } from 'wagmi';
import { useConfigChainId } from './useConfigChainId';
import { lockStakeContractConfig } from 'config/abi/LockStackeEngine';
const SECONDS_IN_YEAR = 365 * 24 * 60 * 60;

// Define the ABI for the jug contract
const jugAbi = [
  {
    name: 'ilks',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'bytes32' }],
    outputs: [
      { name: 'duty', type: 'uint256' },
      { name: 'rho', type: 'uint256' }
    ]
  }
] as const;

interface StabilityRateResult {
  rate: number | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to fetch and calculate the stability rate percentage
 *
 * @returns {StabilityRateResult} An object containing:
 *   - rate: The calculated stability rate as a number (e.g. 18.4), or null if not available
 *   - isLoading: Boolean indicating if the data is still loading
 *   - error: Error message if any, or null
 */
export const useStabilityRate = (): StabilityRateResult => {
  const { config: skyConfig } = useConfigChainId();
  const { isConnected } = useAccount();

  // Get the jug address from the LockStakeEngine contract
  const {
    data: jugAddress,
    isLoading: isJugLoading,
    error: jugError
  } = useReadContract({
    address: skyConfig.contracts.LockStakeEngine,
    abi: lockStakeContractConfig.abi,
    functionName: 'jug',
    query: {
      enabled: isConnected
    }
  });

  console.log('Jug address:', jugAddress);
  // Get the ilk from the LockStakeEngine contract
  const {
    data: ilk,
    isLoading: isIlkLoading,
    error: ilkError
  } = useReadContract({
    address: skyConfig.contracts.LockStakeEngine,
    abi: lockStakeContractConfig.abi,
    functionName: 'ilk',
    query: {
      enabled: isConnected
    }
  });

  // Get the duty from the jug contract once we have the jugAddress and ilk
  console.log('Debug - Contract params:', { jugAddress, ilk });
  const {
    data: ilkData,
    isLoading: isDutyLoading,
    error: dutyError
  } = useReadContract({
    address: jugAddress as `0x${string}` | undefined,
    abi: jugAbi,
    functionName: 'ilks',
    args: ilk ? [ilk] : undefined,
    query: {
      enabled: !!jugAddress && !!ilk
    }
  });

  // Calculate the stability rate percentage
  return useMemo(() => {
    const isLoading = isJugLoading || isIlkLoading || isDutyLoading;
    const error = jugError || ilkError || dutyError;

    if (error) {
      return {
        rate: null,
        isLoading: false,
        error: error.message
      };
    }

    if (isLoading || !ilkData) {
      return {
        rate: null,
        isLoading: true,
        error: null
      };
    }

    try {
      // Extract duty from the contract response
      const duty = ilkData[0];
      console.log('Debug - Duty value:', duty.toString());

      // Convert to ethers BigInt for calculation
      const dutyBigInt = ethers.getBigInt(duty.toString());
      const RAY = ethers.getBigInt(10) ** ethers.getBigInt(27);
      console.log('Debug - Calculation params:', {
        dutyBigInt: dutyBigInt.toString(),
        RAY: RAY.toString()
      });

      // Calculate SRR percentage: ((duty / RAY) - 1) * 100
      const dutyFloat = parseFloat(ethers.formatUnits(dutyBigInt, 27));
      const rateAnnual = Math.pow(dutyFloat, SECONDS_IN_YEAR) - 1;
      const srrPercent = rateAnnual * 100;

      // const srrPercent = (dutyFloat - 1) * 100;
      console.log('Debug - Final calculation:', {
        dutyFloat,
        srrPercent
      });

      return {
        rate: srrPercent,
        isLoading: false,
        error: null
      };
    } catch (e: any) {
      console.error('Error calculating stability rate:', e);
      return {
        rate: null,
        isLoading: false,
        error: e.message || 'Failed to calculate rate'
      };
    }
  }, [isJugLoading, isIlkLoading, isDutyLoading, jugError, ilkError, dutyError, ilkData]);
};
