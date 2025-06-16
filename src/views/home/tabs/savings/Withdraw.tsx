import { Box, Typography, Button } from '@mui/material';
import { FC, useState, useCallback } from 'react';
import { ReactComponent as UsdsLogo } from 'assets/images/sky/usds.svg';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { savingsUsdsContractConfig } from 'config/abi/SavingsUsds';
import { parseEther } from 'viem';
import { useConfigChainId } from 'hooks/useConfigChainId';
import { StyledCard } from 'components/StyledCard';
import { StyledTextField } from 'components/StyledTextField';
import { PercentButton } from 'components/PercentButton';
import { dispatchError, dispatchSuccess } from 'utils/snackbar';

interface Props {
  savingsBalance?: string;
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

const Withdraw: FC<Props> = ({ savingsBalance = '0' }) => {
  const [amount, setAmount] = useState<string>('');
  const account = useAccount();
  const address = account.address as `0x${string}` | undefined;
  const { config: skyConfig } = useConfigChainId();

  // Use transaction hook
  const withdrawTx = useTransaction();

  // Track completion
  const [isWithdrawed, setIsWithdrawed] = useState(false);

  // Handle percentage button clicks
  const handlePercentClick = useCallback(
    (percent: number) => {
      if (savingsBalance === '0') return;

      // Convert savingsBalance from string to number
      const balance = parseFloat(savingsBalance);
      if (isNaN(balance)) return;

      // Calculate the amount based on the percentage
      const value = (balance * percent) / 100;

      // Set the amount
      setAmount(value.toString());
    },
    [savingsBalance]
  );

  // Process transaction states
  useCallback(() => {
    withdrawTx.processTxState();

    // Update withdraw status when confirmed
    if (withdrawTx.txState === 'confirmed' && !isWithdrawed) {
      setIsWithdrawed(true);
      dispatchSuccess('USDS withdrawn successfully!');
    }

    // Handle errors
    if (withdrawTx.txState === 'error') {
      dispatchError('USDS Withdraw failed');
    }
  }, [withdrawTx, isWithdrawed])();

  // Handle amount change
  const handleAmountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (value === '' || Number(value) >= 0) {
        setAmount(value);
        // Reset error states when amount changes
        if (withdrawTx.txState === 'error') {
          withdrawTx.resetTx();
        }
      }
    },
    [withdrawTx]
  );

  // Handle main button click
  const handleMainButtonClick = useCallback(async () => {
    if (!amount) {
      console.log('Withdraw amount is empty');
      dispatchError('Please Set Amount');
      return;
    }

    // Reset error states if trying again
    if (withdrawTx.txState === 'error') {
      withdrawTx.resetTx();
    }

    const amountInWei = parseEther(amount);
    console.log('Attempting withdrawal with amount:', amount, 'Wei:', amountInWei.toString());

    try {
      if (!isWithdrawed) {
        console.log('Initiating withdraw transaction...');
        withdrawTx.writeContract({
          ...savingsUsdsContractConfig,
          address: skyConfig.contracts.SavingsUSDS,
          functionName: 'withdraw',
          args: [BigInt(amountInWei), address as `0x${string}`, address as `0x${string}`]
        });
      }
    } catch (error) {
      console.error('Transaction failed:', error);
      dispatchError('Transaction failed');
    }
  }, [amount, isWithdrawed, withdrawTx, skyConfig.contracts.SavingsUSDS, address]);

  // Compute button text based on transaction states
  const getButtonText = useCallback(() => {
    if (!amount) {
      return 'Enter Amount';
    }

    if (!isWithdrawed) {
      if (withdrawTx.txHash && !withdrawTx.isTxConfirmed) {
        return 'Withdrawing USDS...';
      }
      if (withdrawTx.txState === 'error') {
        return 'Withdrawal Failed - Try again';
      }
      return 'Withdraw';
    }

    return 'Success!';
  }, [amount, isWithdrawed, withdrawTx.txHash, withdrawTx.isTxConfirmed, withdrawTx.txState]);

  // Determine if button should be disabled
  const isButtonDisabled = useCallback(() => {
    if (!amount) return true;

    // Disable during transaction
    if (withdrawTx.txHash && !withdrawTx.isTxConfirmed) return true;

    // Disable when completed
    return isWithdrawed;
  }, [amount, withdrawTx.txHash, withdrawTx.isTxConfirmed, isWithdrawed]);

  // Determine if input and percentage buttons should be disabled
  const isInputDisabled = isWithdrawed || withdrawTx.txState === 'submitted';

  return (
    <StyledCard>
      <Box p={0}>
        <Typography variant="body2" sx={{ mb: 2 }}>
          How much USDS would you like to withdraw?
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            borderBottom: 1,
            borderColor: 'divider',
            py: 2,
            gap: 2
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
              {savingsBalance} USDS
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

export default Withdraw;
