import { Box, Typography, Button } from '@mui/material';
import { FC, useCallback, useState, useEffect } from 'react';
import { ReactComponent as UsdsLogo } from 'assets/images/sky/usds.svg';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import { useConfigChainId } from 'hooks/useConfigChainId';
import { daiUsdsConverterConfig } from 'config/abi/DaiUsdsConverter';
import { usdsContractConfig } from 'config/abi/Usds';
import { formatUSDS } from 'utils/sky';
import { StyledCard } from 'components/StyledCard';
import { StyledTextField } from 'components/StyledTextField';
import { PercentButton } from 'components/PercentButton';
import { dispatchError, dispatchSuccess } from 'utils/snackbar';
import { useDebounce } from 'hooks/useDebounce';

interface Props {
  usdsUserBalance?: bigint;
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

const RevertAssets: FC<Props> = ({ usdsUserBalance }) => {
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
  const revertTx = useTransaction();

  // Track process completion
  const [isApproved, setIsApproved] = useState(false);
  const [isReverted, setIsReverted] = useState(false);

  // Check allowance to determine if approval is needed
  const { data: allowanceData, refetch: refetchAllowance } = useReadContract({
    ...usdsContractConfig,
    address: skyConfig.contracts.USDS,
    functionName: 'allowance',
    args: address ? [address, skyConfig.contracts.DAIUSDSConverter] : undefined,
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
      if (!usdsUserBalance) return;

      // Calculate the amount based on the percentage
      const value = (Number(formatEther(usdsUserBalance)) * percent) / 100;

      // Set the amount and indicate allowance is being checked
      setAmount(value.toString());
      if (amount !== debouncedAmount) {
        setAllowanceChecking(true);
      }

      // Reset transaction states when changing amount
      if (approveTx.txState === 'error' || revertTx.txState === 'error' || isReverted) {
        resetTransactionStates();
      }
    },
    [usdsUserBalance, amount, debouncedAmount, approveTx.txState, revertTx.txState, isReverted]
  );

  // Process transaction states
  useCallback(() => {
    approveTx.processTxState();
    revertTx.processTxState();

    // Update approval status when confirmed
    if (approveTx.txState === 'confirmed' && !isApproved) {
      if (refetchAllowance) {
        refetchAllowance();
      }
      dispatchSuccess('USDS Approved Successfully!');
    }

    // Update revert status when confirmed
    if (revertTx.txState === 'confirmed' && !isReverted) {
      setIsReverted(true);
      dispatchSuccess('USDS reverted to DAI successfully!');
    }

    // Handle errors
    if (approveTx.txState === 'error') {
      dispatchError('USDS Approve Failed!');
      setIsApproved(false);
    }

    if (revertTx.txState === 'error') {
      dispatchError('USDS revert failed!');
    }
  }, [approveTx, revertTx, isApproved, isReverted, refetchAllowance])();

  // Reset transaction states
  const resetTransactionStates = useCallback(() => {
    approveTx.resetTx();
    revertTx.resetTx();
    setIsReverted(false);
  }, [approveTx, revertTx]);

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

        // Reset states when amount changes
        if (approveTx.txState === 'error' || revertTx.txState === 'error' || isReverted) {
          resetTransactionStates();
        }
      }
    },
    [approveTx.txState, revertTx.txState, isReverted, resetTransactionStates]
  );

  // Handle main button click
  const handleMainButtonClick = useCallback(async () => {
    if (!amount) {
      console.log('Amount is empty');
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
          args: [skyConfig.contracts.DAIUSDSConverter, BigInt(amountInWei)]
        });
      }
      // Step 2: Revert tokens if approved but not yet reverted
      else if (isApproved && !isReverted) {
        console.log('Initiating revert transaction...');
        revertTx.writeContract({
          ...daiUsdsConverterConfig,
          address: skyConfig.contracts.DAIUSDSConverter,
          functionName: 'usdsToDai',
          args: [address as `0x${string}`, BigInt(amountInWei)]
        });
      }
    } catch (error) {
      console.error('Transaction failed:', error);
      if (!isApproved) {
        dispatchError('Failed to approve USDS');
      } else {
        dispatchError('Failed to revert USDS to DAI');
      }
    }
  }, [
    amount,
    isApproved,
    isReverted,
    approveTx,
    revertTx,
    address,
    skyConfig.contracts.USDS,
    skyConfig.contracts.DAIUSDSConverter,
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

    if (!isReverted) {
      if (revertTx.txHash && !revertTx.isTxConfirmed) {
        return 'Reverting USDS to DAI...';
      }
      if (revertTx.txState === 'error') {
        return 'Revert Failed - Try again';
      }
      return 'Revert USDS to DAI';
    }

    return 'Success!';
  }, [
    amount,
    isApproved,
    isReverted,
    allowanceChecking,
    approveTx.txHash,
    approveTx.isTxConfirmed,
    approveTx.txState,
    revertTx.txHash,
    revertTx.isTxConfirmed,
    revertTx.txState
  ]);

  // Determine if button should be disabled
  const isButtonDisabled = useCallback(() => {
    if (!amount) return true;

    // Disable during allowance checking (debounce period)
    if (allowanceChecking) return true;

    // Disable during transactions
    if (approveTx.txHash && !approveTx.isTxConfirmed) return true;
    if (revertTx.txHash && !revertTx.isTxConfirmed) return true;

    // Disable when completed
    return isReverted;
  }, [amount, allowanceChecking, approveTx.txHash, approveTx.isTxConfirmed, revertTx.txHash, revertTx.isTxConfirmed, isReverted]);

  // Determine if input and percentage buttons should be disabled
  const isInputDisabled = isReverted || approveTx.txState === 'submitted' || revertTx.txState === 'submitted';

  return (
    <StyledCard>
      <Box p={0}>
        <Typography variant="body2" sx={{ mb: 2 }}>
          How much USDS would you like to revert to DAI?
        </Typography>
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
              {usdsUserBalance ? formatUSDS(formatEther(usdsUserBalance)) : '0'} USDS
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

export default RevertAssets;
