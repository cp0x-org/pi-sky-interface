import React, { useMemo } from 'react';
import { Box, Typography, CircularProgress, Paper } from '@mui/material';
import { ethers } from 'ethers';
import { useAccount, useReadContract } from 'wagmi';
import { useConfigChainId } from 'hooks/useConfigChainId';
import { lockStakeContractConfig } from 'config/abi/LockStackeEngine';

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

const SECONDS_IN_YEAR = 365 * 24 * 60 * 60;

const CurrentRate: React.FC = () => {
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

  // Process the stability rate calculation
  const { srr, loading, error } = useMemo(() => {
    const isLoading = isJugLoading || isIlkLoading || isDutyLoading;
    const error = jugError || ilkError || dutyError;

    if (error) {
      return { srr: null, loading: false, error: error.message };
    }

    if (isLoading || !ilkData) {
      return { srr: null, loading: true, error: null };
    }

    try {
      // Extract duty from the contract response
      const duty = ilkData[0];

      // Convert to ethers BigInt for calculation
      const dutyBigInt = ethers.getBigInt(duty.toString());
      const RAY = ethers.getBigInt(10) ** ethers.getBigInt(27);

      // Calculate SRR percentage: ((duty / RAY) - 1) * 100
      const dutyFloat = Number(dutyBigInt) / Number(RAY);
      const srrPercent = (dutyFloat - 1) * 100;

      return { srr: srrPercent, loading: false, error: null };
    } catch (e: any) {
      console.error('Error calculating stability rate:', e);
      return { srr: null, loading: false, error: e.message || 'Failed to calculate rate' };
    }
  }, [isJugLoading, isIlkLoading, isDutyLoading, jugError, ilkError, dutyError, ilkData]);

  return (
    <Paper elevation={3} sx={{ p: 3, borderRadius: 2, bgcolor: 'background.paper', width: 'fit-content' }}>
      <Typography variant="h6" gutterBottom>
        Stability Rate (SRR)
      </Typography>

      {loading && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CircularProgress size={20} />
          <Typography variant="body2">Loading rate data...</Typography>
        </Box>
      )}

      {error && !loading && (
        <Typography color="error" variant="body2">
          Error: {error}
        </Typography>
      )}

      {srr !== null && !loading && (
        <Typography color="success.main" variant="h5" fontWeight="bold">
          {srr.toFixed(2)}% / year
        </Typography>
      )}
    </Paper>
  );
};

export default CurrentRate;
