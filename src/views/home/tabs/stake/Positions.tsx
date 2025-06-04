import { FC, useEffect, useState } from 'react';
import Card from '@mui/material/Card';
import { useDelegateData } from '../../../../hooks/useDelegateData';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { IconExternalLink } from '@tabler/icons-react';
import { useConfigChainId } from '../../../../hooks/useConfigChainId';
import { ReactComponent as SkyLogo } from 'assets/images/sky/ethereum/sky.svg';
import { Chip, Divider, Alert, CircularProgress, Paper, Button, Snackbar } from '@mui/material';
import { useAccount, useWriteContract } from 'wagmi';
import { encodeFunctionData, formatEther, parseEther } from 'viem';
import { useStakingData } from '../../../../hooks/useStakingData';
import { lockStakeContractConfig } from 'config/abi/LockStackeEngine';
import { useStakingPositions } from '../../../../hooks/useStakingPositions';
import { ethers } from 'ethers';
import { useStabilityRate } from '../../../../hooks/useStabilityRate';
import { useStakingApr } from '../../../../hooks/useStakingApr';

interface PositionsProps {
  stakeData?: {
    amount: string;
    rewardAddress: string;
    delegatorAddress: string;
  };
}

const formatAmount = (amount: string): string => {
  try {
    // Convert from wei to ETH and format to 4 decimal places
    return Number(formatEther(BigInt(amount))).toFixed(4);
  } catch (error) {
    console.error('Error formatting amount:', error);
    return '0.0000';
  }
};

const Positions: FC<PositionsProps> = ({ stakeData }) => {
  const { config: skyConfig } = useConfigChainId();
  const { address } = useAccount();
  const { positions, isLoading: positionsLoading, error: positionsError } = useStakingPositions();
  const { delegates, isLoading: delegatesLoading, error: delegatesError } = useDelegateData();
  const { rate, isLoading: isStabilityLoading, error: stabilityError } = useStabilityRate();
  const { apr, isLoading: isLoadingApr, error: errorApr } = useStakingApr();

  const isLoading = positionsLoading || delegatesLoading;
  const error = positionsError || delegatesError;

  // State for tracking operations
  const [withdrawing, setWithdrawing] = useState<Record<string, boolean>>({});
  const [claiming, setClaiming] = useState<Record<string, boolean>>({});
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [operationType, setOperationType] = useState<'withdraw' | 'claim' | null>(null);

  // Contract interaction
  const { writeContract, isPending, isSuccess, isError, error: contractError } = useWriteContract();

  // Effect to handle operation success/failure notifications
  useEffect(() => {
    if (isSuccess) {
      const message = operationType === 'claim' ? 'Reward claim successful!' : 'Withdraw successful!';
      setSnackbarMessage(message);
      setSnackbarOpen(true);

      // Reset operation states
      if (operationType === 'claim') {
        setClaiming({});
      } else if (operationType === 'withdraw') {
        setWithdrawing({});
      }
      setOperationType(null);
    } else if (isError && contractError) {
      const operationName = operationType === 'claim' ? 'Claim' : 'Withdraw';
      setSnackbarMessage(`${operationName} error: ${contractError.message}`);
      setSnackbarOpen(true);

      // Reset operation states
      if (operationType === 'claim') {
        setClaiming({});
      } else if (operationType === 'withdraw') {
        setWithdrawing({});
      }
    }
  }, [isSuccess, isError, contractError, operationType]);

  // Format delegated address for display
  const shortenAddress = (address: string): string => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const handleWithdraw = (position: any) => {
    if (!address || !position.indexPosition || !position.wad) {
      console.error('Missing required data for withdrawal');
      setSnackbarMessage('Missing required data for withdrawal');
      setSnackbarOpen(true);
      return;
    }

    try {
      // Set operation type
      setOperationType('withdraw');

      // Mark this position as withdrawing
      setWithdrawing((prev) => ({ ...prev, [position.indexPosition]: true }));

      // Create the function call data for the free operation
      const callData = encodeFunctionData({
        abi: lockStakeContractConfig.abi,
        functionName: 'free',
        args: [address, BigInt(position.indexPosition), address, parseEther(formatAmount(position.wad))]
      });

      // Execute the contract call
      writeContract({
        address: skyConfig.contracts.LockStakeEngine,
        abi: lockStakeContractConfig.abi,
        functionName: 'multicall',
        args: [[callData]]
      });

      console.log('Withdraw initiated for position', position.indexPosition);
    } catch (error) {
      console.error('Error preparing withdraw transaction:', error);
      setWithdrawing((prev) => ({ ...prev, [position.indexPosition]: false }));
      setSnackbarMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setSnackbarOpen(true);
      setOperationType(null);
    }
  };

  const handleClaim = (position: any) => {
    if (!address || !position.indexPosition) {
      console.error('Missing required data for claiming rewards');
      setSnackbarMessage('Missing required data for claiming rewards');
      setSnackbarOpen(true);
      return;
    }

    try {
      // Set operation type
      setOperationType('claim');

      // Mark this position as claiming
      setClaiming((prev) => ({ ...prev, [position.indexPosition]: true }));

      // Execute the contract call for claiming rewards
      writeContract({
        address: skyConfig.contracts.LockStakeEngine,
        abi: lockStakeContractConfig.abi,
        functionName: 'getReward',
        args: [address, BigInt(position.indexPosition), skyConfig.contracts.USDSStakingRewards, address]
      });

      console.log('Claim initiated for position', position.indexPosition);
    } catch (error) {
      console.error('Error preparing claim transaction:', error);
      setClaiming((prev) => ({ ...prev, [position.indexPosition]: false }));
      setSnackbarMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setSnackbarOpen(true);
      setOperationType(null);
    }
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  if (isLoading) {
    return (
      <Box sx={{ width: '100%', my: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ mt: 2 }}>
          Loading staking and delegate data...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Error loading staking position data: {error}
      </Alert>
    );
  }

  if (!address) {
    return (
      <Typography variant="h2" gutterBottom>
        Please connect your wallet to view staking positions
      </Typography>
    );
  }

  if (isLoading) {
    return (
      <Box sx={{ width: '100%', my: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ mt: 2 }}>
          Loading staking position data...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Error loading staking position data: {error}
      </Alert>
    );
  }

  // Always show the summary, even if no positions
  if (!positions || positions.length === 0) {
    return (
      <>
        <Typography variant="h2" gutterBottom>
          Your Staking Summary
        </Typography>
        <Alert severity="info" sx={{ mt: 2 }}>
          No active staking positions found. This could be due to positions with zero balance being filtered out.
        </Alert>
      </>
    );
  }

  // Calculate total staked amount
  const totalStaked = positions.reduce((sum, position) => {
    try {
      return sum + Number(formatEther(BigInt(position.wad)));
    } catch (error) {
      console.error('Error calculating total staked amount:', error);
      return sum;
    }
  }, 0);

  return (
    <Box sx={{ width: '100%', mt: 4 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 2, bgcolor: 'background.paper' }}>
        <Typography variant="h6" gutterBottom>
          Staking Summary
        </Typography>
        <Divider sx={{ mb: 2 }} />
        {apr !== null && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body1">Current APR:</Typography>
            <Typography variant="h6" color="primary">
              ~{apr.toFixed(2)}%
            </Typography>
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
          <Typography variant="body1">Your Total Staked Amount:</Typography>
          <Typography variant="h6" color="primary">
            {totalStaked.toFixed(4)} SKY
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
          <Typography variant="body1">Your Number of Positions:</Typography>
          <Typography variant="h6" color="primary">
            {positions.length}
          </Typography>
        </Box>
      </Paper>

      <Typography variant="h5" gutterBottom>
        Staking Positions
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {positions.length === 0 ? (
          <Box sx={{ width: '100%' }}>
            <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              No Positions
            </Typography>
          </Box>
        ) : (
          positions.map((position, index) => (
            <Box key={position.indexPosition} sx={{ width: { xs: '100%', md: 'calc(50% - 12px)' } }}>
              <Card sx={{ borderRadius: 2, height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Position #{position.indexPosition}</Typography>
                    <Chip
                      // label={ethers.getBigInt(position.wad) > 0n ? 'Active' : 'Zero Balance'}
                      // color={ethers.getBigInt(position.wad) > 0n ? 'success' : 'warning'}
                      label="Active"
                      color="success"
                      size="small"
                    />
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography color="text.secondary">Delegate Address:</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography
                        variant="body2"
                        sx={{
                          maxWidth: '150px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {shortenAddress(position.delegateID)}
                      </Typography>
                      <Box
                        component="a"
                        href={`https://etherscan.io/address/${position.delegateID}`}
                        target="_blank"
                        rel="noreferrer"
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          ml: 1,
                          color: 'primary.main'
                        }}
                      >
                        <IconExternalLink size={16} />
                      </Box>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography color="text.secondary">Locked Amount:</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <SkyLogo width="16" height="16" style={{ marginRight: '8px' }} />
                      <Typography>{formatAmount(position.wad)} SKY</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography color="text.secondary">Delegate:</Typography>

                    <Typography>
                      {delegates.find((d) => d.voteDelegateAddress === position.delegateID)?.name ||
                        `${position.delegateID.substring(0, 6)}...${position.delegateID.substring(position.delegateID.length - 4)}`}
                    </Typography>
                  </Box>

                  {/*<Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>*/}
                  {/*  <Typography color="text.secondary">Position Index:</Typography>*/}
                  {/*  <Typography>#{position.indexPosition}</Typography>*/}
                  {/*</Box>*/}

                  {/*<Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>*/}
                  {/*  <Typography color="text.secondary">Last Updated:</Typography>*/}
                  {/*  <Typography variant="body2">*/}
                  {/*    {position.lockTimestamp ? new Date(position.lockTimestamp).toLocaleDateString() : 'Unknown'}*/}
                  {/*  </Typography>*/}
                  {/*</Box>*/}

                  {position.transactions && position.transactions.lockHash && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography color="text.secondary">Transaction:</Typography>
                      <Box
                        component="a"
                        href={`https://etherscan.io/tx/${position.transactions.lockHash}`}
                        target="_blank"
                        rel="noreferrer"
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          color: 'primary.main',
                          fontSize: '0.875rem'
                        }}
                      >
                        {shortenAddress(position.transactions.lockHash)}
                        <IconExternalLink size={14} style={{ marginLeft: '4px' }} />
                      </Box>
                    </Box>
                  )}

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Button
                      variant="outlined"
                      color="secondary"
                      fullWidth
                      onClick={() => handleClaim(position)}
                      disabled={
                        withdrawing[position.indexPosition] ||
                        claiming[position.indexPosition] ||
                        isPending ||
                        ethers.getBigInt(position.wad) <= 0n
                      }
                    >
                      {claiming[position.indexPosition] ? 'Claiming...' : 'Claim Rewards'}
                    </Button>

                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth
                      onClick={() => handleWithdraw(position)}
                      disabled={
                        withdrawing[position.indexPosition] ||
                        claiming[position.indexPosition] ||
                        isPending ||
                        ethers.getBigInt(position.wad) <= 0n
                      }
                    >
                      {withdrawing[position.indexPosition] ? 'Withdrawing...' : 'Withdraw Position'}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          ))
        )}
      </Box>

      {/* Snackbar for notifications */}
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose} message={snackbarMessage} />
    </Box>
  );
};

export default Positions;
