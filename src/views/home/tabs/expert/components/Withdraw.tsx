import { Box, Typography, Button } from '@mui/material';
import { FC, useState, useCallback, useEffect } from 'react';
import { ReactComponent as UsdsLogo } from 'assets/images/sky/usds.svg';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { parseEther } from 'viem';
import { StyledCard } from 'components/StyledCard';
import { StyledTextField } from 'components/StyledTextField';
import { dispatchError, dispatchSuccess } from 'utils/snackbar';
import { PercentButton } from 'components/PercentButton';
import { stUsdsContractConfig } from 'config/abi/StUsds';

interface Props {
  maxWithdrawBalance?: string;
  maxWithdrawBalanceRaw?: bigint;
  rewardAddress?: string;
}

interface TransactionConfig {
  functionName: 'withdraw';
  args: readonly [bigint, `0x${string}`, `0x${string}`];
  successMessage: string;
  errorSubmitMessage: string;
  errorConfirmMessage: string;
}

const useContractTransaction = (rewardAddress: string) => {
  const [isCompleted, setIsCompleted] = useState(false);
  const [txState, setTxState] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

  const { writeContract, error: txError, isError: isTxError, isSuccess: isTxSubmitted, data: txHash } = useWriteContract();

  const {
    isSuccess: isTxConfirmed,
    isError: isTxConfirmError,
    error: txConfirmError
  } = useWaitForTransactionReceipt({
    hash: txHash,
    query: { enabled: !!txHash }
  });

  useEffect(() => {
    if (isTxSubmitted && txState === 'idle') {
      setTxState('processing');
    } else if (isTxConfirmed && txState === 'processing') {
      setTxState('success');
      setIsCompleted(true);
    } else if (isTxError && txState !== 'error') {
      console.error('Transaction submission failed:', txError);
      setTxState('error');
    } else if (isTxConfirmError && txConfirmError && txState !== 'error') {
      console.error('Transaction confirmation failed:', txConfirmError);
      setTxState('error');
    }
  }, [isTxSubmitted, isTxConfirmed, isTxError, isTxConfirmError, txError, txConfirmError, txState]);

  const executeTransaction = useCallback(
    (config: TransactionConfig) => {
      if (isCompleted || !!txHash) return;

      try {
        writeContract({
          ...stUsdsContractConfig,
          address: rewardAddress as `0x${string}`,
          functionName: config.functionName,
          args: config.args
        });
      } catch (error) {
        console.error(`Transaction failed (${config.functionName}):`, error);
        setTxState('error');
        dispatchError(config.errorSubmitMessage);
      }
    },
    [isCompleted, txHash, writeContract, rewardAddress]
  );

  const dispatchTxMessages = useCallback(
    (config: Pick<TransactionConfig, 'successMessage' | 'errorSubmitMessage' | 'errorConfirmMessage'>) => {
      if (txState === 'success') {
        dispatchSuccess(config.successMessage);
      } else if (isTxError) {
        dispatchError(config.errorSubmitMessage);
      } else if (isTxConfirmError) {
        dispatchError(config.errorConfirmMessage);
      }
    },
    [txState, isTxError, isTxConfirmError]
  );

  return {
    executeTransaction,
    isCompleted,
    txState,
    txHash,
    isTxConfirmed,
    dispatchTxMessages
  };
};

const Withdraw: FC<Props> = ({ maxWithdrawBalance = '0', maxWithdrawBalanceRaw = 0n, rewardAddress = '' }) => {
  const [amount, setAmount] = useState('');
  const [buttonText, setButtonText] = useState('Enter Amount');
  const { address } = useAccount();

  const withdrawTx = useContractTransaction(rewardAddress);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const withdrawConfig: TransactionConfig = {
    functionName: 'withdraw',
    args: [0n, '0x', '0x'],
    successMessage: 'USDS withdrawn successfully!',
    errorSubmitMessage: 'USDS withdraw transaction failed to submit',
    errorConfirmMessage: 'USDS withdraw transaction failed to confirm'
  };

  useEffect(() => {
    withdrawTx.dispatchTxMessages(withdrawConfig);
  }, [withdrawTx.txState, withdrawConfig, withdrawTx]);

  const handlePercentClick = (percent: number) => {
    const balance = parseFloat(maxWithdrawBalance);
    if (!balance) return;

    const value = (balance * percent) / 100;
    setAmount(value.toString());
    setButtonText('Withdraw');
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
    setButtonText(e.target.value ? 'Withdraw' : 'Enter Amount');
  };

  const handleWithdrawClick = () => {
    if (!amount || !address) return;

    try {
      const amountInWei = parseEther(amount);
      withdrawTx.executeTransaction({
        ...withdrawConfig,
        args: [BigInt(amountInWei), address, address]
      });
    } catch (error) {
      console.error('Error preparing withdrawal:', error);
      dispatchError('Failed to process withdrawal amount');
    }
  };

  const getWithdrawButtonText = () => {
    if (withdrawTx.txHash && !withdrawTx.isTxConfirmed) return 'Processing withdrawal...';
    if (withdrawTx.txState === 'success') return 'Withdrawn';
    return buttonText;
  };

  const isWithdrawButtonDisabled = useCallback(() => {
    if (!amount) return true;
    if (withdrawTx.txState === 'processing') return true;
    if (withdrawTx.isCompleted) return true;
    if (parseFloat(maxWithdrawBalance) <= 0) return true;
    return false;
  }, [amount, withdrawTx.txState, withdrawTx.isCompleted, maxWithdrawBalance]);

  return (
    <StyledCard>
      <Box p={0}>
        <Typography variant="body2" sx={{ mb: 2 }}>
          How much USDS would you like to withdraw?
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', borderBottom: 1, borderColor: 'divider', py: 2, gap: 2 }}>
          <StyledTextField
            slotProps={{ input: { lang: 'en' } }}
            fullWidth
            type="number"
            placeholder="Enter amount"
            value={amount}
            onChange={handleAmountChange}
            disabled={withdrawTx.txState === 'processing' || withdrawTx.isCompleted}
          />
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <UsdsLogo width="24" height="24" />
            <Typography>USDS</Typography>
          </Box>
        </Box>

        {parseFloat(maxWithdrawBalance || '0') === 0 && (
          <Typography variant="body1" color="orange">
            Available liquidity exhausted. Withdrawals are temporarily unavailable.
          </Typography>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
          <Typography variant="body2" color="textPrimary">
            {maxWithdrawBalance} USDS
          </Typography>
          <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 1 }}>
            <PercentButton onClick={() => handlePercentClick(25)}>25%</PercentButton>
            <PercentButton onClick={() => handlePercentClick(50)}>50%</PercentButton>
            <PercentButton onClick={() => handlePercentClick(100)}>100%</PercentButton>
          </Box>
        </Box>

        <Button
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mt: 2 }}
          disabled={isWithdrawButtonDisabled()}
          onClick={handleWithdrawClick}
        >
          {getWithdrawButtonText()}
        </Button>
      </Box>
    </StyledCard>
  );
};

export default Withdraw;
