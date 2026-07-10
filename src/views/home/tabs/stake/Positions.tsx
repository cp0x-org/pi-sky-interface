import { FC, useEffect, useState } from 'react';
import Card from '@mui/material/Card';
import { getTokens, getCp0xDelegateName, isCp0xDelegate } from 'config/index';
import { useDelegateData } from 'hooks/useDelegateData';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { useConfigChainId } from 'hooks/useConfigChainId';
import { ReactComponent as SkyLogo } from 'assets/images/sky/ethereum/sky.svg';
import { Chip, Divider, Alert, IconButton, Paper, Button, Tooltip } from '@mui/material';
import ExternalLink from 'components/ExternalLink';
import LoadingIndicator from 'components/LoadingIndicator';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { encodeFunctionData, formatEther } from 'viem';
import { lockStakeContractConfig } from 'config/abi/LockStackeEngine';
import { useStakingPositions } from 'hooks/useStakingPositions';
import { ethers } from 'ethers';
import { useSkyStakingApr } from 'hooks/useSkyStakingApr';
import useStakingTvl from 'hooks/useStakingTvl';
import { formatShortUSDS, formatSkyPrice, formatUSDS } from 'utils/sky';
import { useSuppliersByUrns } from 'hooks/useSuppliersByUrns';
import { styled } from '@mui/material/styles';
import { StakingPosition } from 'types/staking';
import useSkyPrice from 'hooks/useSkyPrice';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { dispatchError, dispatchSuccess, dispatchWarning } from 'utils/snackbar';
import { useDelegateStake } from 'hooks/useDelegateStake';
import { VoteDelegate } from 'config/abi/VoteDelegate';
import { usdsContractConfig } from 'config/abi/Usds';

interface PositionsProps {
  stakeData?: {
    amount: string;
    rewardAddress: string;
    delegatorAddress: string;
  };
  onEditPosition?: (position: StakingPosition) => void;
}
import { SkyContracts } from 'config/index';
import MenuItem from '@mui/material/MenuItem';
import { StyledSelect } from 'components/StyledSelect';
import { SelectChangeEvent } from '@mui/material/Select';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

const PositionCard = styled(Card)(({ theme }) => ({
  ...theme.typography.body2,
  borderRadius: 2,
  height: '100%',
  padding: theme.spacing(1),
  color: theme.palette.text.primary,
  cursor: 'pointer',
  transition: 'transform 0.2s, box-shadow 0.2s',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[4]
  }
}));

const Positions: FC<PositionsProps> = ({ onEditPosition }) => {
  const { config: skyConfig } = useConfigChainId();
  const { address } = useAccount();
  const { positions, isLoading: positionsLoading, error: positionsError, refetch: refetchPositions } = useStakingPositions();
  const { delegates, isLoading: delegatesLoading, error: delegatesError } = useDelegateData();
  const { apr } = useSkyStakingApr();
  const tokens = getTokens();
  const { totalDelegators, totalPositions } = useSuppliersByUrns();
  const { skyPrice } = useSkyPrice();
  const { stakeAmount: delegateStakeAmount, isDelegate, delegateAddress } = useDelegateStake();
  const { tvl, totalSky } = useStakingTvl();
  const isLoading = positionsLoading || delegatesLoading;
  const error = positionsError || delegatesError;
  // const [newReward, setNewReward] = useState<string>('');
  const [oldReward, setOldReward] = useState<Record<string, boolean>>({});
  const [positionRewards, setPositionRewards] = useState<Record<string, string>>({});
  // const [oldReward, setOldReward] = useState < Record<string, string>>({});
  // State for tracking operations
  const [withdrawing, setWithdrawing] = useState<Record<string, boolean>>({});
  const [claiming, setClaiming] = useState<Record<string, boolean>>({});
  const [changingReward, setChangingReward] = useState<boolean>(false);
  const [operationType, setOperationType] = useState<'withdraw' | 'claim' | 'selectFarm' | null>(null);

  // Contract interaction
  const { writeContract, isPending, isError, error: contractError, data: txHash } = useWriteContract();
  const {
    isSuccess: isTxConfirmed,
    isError: isTxConfirmError,
    error: txConfirmError
  } = useWaitForTransactionReceipt({
    hash: txHash,
    query: { enabled: !!txHash }
  });

  // Get user balance
  const { data: userBalance } = useReadContract({
    ...usdsContractConfig,
    address: skyConfig.contracts.SKY,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address
    }
  });

  useEffect(() => {
    if (!positions?.length) return;

    const posRewards: Record<string, string> = {};

    positions.map((pos) => {
      posRewards[pos.indexPosition] = pos.defaultRewardId.toLowerCase();
    });

    setPositionRewards(posRewards);
  }, [positions]);

  const handleRewardChange = (position: StakingPosition, event: SelectChangeEvent<unknown>) => {
    const newTokenAddress = event.target.value;

    if (newTokenAddress == position.defaultRewardId || !newTokenAddress || typeof newTokenAddress !== 'string') {
      return;
    }

    if (newTokenAddress == skyConfig.contracts.USDSStakingRewards) {
      dispatchWarning('USDS rewards were deprecated. Please choose other options.');
      return;
    }

    setChangingReward(true);

    setOldReward((prev: any) => ({ ...prev, [position.indexPosition]: position.defaultRewardId }));
    // positionRewards[position.indexPosition] = newTokenAddress;

    setPositionRewards((prev) => ({
      ...prev,
      [position.indexPosition]: newTokenAddress
    }));

    setOperationType('selectFarm');
    const callData = encodeFunctionData({
      abi: lockStakeContractConfig.abi,
      functionName: 'selectFarm',
      args: [address as `0x{string}`, BigInt(position.indexPosition), newTokenAddress as `0x{string}`, 1]
    });

    // Execute the contract call
    writeContract({
      address: skyConfig.contracts.LockStakeEngine,
      abi: lockStakeContractConfig.abi,
      functionName: 'multicall',
      args: [[callData] as readonly `0x${string}`[]]
    });
  };
  useEffect(() => {
    // полный reset при смене адреса
    setPositionRewards({});
    setOldReward({});
    setWithdrawing({});
    setClaiming({});
    setChangingReward(false);
    setOperationType(null);
  }, [address]);

  // Effect to handle operation success after confirmation
  useEffect(() => {
    if (isTxConfirmed && operationType) {
      console.log('Transaction confirmed for operation:', operationType);

      let message = '';
      if (operationType === 'claim') {
        message = 'Reward claim successfully!';
        refetchPositions();
      } else if (operationType === 'withdraw') {
        message = 'Withdraw successfully!';
      } else {
        setChangingReward(false);
        message = 'Reward was changed successfully!';
      }

      dispatchSuccess(message);

      // Reset operation states
      if (operationType === 'claim') {
        setClaiming({});
      } else if (operationType === 'withdraw') {
        setWithdrawing({});
      }

      // Reset operation type
      setOperationType(null);
    }
  }, [isTxConfirmed, operationType]);

  // Effect to handle operation failure
  useEffect(() => {
    if (((isError && contractError) || (isTxConfirmError && txConfirmError)) && operationType) {
      let operationName = '';
      if (operationType === 'claim') {
        operationName = 'Claim';
      } else if (operationType === 'withdraw') {
        operationName = 'Withdraw';
      } else {
        operationName = 'Select Reward';
        setChangingReward(false);

        positions.map((pos) => {
          if (oldReward[pos.indexPosition] != undefined && positionRewards[pos.indexPosition] != undefined) {
            positionRewards[pos.indexPosition] = String(oldReward[pos.indexPosition]); // set previous reward token
          }
        });
      }

      const errorMsg = txConfirmError?.message || 'Unknown error';

      dispatchError(`${operationName} error: ${errorMsg}`);

      // Reset operation states
      if (operationType === 'claim') {
        setClaiming({});
      } else if (operationType === 'withdraw') {
        setWithdrawing({});
      }

      // Reset operation type
      setOperationType(null);
    }
  }, [isError, contractError, isTxConfirmError, txConfirmError, operationType]);

  // Format delegated address for display
  const shortenAddress = (address: string): string => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const handleWithdraw = (position: StakingPosition) => {
    if (!address || !position.indexPosition || !position.wad) {
      console.error('Missing required data for withdrawal');
      dispatchError('Missing required data for withdrawal');
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
        args: [address, BigInt(position.indexPosition), address, BigInt(position.wad)]
      });

      // Execute the contract call
      writeContract({
        address: skyConfig.contracts.LockStakeEngine,
        abi: lockStakeContractConfig.abi,
        functionName: 'multicall',
        args: [[callData] as readonly `0x${string}`[]]
      });

      console.log('Withdraw initiated for position', position.indexPosition);
    } catch (error) {
      console.error('Error preparing withdraw transaction:', error);
      setWithdrawing((prev) => ({ ...prev, [position.indexPosition]: false }));
      dispatchError(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setOperationType(null);
    }
  };

  const handleSelfWithdraw = (amount: string) => {
    if (!address || !amount) {
      console.error('Missing required data for withdrawal');
      dispatchError('Missing required data for withdrawal');
      return;
    }

    try {
      // Set operation type
      setOperationType('withdraw');

      // Mark this position as withdrawing
      setWithdrawing((prev) => ({ ...prev, ['delegate']: true }));

      const biginAmount = BigInt(amount);
      // Execute the contract call
      writeContract({
        address: delegateAddress as `0x${string}`,
        abi: VoteDelegate.abi,
        functionName: 'free',
        args: [biginAmount]
      });

      console.log('Withdraw initiated for delegate position');
    } catch (error) {
      console.error('Error preparing withdraw transaction:', error);
      setWithdrawing((prev) => ({ ...prev, ['delegate']: false }));
      dispatchError(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setOperationType(null);
    }
  };

  const handleClaim = (position: StakingPosition, rewardAddress: string) => {
    if (!address || !position.indexPosition) {
      console.error('Missing required data for claiming rewards');
      dispatchError('Missing required data for claiming rewards');
      return;
    }

    try {
      // Set operation type
      setOperationType('claim');

      console.log('OPERATION TYPE');
      console.log(operationType);

      // Mark this position as claiming
      setClaiming((prev) => ({ ...prev, [position.indexPosition]: true }));

      // Execute the contract call for claiming rewards
      writeContract({
        address: skyConfig.contracts.LockStakeEngine,
        abi: lockStakeContractConfig.abi,
        functionName: 'getReward',
        args: [address, BigInt(position.indexPosition), rewardAddress as `0x{string}`, address]
      });

      console.log('Claim initiated for position', position.indexPosition);
    } catch (error) {
      console.error('Error preparing claim transaction:', error);
      setClaiming((prev) => ({ ...prev, [position.indexPosition]: false }));
      dispatchError(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setOperationType(null);
    }
  };

  // Using dispatchSuccess/dispatchError instead of snackbar

  if (isLoading) {
    return (
      <Box sx={{ width: '100%', my: 4 }}>
        <LoadingIndicator label="Loading staking and delegate data..." />
      </Box>
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

        {skyPrice !== null && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body1">Sky Price</Typography>
              <Tooltip title="The current market price of SKY token based on Uniswap V2 pool data" arrow>
                <IconButton size="small" aria-label="About Sky Price" sx={{ ml: 0.5, p: 0.25 }}>
                  <HelpOutlineIcon sx={{ fontSize: '1rem' }} />
                </IconButton>
              </Tooltip>
              <Typography variant="body1">:</Typography>
            </Box>

            <Typography variant="h6" color="primary">
              ~{formatSkyPrice(skyPrice)} USD
            </Typography>
          </Box>
        )}

        {apr !== null && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
            <Typography variant="body1">Current APR (SKY):</Typography>
            <Typography variant="h6" color="primary">
              ~{apr.toFixed(2)}%
            </Typography>
          </Box>
        )}

        {/*{aprSpk !== null && (*/}
        {/*  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>*/}
        {/*    <Typography variant="body1">Current APR (SPK):</Typography>*/}
        {/*    <Typography variant="h6" color="primary">*/}
        {/*      ~{aprSpk.toFixed(2)}%*/}
        {/*    </Typography>*/}
        {/*  </Box>*/}
        {/*)}*/}

        {totalDelegators !== null && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
            <Typography variant="body1">Total Unique Suppliers:</Typography>
            <Typography variant="h6" color="primary">
              {totalDelegators}
            </Typography>
          </Box>
        )}

        {totalDelegators !== null && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
            <Typography variant="body1">Total Staking Positions:</Typography>
            <Typography variant="h6" color="primary">
              {totalPositions}
            </Typography>
          </Box>
        )}

        {totalSky !== null && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
            <Typography variant="body1">Total SKY Staked:</Typography>
            <Typography variant="h6" color="primary">
              {formatShortUSDS(totalSky)}
            </Typography>
          </Box>
        )}

        {tvl !== null && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
            <Typography variant="body1">TVL:</Typography>
            <Typography variant="h6" color="primary">
              {formatShortUSDS(tvl)} USDS
            </Typography>
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
          <Typography variant="body1">Your Total Staked Amount:</Typography>
          <Typography variant="h6" color="primary">
            {formatUSDS(totalStaked)} SKY
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
          <Typography variant="body1">Your Number of Positions:</Typography>
          <Typography variant="h6" color="primary">
            {positions.length}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
          <Typography variant="body1">Your SKY Balance:</Typography>
          <Typography variant="h6" color="primary">
            {userBalance ? formatUSDS(formatEther(userBalance)) : '0'}
          </Typography>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Error loading staking position data: {String(error)}
        </Alert>
      )}

      {!address && (
        <Typography variant="h6" sx={{ mt: 2 }}>
          Please connect your wallet to view staking positions
        </Typography>
      )}

      {isLoading && (
        <Box sx={{ width: '100%', my: 4 }}>
          <LoadingIndicator label="Loading staking positions..." />
        </Box>
      )}

      {!isLoading && address && !error && (positions.length > 0 || isDelegate) && (
        <>
          {isDelegate && (
            <Box>
              <Typography variant="h5" gutterBottom>
                Self Delegate Position:
              </Typography>
            </Box>
          )}

          {isDelegate && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              <Box key="-" sx={{ width: { xs: '100%', md: 'calc(50% - 12px)' } }}>
                <PositionCard>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">Delegate Position</Typography>
                      <Chip label="Active" color="success" size="small" />
                    </Box>

                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography color="text.secondary">Locked Amount:</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <SkyLogo width="16" height="16" style={{ marginRight: '8px' }} aria-hidden />
                        <Typography>{formatUSDS(formatEther(BigInt(delegateStakeAmount)))} SKY</Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography color="text.secondary">Delegate:</Typography>

                      <Typography>Your Delegate</Typography>
                    </Box>

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
                          {shortenAddress(delegateAddress as `0x${string}`)}
                        </Typography>
                        <ExternalLink
                          href={`https://etherscan.io/address/${delegateAddress}`}
                          iconOnly
                          iconSize={16}
                          label={`View delegate address ${shortenAddress(delegateAddress as `0x${string}`)} on Etherscan`}
                          sx={{ ml: 1, color: 'primary.main' }}
                        />
                      </Box>
                    </Box>
                    <Divider sx={{ my: 2 }} />

                    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        onClick={() => handleSelfWithdraw(delegateStakeAmount.toString())}
                        disabled={ethers.getBigInt(delegateStakeAmount.toString()) <= 0n}
                      >
                        {withdrawing['delegate'] && !txHash
                          ? 'Preparing transaction...'
                          : withdrawing['delegate'] && txHash && !isTxConfirmed
                            ? 'Confirming transaction...'
                            : 'Withdraw Position'}
                      </Button>
                    </Box>
                  </CardContent>
                </PositionCard>
              </Box>
            </Box>
          )}

          {positions.length > 0 && (
            <Box>
              <Typography variant="h5" gutterBottom>
                Your User Staking Positions:
              </Typography>
            </Box>
          )}

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {positions.length > 0 &&
              Object.keys(positionRewards).length > 0 &&
              positions.map((position) => (
                <Box key={position.indexPosition} sx={{ width: { xs: '100%', md: 'calc(50% - 12px)' } }}>
                  <PositionCard>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">Position #{Number(position.indexPosition) + 1}</Typography>
                        <Chip label="Active" color="success" size="small" />
                      </Box>

                      <Divider sx={{ my: 2 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography color="text.secondary">Locked Amount:</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <SkyLogo width="16" height="16" style={{ marginRight: '8px' }} aria-hidden />
                          <Typography>{formatUSDS(formatEther(BigInt(position.wad)))} SKY</Typography>
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography color="text.secondary">Delegate:</Typography>
                        <Typography>
                          {position.delegateID
                            ? isCp0xDelegate(position.delegateID)
                              ? getCp0xDelegateName(position.delegateID)
                              : delegates.find((d) => d.voteDelegateAddress === position.delegateID)?.name ||
                                `${position.delegateID.slice(0, 6)}...${position.delegateID.slice(-4)}`
                            : '-'}
                        </Typography>
                      </Box>

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
                          {position.delegateID && (
                            <ExternalLink
                              href={`https://etherscan.io/address/${position.delegateID}`}
                              iconOnly
                              iconSize={16}
                              label={`View delegate address ${shortenAddress(position.delegateID)} on Etherscan`}
                              sx={{ ml: 1, color: 'primary.main' }}
                            />
                          )}
                        </Box>
                      </Box>
                      {position.transactions && position.transactions.lockHash && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Typography color="text.secondary">Transaction:</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography
                              variant="body2"
                              sx={{
                                maxWidth: '150px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                            >
                              {shortenAddress(position.transactions.lockHash)}
                            </Typography>
                            <ExternalLink
                              href={`https://etherscan.io/tx/${position.transactions.lockHash}`}
                              iconOnly
                              iconSize={16}
                              label={`View transaction ${shortenAddress(position.transactions.lockHash)} on Etherscan`}
                              sx={{ ml: 1, color: 'primary.main' }}
                            />
                          </Box>
                        </Box>
                      )}

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography color="text.secondary">Reward:</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <StyledSelect
                            value={positionRewards[position.indexPosition]}
                            disabled={changingReward}
                            inputProps={{ 'aria-label': `Reward token for position #${Number(position.indexPosition) + 1}` }}
                            onChange={(event) => handleRewardChange(position, event)}
                            renderValue={(selected) => {
                              const item = tokens.find((o) => {
                                return o.tokenAddress.toLowerCase() === String(selected || '').toLowerCase();
                              });
                              if (!item) {
                                return <></>;
                              }
                              return (
                                <Box display="flex" alignItems="center" gap={1}>
                                  <item.icon width={24} height={24} aria-hidden />
                                  {item?.label}
                                </Box>
                              );
                            }}
                          >
                            {tokens.map((token) => (
                              <MenuItem key={token.tokenAddress} value={token.tokenAddress}>
                                <Box display="flex" alignItems="center" gap={1}>
                                  <token.icon width={24} height={24} aria-hidden />
                                  {token.label}
                                </Box>
                              </MenuItem>
                            ))}
                          </StyledSelect>
                          {positionRewards[position.indexPosition] == SkyContracts.USDSStakingRewards && (
                            <Tooltip title="USDS was deprecated, please choose another reward." arrow>
                              <IconButton size="small" aria-label="USDS reward deprecated" sx={{ color: 'orangered' }}>
                                <InfoOutlinedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </Box>

                      <Divider sx={{ my: 2 }} />

                      <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {onEditPosition && (
                          <Button
                            variant="outlined"
                            color="info"
                            fullWidth
                            onClick={() => onEditPosition(position)}
                            disabled={withdrawing[position.indexPosition] || claiming[position.indexPosition] || isPending}
                          >
                            Edit Position
                          </Button>
                        )}
                        {Object.entries(position.rewards).map(([rewardId, reward]) => {
                          const amount = BigInt(reward.amount);
                          const formatted = Number(formatEther(amount)).toFixed(5);

                          const isClaiming = claiming[position.indexPosition];
                          const isWithdrawing = withdrawing[position.indexPosition];
                          const disabled = isClaiming || isWithdrawing || isPending || amount <= 0n;

                          return (
                            <Button
                              key={rewardId}
                              variant="outlined"
                              color="secondary"
                              fullWidth
                              onClick={() => handleClaim(position, rewardId)}
                              disabled={disabled}
                            >
                              {isClaiming && !txHash
                                ? 'Preparing transaction...'
                                : isClaiming && txHash && !isTxConfirmed
                                  ? 'Confirming transaction...'
                                  : `Claim ${formatted} ${reward.symbol}`}
                            </Button>
                          );
                        })}

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
                          {withdrawing[position.indexPosition] && !txHash
                            ? 'Preparing transaction...'
                            : withdrawing[position.indexPosition] && txHash && !isTxConfirmed
                              ? 'Confirming transaction...'
                              : 'Withdraw Position'}
                        </Button>
                      </Box>
                    </CardContent>
                  </PositionCard>
                </Box>
              ))}
          </Box>
        </>
      )}

      {/* Notifications are now handled by dispatchSuccess/dispatchError */}
    </Box>
  );
};

export default Positions;
