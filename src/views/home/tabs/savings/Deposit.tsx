import { Box, Typography, Button } from '@mui/material';
import { FC, useState, useCallback, useEffect } from 'react';
import { ReactComponent as UsdsLogo } from 'assets/images/sky/usds.svg';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { usdsContractConfig } from 'config/abi/Usds';
import { savingsUsdsContractConfig } from 'config/abi/SavingsUsds';
import { parseEther } from 'viem';
import { useConfigChainId } from 'hooks/useConfigChainId';
import { StyledCard } from 'components/StyledCard';
import { StyledTextField } from 'components/StyledTextField';
import { PercentButton } from 'components/PercentButton';
import { dispatchError, dispatchSuccess } from 'utils/snackbar';
import { useDebounce } from 'hooks/useDebounce';

interface Props {
  userBalance?: string;
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

const Deposit: FC<Props> = ({ userBalance = '0' }) => {
  const [amount, setAmount] = useState<string>('');
  // Create a debounced version of amount that updates 500ms after amount changes
  const debouncedAmount = useDebounce(amount, 500);
  const account = useAccount();
  const address = account.address as `0x${string}` | undefined;
  const { config: skyConfig } = useConfigChainId();

  // Track when allowance checking is in progress (during debounce)
  const [allowanceChecking, setAllowanceChecking] = useState(false);

  // Use custom transaction hooks
  const approveTx = useTransaction();
  const depositTx = useTransaction();

  // Track process completion
  const [isApproved, setIsApproved] = useState(false);
  const [isDeposited, setIsDeposited] = useState(false);

  // Check allowance to determine if approval is needed
  const { data: allowanceData, refetch: refetchAllowance } = useReadContract({
    ...usdsContractConfig,
    address: skyConfig.contracts.USDS,
    functionName: 'allowance',
    args: address ? [address, skyConfig.contracts.SavingsUSDS] : undefined,
    query: {
      enabled: !!address
    }
  });

  // Use debounced amount to validate and trigger refetchAllowance
  useEffect(() => {
    if (debouncedAmount && refetchAllowance) {
      setAllowanceChecking(false); // Clear checking state when debounced value is processed
      refetchAllowance();
    }
  }, [debouncedAmount, refetchAllowance]);

  // Track when amount is changing but debounced value hasn't updated yet
  useEffect(() => {
    if (amount !== debouncedAmount && amount) {
      setAllowanceChecking(true); // Set checking state when amount changes
    }
  }, [amount, debouncedAmount]);

  // Check if approval is needed
  useEffect(() => {
    if (address && debouncedAmount && allowanceData) {
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
  }, [address, debouncedAmount, allowanceData, isApproved]);

  // Handle percentage button clicks
  const handlePercentClick = useCallback(
    (percent: number) => {
      if (userBalance === '0') return;

      // Convert userBalance from string to number
      const balance = parseFloat(userBalance);
      if (isNaN(balance)) return;

      // Calculate the amount based on the percentage
      const value = (balance * percent) / 100;

      // Set the amount and indicate allowance is being checked
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
    depositTx.processTxState();

    // Update approval status when confirmed
    if (approveTx.txState === 'confirmed' && !isApproved) {
      if (refetchAllowance) {
        refetchAllowance();
      }
      dispatchSuccess('USDS Approved Successfully!');
    }

    // Update deposit status when confirmed
    if (depositTx.txState === 'confirmed' && !isDeposited) {
      setIsDeposited(true);
      dispatchSuccess('USDS deposited successfully!');
    }

    // Handle errors
    if (approveTx.txState === 'error') {
      dispatchError('USDS Approve Failed!');
    }

    if (depositTx.txState === 'error') {
      dispatchError('Deposit failed');
    }
  }, [approveTx, depositTx, isApproved, isDeposited])();

  // Reset transaction states
  const resetTransactionStates = useCallback(() => {
    approveTx.resetTx();
    depositTx.resetTx();
  }, [approveTx, depositTx]);

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
        if (approveTx.txState === 'error' || depositTx.txState === 'error') {
          resetTransactionStates();
        }
      }
    },
    [approveTx.txState, depositTx.txState, resetTransactionStates]
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
          args: [skyConfig.contracts.SavingsUSDS, BigInt(amountInWei)]
        });
      }
      // Step 2: Deposit tokens if approved but not yet deposited
      else if (isApproved && !isDeposited) {
        console.log('Initiating deposit transaction...');
        depositTx.writeContract({
          ...savingsUsdsContractConfig,
          address: skyConfig.contracts.SavingsUSDS,
          functionName: 'deposit',
          args: [BigInt(amountInWei), address as `0x${string}`, 1]
        });
      }
    } catch (error) {
      console.error('Transaction failed:', error);
      if (!isApproved) {
        dispatchError('Failed to approve USDS');
      } else {
        dispatchError('Failed to deposit USDS');
      }
    }
  }, [
    amount,
    isApproved,
    isDeposited,
    approveTx,
    depositTx,
    skyConfig.contracts.USDS,
    skyConfig.contracts.SavingsUSDS,
    address,
    resetTransactionStates
  ]);

  // Compute button text based on transaction states
  const getButtonText = useCallback(() => {
    // Show checking status when amount is being debounced
    if (allowanceChecking) {
      return 'Checking allowance...';
    }

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
      if (depositTx.txHash && !depositTx.isTxConfirmed) {
        return 'Depositing USDS...';
      }
      if (depositTx.txState === 'error') {
        return 'Deposit Failed - Try again';
      }
      return 'Supply USDS';
    }

    return 'Success!';
  }, [
    amount,
    isApproved,
    isDeposited,
    allowanceChecking,
    approveTx.txHash,
    approveTx.isTxConfirmed,
    approveTx.txState,
    depositTx.txHash,
    depositTx.isTxConfirmed,
    depositTx.txState
  ]);

  // Determine if button should be disabled
  const isButtonDisabled = useCallback(() => {
    if (!amount) return true;

    // Disable during allowance checking (debounce period)
    if (allowanceChecking) return true;

    // Disable during transactions
    if (approveTx.txHash && !approveTx.isTxConfirmed) return true;
    if (depositTx.txHash && !depositTx.isTxConfirmed) return true;

    // Disable when completed
    return isDeposited;
  }, [amount, allowanceChecking, approveTx.txHash, approveTx.isTxConfirmed, depositTx.txHash, depositTx.isTxConfirmed, isDeposited]);

  // Determine if input and percentage buttons should be disabled
  const isInputDisabled = isDeposited || approveTx.txState === 'submitted' || depositTx.txState === 'submitted';

  return (
    <StyledCard>
      <Box p={0}>
        <Typography variant="body2" sx={{ mb: 2 }}>
          How much USDS would you like to supply?
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            borderBottom: 1,
            borderColor: 'divider',
            py: 2,
            px: { xs: 0, sm: 2 },
            gap: { xs: 0.5, sm: 2 },
            width: '100%'
          }}
        >
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

          <Box
            sx={{
              display: 'flex',
              gap: 1,
              alignItems: 'center'
            }}
          >
            <UsdsLogo width="24" height="24" />
            <Typography>USDS</Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="textPrimary">
              {userBalance} USDS
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
      <Box>
        <Button variant="contained" color="primary" fullWidth sx={{ mt: 2 }} disabled={isButtonDisabled()} onClick={handleMainButtonClick}>
          {getButtonText()}
        </Button>
      </Box>
    </StyledCard>
  );
};

export default Deposit;
