import { Box, Typography, Button, Alert } from '@mui/material';
import { FC, useState, useCallback, useEffect } from 'react';
import { ReactComponent as UsdsLogo } from 'assets/images/sky/usds.svg';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { parseEther } from 'viem';
import { StyledCard } from 'components/StyledCard';
import { StyledTextField } from 'components/StyledTextField';
import { dispatchError, dispatchSuccess } from 'utils/snackbar';
import { PercentButton } from 'components/PercentButton';
import { stUsdsContractConfig } from 'config/abi/StUsds';
import StatusLive from 'components/StatusLive';
import { FormattedMessage, useIntl } from 'react-intl';

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
  const intl = useIntl();
  const [amount, setAmount] = useState('');
  const [buttonText, setButtonText] = useState(intl.formatMessage({ id: 'btn.enterAmount' }));
  const { address } = useAccount();

  const withdrawTx = useContractTransaction(rewardAddress);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const withdrawConfig: TransactionConfig = {
    functionName: 'withdraw',
    args: [0n, '0x', '0x'],
    successMessage: intl.formatMessage({ id: 'tx.usdsWithdrawn' }),
    errorSubmitMessage: intl.formatMessage({ id: 'tx.usdsWithdrawSubmitFailed' }),
    errorConfirmMessage: intl.formatMessage({ id: 'tx.usdsWithdrawConfirmFailed' })
  };

  useEffect(() => {
    withdrawTx.dispatchTxMessages(withdrawConfig);
  }, [withdrawTx.txState, withdrawConfig, withdrawTx]);

  const handlePercentClick = (percent: number) => {
    const balance = parseFloat(maxWithdrawBalance);
    if (!balance) return;

    const value = (balance * percent) / 100;
    setAmount(value.toString());
    setButtonText(intl.formatMessage({ id: 'btn.withdraw' }));
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
    setButtonText(intl.formatMessage({ id: e.target.value ? 'btn.withdraw' : 'btn.enterAmount' }));
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
      dispatchError(intl.formatMessage({ id: 'tx.failedProcessWithdrawAmount' }));
    }
  };

  const getWithdrawButtonText = () => {
    if (withdrawTx.txHash && !withdrawTx.isTxConfirmed) return intl.formatMessage({ id: 'btn.processingWithdrawal' });
    if (withdrawTx.txState === 'success') return intl.formatMessage({ id: 'btn.withdrawn' });
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
          <FormattedMessage id="form.howMuchUsdsWithdraw" />
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', borderBottom: 1, borderColor: 'divider', py: 2, gap: 2 }}>
          <StyledTextField
            slotProps={{
              htmlInput: {
                lang: 'en',
                inputMode: 'decimal',
                'aria-label': intl.formatMessage({ id: 'a11y.amountUsdsWithdraw' }),
                'aria-describedby': 'expert-withdraw-balance'
              }
            }}
            fullWidth
            type="number"
            placeholder={intl.formatMessage({ id: 'form.enterAmountPlaceholder' })}
            value={amount}
            onChange={handleAmountChange}
            disabled={withdrawTx.txState === 'processing' || withdrawTx.isCompleted}
          />
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <UsdsLogo width="24" height="24" aria-hidden />
            <Typography>USDS</Typography>
          </Box>
        </Box>

        {parseFloat(maxWithdrawBalance || '0') === 0 && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <FormattedMessage id="expert.liquidityExhausted" />
          </Alert>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
          <Typography variant="body2" color="textPrimary" id="expert-withdraw-balance">
            {maxWithdrawBalance} USDS
          </Typography>
          <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 1 }}>
            <PercentButton
              onClick={() => handlePercentClick(25)}
              aria-label={intl.formatMessage({ id: 'a11y.setPercent' }, { percent: 25 })}
            >
              25%
            </PercentButton>
            <PercentButton
              onClick={() => handlePercentClick(50)}
              aria-label={intl.formatMessage({ id: 'a11y.setPercent' }, { percent: 50 })}
            >
              50%
            </PercentButton>
            <PercentButton
              onClick={() => handlePercentClick(100)}
              aria-label={intl.formatMessage({ id: 'a11y.setPercent' }, { percent: 100 })}
            >
              100%
            </PercentButton>
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
        <StatusLive message={getWithdrawButtonText()} />
      </Box>
    </StyledCard>
  );
};

export default Withdraw;
