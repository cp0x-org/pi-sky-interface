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
import { FormattedMessage, useIntl } from 'react-intl';

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
  const intl = useIntl();
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
      dispatchWarning(intl.formatMessage({ id: 'stake.usdsRewardsDeprecated' }));
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
        message = intl.formatMessage({ id: 'tx.rewardClaimSuccess' });
        refetchPositions();
      } else if (operationType === 'withdraw') {
        message = intl.formatMessage({ id: 'tx.withdrawSuccess' });
      } else {
        setChangingReward(false);
        message = intl.formatMessage({ id: 'tx.rewardChanged' });
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
        operationName = intl.formatMessage({ id: 'stake.operation.claim' });
      } else if (operationType === 'withdraw') {
        operationName = intl.formatMessage({ id: 'stake.operation.withdraw' });
      } else {
        operationName = intl.formatMessage({ id: 'stake.operation.selectReward' });
        setChangingReward(false);

        positions.map((pos) => {
          if (oldReward[pos.indexPosition] != undefined && positionRewards[pos.indexPosition] != undefined) {
            positionRewards[pos.indexPosition] = String(oldReward[pos.indexPosition]); // set previous reward token
          }
        });
      }

      const errorMsg = txConfirmError?.message || intl.formatMessage({ id: 'common.unknownError' });

      dispatchError(intl.formatMessage({ id: 'tx.operationError' }, { operation: operationName, error: errorMsg }));

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
      dispatchError(intl.formatMessage({ id: 'tx.missingWithdrawData' }));
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
      dispatchError(
        intl.formatMessage(
          { id: 'tx.genericError' },
          { error: error instanceof Error ? error.message : intl.formatMessage({ id: 'common.unknownError' }) }
        )
      );
      setOperationType(null);
    }
  };

  const handleSelfWithdraw = (amount: string) => {
    if (!address || !amount) {
      console.error('Missing required data for withdrawal');
      dispatchError(intl.formatMessage({ id: 'tx.missingWithdrawData' }));
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
      dispatchError(
        intl.formatMessage(
          { id: 'tx.genericError' },
          { error: error instanceof Error ? error.message : intl.formatMessage({ id: 'common.unknownError' }) }
        )
      );
      setOperationType(null);
    }
  };

  const handleClaim = (position: StakingPosition, rewardAddress: string) => {
    if (!address || !position.indexPosition) {
      console.error('Missing required data for claiming rewards');
      dispatchError(intl.formatMessage({ id: 'tx.missingClaimData' }));
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
      dispatchError(
        intl.formatMessage(
          { id: 'tx.genericError' },
          { error: error instanceof Error ? error.message : intl.formatMessage({ id: 'common.unknownError' }) }
        )
      );
      setOperationType(null);
    }
  };

  // Using dispatchSuccess/dispatchError instead of snackbar

  if (isLoading) {
    return (
      <Box sx={{ width: '100%', my: 4 }}>
        <LoadingIndicator label={intl.formatMessage({ id: 'stake.loadingStakingAndDelegates' })} />
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
        <Typography variant="h6" component="h2" gutterBottom>
          <FormattedMessage id="stake.stakingSummary" />
        </Typography>
        <Divider sx={{ mb: 2 }} />

        {skyPrice !== null && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body1">
                <FormattedMessage id="stake.skyPrice" />
              </Typography>
              <Tooltip title={intl.formatMessage({ id: 'stake.skyPriceTooltip' })} arrow>
                <IconButton size="small" aria-label={intl.formatMessage({ id: 'stake.aboutSkyPrice' })} sx={{ ml: 0.5, p: 0.25 }}>
                  <HelpOutlineIcon sx={{ fontSize: '1rem' }} />
                </IconButton>
              </Tooltip>
              <Typography variant="body1">:</Typography>
            </Box>

            <Typography variant="h6" component="p" color="primary">
              ~{formatSkyPrice(skyPrice)} USD
            </Typography>
          </Box>
        )}

        {apr !== null && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
            <Typography variant="body1">
              <FormattedMessage id="stake.currentAprSkyColon" />
            </Typography>
            <Typography variant="h6" component="p" color="primary">
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
            <Typography variant="body1">
              <FormattedMessage id="stake.totalUniqueSuppliersColon" />
            </Typography>
            <Typography variant="h6" component="p" color="primary">
              {totalDelegators}
            </Typography>
          </Box>
        )}

        {totalDelegators !== null && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
            <Typography variant="body1">
              <FormattedMessage id="stake.totalStakingPositionsColon" />
            </Typography>
            <Typography variant="h6" component="p" color="primary">
              {totalPositions}
            </Typography>
          </Box>
        )}

        {totalSky !== null && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
            <Typography variant="body1">
              <FormattedMessage id="stake.totalSkyStakedColon" />
            </Typography>
            <Typography variant="h6" component="p" color="primary">
              {formatShortUSDS(totalSky)}
            </Typography>
          </Box>
        )}

        {tvl !== null && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
            <Typography variant="body1">
              <FormattedMessage id="stake.tvlColon" />
            </Typography>
            <Typography variant="h6" component="p" color="primary">
              {formatShortUSDS(tvl)} USDS
            </Typography>
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
          <Typography variant="body1">
            <FormattedMessage id="stake.yourTotalStakedColon" />
          </Typography>
          <Typography variant="h6" component="p" color="primary">
            {formatUSDS(totalStaked)} SKY
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
          <Typography variant="body1">
            <FormattedMessage id="stake.yourNumberOfPositionsColon" />
          </Typography>
          <Typography variant="h6" component="p" color="primary">
            {positions.length}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
          <Typography variant="body1">
            <FormattedMessage id="stake.yourSkyBalanceColon" />
          </Typography>
          <Typography variant="h6" component="p" color="primary">
            {userBalance ? formatUSDS(formatEther(userBalance)) : '0'}
          </Typography>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          <FormattedMessage id="stake.errorLoadingPositionData" values={{ error: String(error) }} />
        </Alert>
      )}

      {!address && (
        <Typography variant="h6" component="p" sx={{ mt: 2 }}>
          <FormattedMessage id="stake.connectWalletPositions" />
        </Typography>
      )}

      {isLoading && (
        <Box sx={{ width: '100%', my: 4 }}>
          <LoadingIndicator label={intl.formatMessage({ id: 'stake.loadingPositions' })} />
        </Box>
      )}

      {!isLoading && address && !error && (positions.length > 0 || isDelegate) && (
        <>
          {isDelegate && (
            <Box>
              <Typography variant="h5" gutterBottom>
                <FormattedMessage id="stake.selfDelegatePosition" />
              </Typography>
            </Box>
          )}

          {isDelegate && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              <Box key="-" sx={{ width: { xs: '100%', md: 'calc(50% - 12px)' } }}>
                <PositionCard>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">
                        <FormattedMessage id="stake.delegatePosition" />
                      </Typography>
                      <Chip label={intl.formatMessage({ id: 'stake.active' })} color="success" size="small" />
                    </Box>

                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography color="text.secondary">
                        <FormattedMessage id="stake.lockedAmount" />
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <SkyLogo width="16" height="16" style={{ marginRight: '8px' }} aria-hidden />
                        <Typography>{formatUSDS(formatEther(BigInt(delegateStakeAmount)))} SKY</Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography color="text.secondary">
                        <FormattedMessage id="stake.delegate" />
                      </Typography>

                      <Typography>
                        <FormattedMessage id="stake.yourDelegate" />
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography color="text.secondary">
                        <FormattedMessage id="stake.delegateAddress" />
                      </Typography>
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
                          label={intl.formatMessage(
                            { id: 'stake.viewDelegateOnEtherscan' },
                            { address: shortenAddress(delegateAddress as `0x${string}`) }
                          )}
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
                          ? intl.formatMessage({ id: 'btn.preparingTransactionShort' })
                          : withdrawing['delegate'] && txHash && !isTxConfirmed
                            ? intl.formatMessage({ id: 'btn.confirmingTransaction' })
                            : intl.formatMessage({ id: 'btn.withdrawPosition' })}
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
                <FormattedMessage id="stake.yourStakingPositions" />
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
                        <Typography variant="h6">
                          <FormattedMessage id="stake.positionNumber" values={{ number: Number(position.indexPosition) + 1 }} />
                        </Typography>
                        <Chip label={intl.formatMessage({ id: 'stake.active' })} color="success" size="small" />
                      </Box>

                      <Divider sx={{ my: 2 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography color="text.secondary">
                          <FormattedMessage id="stake.lockedAmount" />
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <SkyLogo width="16" height="16" style={{ marginRight: '8px' }} aria-hidden />
                          <Typography>{formatUSDS(formatEther(BigInt(position.wad)))} SKY</Typography>
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography color="text.secondary">
                          <FormattedMessage id="stake.delegate" />
                        </Typography>
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
                        <Typography color="text.secondary">
                          <FormattedMessage id="stake.delegateAddress" />
                        </Typography>
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
                          <Typography color="text.secondary">
                            <FormattedMessage id="stake.transaction" />
                          </Typography>
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
                              label={intl.formatMessage(
                                { id: 'stake.viewTransactionOnEtherscan' },
                                { hash: shortenAddress(position.transactions.lockHash) }
                              )}
                              sx={{ ml: 1, color: 'primary.main' }}
                            />
                          </Box>
                        </Box>
                      )}

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography color="text.secondary">
                          <FormattedMessage id="stake.reward" />
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <StyledSelect
                            value={positionRewards[position.indexPosition]}
                            disabled={changingReward}
                            inputProps={{
                              'aria-label': intl.formatMessage(
                                { id: 'stake.rewardTokenForPosition' },
                                { number: Number(position.indexPosition) + 1 }
                              )
                            }}
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
                            <Tooltip title={intl.formatMessage({ id: 'stake.usdsDeprecatedTooltip' })} arrow>
                              <IconButton
                                size="small"
                                aria-label={intl.formatMessage({ id: 'stake.usdsDeprecatedLabel' })}
                                sx={{ color: 'orangered' }}
                              >
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
                            <FormattedMessage id="stake.editPosition" />
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
                                ? intl.formatMessage({ id: 'btn.preparingTransactionShort' })
                                : isClaiming && txHash && !isTxConfirmed
                                  ? intl.formatMessage({ id: 'btn.confirmingTransaction' })
                                  : intl.formatMessage({ id: 'btn.claimAmount' }, { amount: formatted, symbol: reward.symbol })}
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
                            ? intl.formatMessage({ id: 'btn.preparingTransactionShort' })
                            : withdrawing[position.indexPosition] && txHash && !isTxConfirmed
                              ? intl.formatMessage({ id: 'btn.confirmingTransaction' })
                              : intl.formatMessage({ id: 'btn.withdrawPosition' })}
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
