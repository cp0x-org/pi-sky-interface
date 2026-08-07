import { FC, useState, useCallback, useEffect } from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';
import { ReactComponent as UsdsLogo } from 'assets/images/sky/usds.svg';
import { useReadContract, useAccount } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { usdsContractConfig } from 'config/abi/Usds';
import { stakingRewardContractConfig } from 'config/abi/StakingReward';
import { dispatchSuccess, dispatchError } from 'utils/snackbar';
import { useConfigChainId } from 'hooks/useConfigChainId';
import { formatUSDS } from 'utils/sky';
import { StyledCard } from 'components/StyledCard';
import { StyledTextField } from 'components/StyledTextField';
import { PercentButton } from 'components/PercentButton';
import { useDebounce } from 'hooks/useDebounce';
import { useWriteTransaction } from 'hooks/useWriteTransaction';
import { stUsdsContractConfig } from 'config/abi/StUsds';
import StatusLive from 'components/StatusLive';
import { FormattedMessage, useIntl } from 'react-intl';

interface Props {
  userBalance?: bigint;
  rewardAddress?: string;
}

const Stake: FC<Props> = ({ userBalance = 0n, rewardAddress = '' }) => {
  const intl = useIntl();
  const [amount, setAmount] = useState<string>('');
  // Create a debounced version of amount that updates 500ms after amount changes
  const debouncedAmount = useDebounce(amount, 500);
  const { config: skyConfig } = useConfigChainId();
  const account = useAccount();
  const address = account.address as `0x${string}` | undefined;

  // Track when allowance checking is in progress (during debounce)
  const [allowanceChecking, setAllowanceChecking] = useState(false);

  // Use custom transaction hooks
  const approveTx = useWriteTransaction();
  const stakeTx = useWriteTransaction();

  // Track process completion
  const [isApproved, setIsApproved] = useState(false);
  const [isDeposited, setIsDeposited] = useState(false);

  // Check allowance to determine if approval is needed
  const { data: allowanceData, refetch: refetchAllowance } = useReadContract({
    ...usdsContractConfig,
    address: skyConfig.contracts.USDS,
    functionName: 'allowance',
    args: address ? [address, rewardAddress as `0x${string}`] : undefined,
    query: {
      enabled: !!address
    }
  });

  // Use debounced amount to validate and trigger refetchAllowance
  useEffect(() => {
    if (debouncedAmount && refetchAllowance && rewardAddress) {
      setAllowanceChecking(false); // Clear checking state when debounced value is processed
      refetchAllowance();
    }
  }, [debouncedAmount, refetchAllowance, rewardAddress]);

  // Track when amount is changing but debounced value hasn't updated yet
  useEffect(() => {
    if (amount !== debouncedAmount && amount) {
      setAllowanceChecking(true); // Set checking state when amount changes
    }
  }, [amount, debouncedAmount]);

  // Check if approval is needed
  useEffect(() => {
    if (address && debouncedAmount && allowanceData && rewardAddress) {
      try {
        const amountBigInt = parseEther(debouncedAmount);
        const shouldBeApproved = allowanceData >= amountBigInt;

        // Only update state if it's different to avoid unnecessary re-renders
        if (shouldBeApproved !== isApproved) {
          setIsApproved(shouldBeApproved);
        }
      } catch (error) {
        console.error('Error checking allowance:', error);
      }
    }
  }, [address, debouncedAmount, allowanceData, isApproved, rewardAddress]);

  // Handle percentage button clicks
  const handlePercentClick = useCallback(
    (percent: number) => {
      if (!userBalance) return;
      const value = (Number(formatEther(BigInt(userBalance))) * percent) / 100;
      setAmount(value.toString());

      if (amount !== debouncedAmount) {
        setAllowanceChecking(true);
      }
    },
    [userBalance, amount, debouncedAmount]
  );

  // Process transaction states
  useCallback(() => {
    approveTx.processTxState();
    stakeTx.processTxState();

    // Update approval status when confirmed
    if (approveTx.txState === 'confirmed' && !isApproved) {
      if (refetchAllowance) {
        refetchAllowance();
      }
      dispatchSuccess(intl.formatMessage({ id: 'tx.usdsApproved' }));
    }

    // Update deposit status when confirmed
    if (stakeTx.txState === 'confirmed' && !isDeposited) {
      setIsDeposited(true);
      dispatchSuccess(intl.formatMessage({ id: 'tx.usdsStaked' }));
    }

    // Handle errors
    if (approveTx.txState === 'error') {
      dispatchError(intl.formatMessage({ id: 'tx.usdsApproveFailed' }));
    }

    if (stakeTx.txState === 'error') {
      dispatchError(intl.formatMessage({ id: 'tx.depositFailed' }));
    }
  }, [approveTx, stakeTx, isApproved, isDeposited, intl])();

  // Reset transaction states
  const resetTransactionStates = useCallback(() => {
    approveTx.resetTx();
    stakeTx.resetTx();
  }, [approveTx, stakeTx]);

  // Handle amount change
  const handleAmountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (value === '' || Number(value) >= 0) {
        setAmount(value);

        // Set allowance checking state if there's a value
        if (value) {
          setAllowanceChecking(true);
        } else {
          setAllowanceChecking(false);
        }

        // Reset error states when amount changes
        if (approveTx.txState === 'error' || stakeTx.txState === 'error') {
          resetTransactionStates();
        }
      }
    },
    [approveTx.txState, stakeTx.txState, resetTransactionStates]
  );

  // Handle main button click
  const handleMainButtonClick = useCallback(async () => {
    if (!amount) {
      console.log('Supply amount is empty');
      return;
    }

    // Reset error states if trying again
    resetTransactionStates();

    const amountInWei = parseEther(amount);
    console.log('Attempting transaction with amount:', amount, 'Wei:', amountInWei.toString());
    console.log('Current states - Approved:', isApproved);

    try {
      // Step 1: Approve tokens if not already approved
      if (!isApproved) {
        console.log('Initiating approve transaction...');
        approveTx.writeContract({
          ...usdsContractConfig,
          address: skyConfig.contracts.USDS,
          functionName: 'approve',
          args: [rewardAddress as `0x${string}`, BigInt(amountInWei)]
        });
      }
      // Step 2: Stake tokens if approved but not yet deposited
      else if (isApproved && !isDeposited) {
        console.log('Initiating stake transaction...');
        stakeTx.writeContract({
          ...stUsdsContractConfig,
          address: rewardAddress as `0x${string}`,
          functionName: 'deposit',
          args: [BigInt(amountInWei), address as `0x{string}`, 1]
        });
      }
    } catch (error) {
      console.error('Transaction failed:', error);
      if (!isApproved) {
        dispatchError(intl.formatMessage({ id: 'tx.failedApproveUsds' }));
      } else {
        dispatchError(intl.formatMessage({ id: 'tx.failedStakeUsds' }));
      }
    }
  }, [amount, isApproved, isDeposited, approveTx, stakeTx, rewardAddress, skyConfig.contracts.USDS, resetTransactionStates, intl]);

  // Compute button text based on transaction states
  const getButtonText = useCallback(() => {
    // Show checking status when amount is being debounced
    if (allowanceChecking) {
      return intl.formatMessage({ id: 'btn.checkingAllowance' });
    }

    if (!amount) {
      return intl.formatMessage({ id: 'btn.enterAmount' });
    }

    if (!isApproved) {
      if (approveTx.txHash && !approveTx.isTxConfirmed) {
        return intl.formatMessage({ id: 'btn.approvingUsds' });
      }
      if (approveTx.txState === 'error') {
        return intl.formatMessage({ id: 'btn.approvalFailedTryAgain' });
      }
      return intl.formatMessage({ id: 'btn.approveUsds' });
    }

    if (!isDeposited) {
      if (stakeTx.txHash && !stakeTx.isTxConfirmed) {
        return intl.formatMessage({ id: 'btn.stakingUsds' });
      }
      if (stakeTx.txState === 'error') {
        return intl.formatMessage({ id: 'btn.stakingFailedTryAgain' });
      }
      return intl.formatMessage({ id: 'btn.stakeUsds' });
    }

    return intl.formatMessage({ id: 'btn.success' });
  }, [
    amount,
    isApproved,
    isDeposited,
    allowanceChecking,
    approveTx.txHash,
    approveTx.isTxConfirmed,
    approveTx.txState,
    stakeTx.txHash,
    stakeTx.isTxConfirmed,
    stakeTx.txState,
    intl
  ]);

  // Determine if button should be disabled
  const isButtonDisabled = useCallback(() => {
    if (!amount) return true;

    // Disable during allowance checking (debounce period)
    if (allowanceChecking) return true;

    // Disable during transactions
    if (approveTx.txHash && !approveTx.isTxConfirmed) return true;
    if (stakeTx.txHash && !stakeTx.isTxConfirmed) return true;

    // Disable when completed
    return isDeposited;
  }, [amount, allowanceChecking, approveTx.txHash, approveTx.isTxConfirmed, stakeTx.txHash, stakeTx.isTxConfirmed, isDeposited]);

  // Determine if input and percentage buttons should be disabled
  const isInputDisabled = isDeposited || approveTx.txState === 'submitted' || stakeTx.txState === 'submitted';

  return (
    <StyledCard>
      <Box p={0}>
        <Typography variant="body2" sx={{ mb: 2 }}>
          <FormattedMessage id="form.howMuchUsdsSupply" />
        </Typography>

        {/* Amount input field */}
        <Box sx={{ display: 'flex', alignItems: 'center', borderBottom: 1, borderColor: 'divider', py: 2, gap: 2 }}>
          <StyledTextField
            slotProps={{
              htmlInput: {
                lang: 'en',
                inputMode: 'decimal',
                'aria-label': intl.formatMessage({ id: 'a11y.amountUsdsSupply' }),
                'aria-describedby': 'expert-stake-balance'
              }
            }}
            fullWidth
            type="number"
            placeholder={intl.formatMessage({ id: 'form.enterAmountPlaceholder' })}
            value={amount}
            disabled={isInputDisabled}
            onChange={handleAmountChange}
          />

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <UsdsLogo width="24" height="24" aria-hidden />
            <Typography>USDS</Typography>
          </Box>
        </Box>

        {/* Balance and percentage buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="textPrimary" id="expert-stake-balance">
              {userBalance ? formatUSDS(formatEther(userBalance)) : '0'} USDS
            </Typography>
          </Box>

          <Box
            sx={{
              display: {
                xs: 'none',
                sm: 'flex'
              },
              gap: 1
            }}
          >
            <PercentButton
              onClick={() => handlePercentClick(25)}
              disabled={isInputDisabled}
              aria-label={intl.formatMessage({ id: 'a11y.setPercent' }, { percent: 25 })}
            >
              25%
            </PercentButton>
            <PercentButton
              onClick={() => handlePercentClick(50)}
              disabled={isInputDisabled}
              aria-label={intl.formatMessage({ id: 'a11y.setPercent' }, { percent: 50 })}
            >
              50%
            </PercentButton>
            <PercentButton
              onClick={() => handlePercentClick(100)}
              disabled={isInputDisabled}
              aria-label={intl.formatMessage({ id: 'a11y.setPercent' }, { percent: 100 })}
            >
              100%
            </PercentButton>
          </Box>
        </Box>
      </Box>

      {/* Action button */}
      <Box>
        <Button variant="contained" color="primary" fullWidth sx={{ mt: 2 }} disabled={isButtonDisabled()} onClick={handleMainButtonClick}>
          {getButtonText()}
        </Button>
        <StatusLive message={getButtonText()} />
      </Box>
      <Alert severity="warning" sx={{ mt: 2 }}>
        <FormattedMessage id="expert.stakeWarning" />
      </Alert>
    </StyledCard>
  );
};

export default Stake;
