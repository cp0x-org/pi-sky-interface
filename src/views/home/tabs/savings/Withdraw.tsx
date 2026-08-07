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
import StatusLive from 'components/StatusLive';
import { FormattedMessage, useIntl } from 'react-intl';

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
  const intl = useIntl();
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
      dispatchSuccess(intl.formatMessage({ id: 'tx.usdsWithdrawn' }));
    }

    // Handle errors
    if (withdrawTx.txState === 'error') {
      dispatchError(intl.formatMessage({ id: 'tx.usdsWithdrawFailed' }));
    }
  }, [withdrawTx, isWithdrawed, intl])();

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
      dispatchError(intl.formatMessage({ id: 'tx.pleaseSetAmount' }));
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
      dispatchError(intl.formatMessage({ id: 'tx.transactionFailed' }));
    }
  }, [amount, isWithdrawed, withdrawTx, skyConfig.contracts.SavingsUSDS, address, intl]);

  // Compute button text based on transaction states
  const getButtonText = useCallback(() => {
    if (!amount) {
      return intl.formatMessage({ id: 'btn.enterAmount' });
    }

    if (!isWithdrawed) {
      if (withdrawTx.txHash && !withdrawTx.isTxConfirmed) {
        return intl.formatMessage({ id: 'btn.withdrawingUsds' });
      }
      if (withdrawTx.txState === 'error') {
        return intl.formatMessage({ id: 'btn.withdrawalFailedTryAgain' });
      }
      return intl.formatMessage({ id: 'btn.withdraw' });
    }

    return intl.formatMessage({ id: 'btn.success' });
  }, [amount, isWithdrawed, withdrawTx.txHash, withdrawTx.isTxConfirmed, withdrawTx.txState, intl]);

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
          <FormattedMessage id="form.howMuchUsdsWithdraw" />
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
              htmlInput: {
                lang: 'en',
                inputMode: 'decimal',
                'aria-label': intl.formatMessage({ id: 'a11y.amountUsdsWithdraw' }),
                'aria-describedby': 'savings-withdraw-balance'
              }
            }}
            fullWidth
            type="number"
            placeholder={intl.formatMessage({ id: 'form.enterAmountPlaceholder' })}
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
            <UsdsLogo width="24" height="24" aria-hidden />
            <Typography>USDS</Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="textPrimary" id="savings-withdraw-balance">
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
      <Box>
        <Button variant="contained" color="primary" fullWidth sx={{ mt: 2 }} disabled={isButtonDisabled()} onClick={handleMainButtonClick}>
          {getButtonText()}
        </Button>
        <StatusLive message={getButtonText()} />
      </Box>
    </StyledCard>
  );
};

export default Withdraw;
