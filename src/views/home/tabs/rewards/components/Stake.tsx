import { FC, useState, useCallback } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { ReactComponent as UsdsLogo } from 'assets/images/sky/usds.svg';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { usdsContractConfig } from 'config/abi/Usds';
import { stakingRewardContractConfig } from 'config/abi/StakingReward';
import { dispatchSuccess, dispatchError } from 'utils/snackbar';
import { useConfigChainId } from 'hooks/useConfigChainId';
import { formatUSDS } from 'utils/sky';
import { StyledCard } from 'components/StyledCard';
import { StyledTextField } from 'components/StyledTextField';
import { PercentButton } from 'components/PercentButton';

interface Props {
  userBalance?: bigint;
  rewardAddress?: string;
}

// Transaction states
type TxState = 'idle' | 'submitting' | 'submitted' | 'confirmed' | 'error';

// Custom hook for transaction management
const useTransaction = () => {
  const [txState, setTxState] = useState<TxState>('idle');
  const [isCompleted, setIsCompleted] = useState(false);

  const { writeContract, error: txError, isError: isTxError, isSuccess: isTxSubmitted, data: txHash } = useWriteContract();

  const {
    isSuccess: isTxConfirmed,
    isError: isTxConfirmError,
    error: txConfirmError
  } = useWaitForTransactionReceipt({
    hash: txHash,
    query: { enabled: !!txHash }
  });

  // Reset the transaction state
  const resetTx = useCallback(() => {
    if (txState === 'error') {
      setTxState('idle');
    }
  }, [txState]);

  // Process transaction status changes
  const processTxState = useCallback(() => {
    if (isTxSubmitted && txState === 'idle') {
      setTxState('submitted');
      console.log('Transaction submitted:', txHash);
    } else if (isTxConfirmed && txState === 'submitted') {
      setTxState('confirmed');
      setIsCompleted(true);
      console.log('Transaction confirmed!');
    } else if ((isTxError || isTxConfirmError) && txState !== 'error') {
      setTxState('error');
      console.error('Transaction failed:', txError || txConfirmError);
    }
  }, [isTxSubmitted, isTxConfirmed, isTxError, isTxConfirmError, txState, txHash, txError, txConfirmError]);

  return {
    writeContract,
    txState,
    txHash,
    isCompleted,
    isTxConfirmed,
    resetTx,
    processTxState
  };
};

const Stake: FC<Props> = ({ userBalance = 0n, rewardAddress = '' }) => {
  const [amount, setAmount] = useState<string>('');
  const { config: skyConfig } = useConfigChainId();

  // Use custom transaction hooks
  const approveTx = useTransaction();
  const stakeTx = useTransaction();

  // Track process completion
  const [isApproved, setIsApproved] = useState(false);
  const [isDeposited, setIsDeposited] = useState(false);

  // Handle percentage button clicks
  const handlePercentClick = useCallback(
    (percent: number) => {
      if (!userBalance) return;
      const value = (Number(formatEther(BigInt(userBalance))) * percent) / 100;
      setAmount(value.toString());
    },
    [userBalance]
  );

  // Process transaction states
  useCallback(() => {
    approveTx.processTxState();
    stakeTx.processTxState();

    // Update approval status when confirmed
    if (approveTx.txState === 'confirmed' && !isApproved) {
      setIsApproved(true);
      dispatchSuccess('USDS Approved Successfully!');
    }

    // Update deposit status when confirmed
    if (stakeTx.txState === 'confirmed' && !isDeposited) {
      setIsDeposited(true);
      dispatchSuccess('USDS deposited successfully!');
    }

    // Handle errors
    if (approveTx.txState === 'error') {
      dispatchError('USDS Approve Failed!');
    }

    if (stakeTx.txState === 'error') {
      dispatchError('Deposit failed');
    }
  }, [approveTx, stakeTx, isApproved, isDeposited])();

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
          ...stakingRewardContractConfig,
          address: rewardAddress as `0x${string}`,
          functionName: 'stake',
          args: [BigInt(amountInWei), 1]
        });
      }
    } catch (error) {
      console.error('Transaction failed:', error);
      if (!isApproved) {
        dispatchError('Failed to approve USDS');
      } else {
        dispatchError('Failed to stake USDS');
      }
    }
  }, [amount, isApproved, isDeposited, approveTx, stakeTx, rewardAddress, skyConfig.contracts.USDS, resetTransactionStates]);

  // Compute button text based on transaction states
  const getButtonText = useCallback(() => {
    if (!amount) {
      return 'Enter Amount';
    }

    if (!isApproved) {
      if (approveTx.txHash && !approveTx.isTxConfirmed) {
        return 'Approving USDS...';
      }
      if (approveTx.txState === 'error') {
        return 'Approval Failed - Try again';
      }
      return 'Approve USDS';
    }

    if (!isDeposited) {
      if (stakeTx.txHash && !stakeTx.isTxConfirmed) {
        return 'Staking USDS...';
      }
      if (stakeTx.txState === 'error') {
        return 'Staking Failed - Try again';
      }
      return 'Stake USDS';
    }

    return 'Success!';
  }, [
    amount,
    isApproved,
    isDeposited,
    approveTx.txHash,
    approveTx.isTxConfirmed,
    approveTx.txState,
    stakeTx.txHash,
    stakeTx.isTxConfirmed,
    stakeTx.txState
  ]);

  // Determine if button should be disabled
  const isButtonDisabled = useCallback(() => {
    if (!amount) return true;

    // Disable during transactions
    if (approveTx.txHash && !approveTx.isTxConfirmed) return true;
    if (stakeTx.txHash && !stakeTx.isTxConfirmed) return true;

    // Disable when completed
    return isDeposited;
  }, [amount, approveTx.txHash, approveTx.isTxConfirmed, stakeTx.txHash, stakeTx.isTxConfirmed, isDeposited]);

  // Determine if input and percentage buttons should be disabled
  const isInputDisabled = isDeposited || approveTx.txState === 'submitted' || stakeTx.txState === 'submitted';

  return (
    <StyledCard>
      <Box p={0}>
        <Typography variant="body2" sx={{ mb: 2 }}>
          How much USDS would you like to supply?
        </Typography>

        {/* Amount input field */}
        <Box sx={{ display: 'flex', alignItems: 'center', borderBottom: 1, borderColor: 'divider', py: 2, gap: 2 }}>
          <StyledTextField
            slotProps={{
              input: {
                lang: 'en'
              }
            }}
            fullWidth
            type="number"
            placeholder="Enter amount"
            value={amount}
            disabled={isInputDisabled}
            onChange={handleAmountChange}
          />

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <UsdsLogo width="24" height="24" />
            <Typography>USDS</Typography>
          </Box>
        </Box>

        {/* Balance and percentage buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="textPrimary">
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
            <PercentButton onClick={() => handlePercentClick(25)} disabled={isInputDisabled}>
              25%
            </PercentButton>
            <PercentButton onClick={() => handlePercentClick(50)} disabled={isInputDisabled}>
              50%
            </PercentButton>
            <PercentButton onClick={() => handlePercentClick(100)} disabled={isInputDisabled}>
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
      </Box>
    </StyledCard>
  );
};

export default Stake;
