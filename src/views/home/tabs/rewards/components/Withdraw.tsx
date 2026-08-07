import { Box, Typography, Button } from '@mui/material';
import { FC, useState, useCallback, useEffect } from 'react';
import { ReactComponent as UsdsLogo } from 'assets/images/sky/usds.svg';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import { stakingRewardContractConfig } from 'config/abi/StakingReward';
import { StyledCard } from 'components/StyledCard';
import { StyledTextField } from 'components/StyledTextField';
import { formatTokenAmount } from 'utils/formatters';
import { dispatchError, dispatchSuccess } from 'utils/snackbar';
import { PercentButton } from 'components/PercentButton';
import { formatUSDS } from 'utils/sky';
import StatusLive from 'components/StatusLive';
import { FormattedMessage, useIntl } from 'react-intl';

interface Props {
  stakedBalance?: string;
  rewardBalance?: bigint;
  rewardAddress?: string;
  tokenSymbol: string;
}

// Unified transaction hook configuration
interface TransactionConfig {
  functionName: 'withdraw' | 'getReward';
  args: readonly [] | readonly [bigint] | undefined;
  successMessage: string;
  errorSubmitMessage: string;
  errorConfirmMessage: string;
}

// Custom hook for handling blockchain transactions
const useContractTransaction = (rewardAddress: string) => {
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
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

  // Handle transaction state updates
  useEffect(() => {
    if (isTxSubmitted && txState === 'idle') {
      setTxState('processing');
    } else if (isTxConfirmed && txState === 'processing') {
      setIsCompleted(true);
      setTxState('success');
    } else if (isTxError && txState !== 'error') {
      console.error('Transaction submission failed:', txError);
      setTxState('error');
    } else if (isTxConfirmError && txConfirmError && txState !== 'error') {
      console.error('Transaction confirmation failed:', txConfirmError);
      setTxState('error');
    }
  }, [isTxSubmitted, isTxConfirmed, isTxError, isTxConfirmError, txError, txConfirmError, txState]);

  // Execute transaction with provided configuration
  const executeTransaction = useCallback(
    (config: TransactionConfig) => {
      if (isCompleted || !!txHash) return;

      try {
        writeContract({
          ...stakingRewardContractConfig,
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

  return {
    executeTransaction,
    isCompleted,
    txState,
    txHash,
    isTxConfirmed,
    dispatchTxMessages: (config: Pick<TransactionConfig, 'successMessage' | 'errorSubmitMessage' | 'errorConfirmMessage'>) => {
      if (txState === 'success') {
        dispatchSuccess(config.successMessage);
      } else if (isTxError) {
        dispatchError(config.errorSubmitMessage);
      } else if (isTxConfirmError) {
        dispatchError(config.errorConfirmMessage);
      }
    }
  };
};

const Withdraw: FC<Props> = ({ stakedBalance = '0', rewardBalance = 0n, rewardAddress = '', tokenSymbol = '' }) => {
  const intl = useIntl();
  const [amount, setAmount] = useState<string>('');
  const [buttonText, setButtonText] = useState<string>(intl.formatMessage({ id: 'btn.enterAmount' }));

  // Use shared transaction hooks
  const withdrawTx = useContractTransaction(rewardAddress);
  const claimTx = useContractTransaction(rewardAddress);

  // Transaction configurations
  const withdrawConfig: TransactionConfig = {
    functionName: 'withdraw',
    args: [],
    successMessage: intl.formatMessage({ id: 'tx.usdsWithdrawn' }),
    errorSubmitMessage: intl.formatMessage({ id: 'tx.usdsWithdrawSubmitFailed' }),
    errorConfirmMessage: intl.formatMessage({ id: 'tx.usdsWithdrawConfirmFailed' })
  };

  const claimConfig: TransactionConfig = {
    functionName: 'getReward',
    args: [],
    successMessage: intl.formatMessage({ id: 'tx.rewardClaimed' }, { symbol: tokenSymbol }),
    errorSubmitMessage: intl.formatMessage({ id: 'tx.claimSubmitFailed' }),
    errorConfirmMessage: intl.formatMessage({ id: 'tx.claimConfirmFailed' }, { symbol: tokenSymbol })
  };

  // Dispatch transaction messages when transaction state changes
  useEffect(() => {
    withdrawTx.dispatchTxMessages(withdrawConfig);
  }, [withdrawConfig]);

  useEffect(() => {
    claimTx.dispatchTxMessages(claimConfig);
  }, [claimTx.txState]);

  const handlePercentClick = (percent: number) => {
    if (stakedBalance === '0') return;

    try {
      const balanceBigInt = parseEther(stakedBalance); // 18 для токенов с 18 decimals

      const valueBigInt = (balanceBigInt * BigInt(percent)) / BigInt(100);

      setAmount(formatEther(valueBigInt));

      setButtonText(intl.formatMessage({ id: 'btn.withdraw' }));
    } catch (e) {
      console.error('Invalid staked balance', e);
    }
  };

  // Handle amount input change
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
    setButtonText(intl.formatMessage({ id: e.target.value ? 'btn.withdraw' : 'btn.enterAmount' }));
  };

  // Handle withdraw button click
  const handleWithdrawClick = () => {
    if (!amount) return;

    try {
      const amountInWei = parseEther(amount);
      withdrawTx.executeTransaction({
        ...withdrawConfig,
        args: [BigInt(amountInWei)] as readonly [bigint]
      });
    } catch (error) {
      console.error('Error preparing withdrawal:', error);
      dispatchError(intl.formatMessage({ id: 'tx.failedProcessWithdrawAmount' }));
    }
  };

  // Handle claim button click
  const handleClaimClick = () => {
    claimTx.executeTransaction(claimConfig);
  };

  // Compute withdraw button text based on state
  const getWithdrawButtonText = () => {
    if (withdrawTx.txHash && !withdrawTx.isTxConfirmed) {
      return intl.formatMessage({ id: 'btn.processingWithdrawal' });
    }

    if (withdrawTx.txState === 'success') {
      return intl.formatMessage({ id: 'btn.withdrawn' });
    }

    return buttonText;
  };

  // Determine if withdraw button should be disabled
  const isWithdrawButtonDisabled = useCallback(() => {
    if (!amount) return true;

    // Disable during processing
    if (withdrawTx.txHash && !withdrawTx.isTxConfirmed) return true;

    // Disable when completed
    if (withdrawTx.isCompleted) return true;

    // Disable if staked balance is zero
    if (parseFloat(stakedBalance) <= 0) return true;

    return false;
  }, [amount, withdrawTx.txHash, withdrawTx.isTxConfirmed, withdrawTx.isCompleted, stakedBalance]);

  // Determine if claim button should be disabled
  const isClaimButtonDisabled = useCallback(() => {
    // Disable during processing
    if (claimTx.txHash && !claimTx.isTxConfirmed) return true;

    // Disable when completed
    if (claimTx.isCompleted) return true;

    // Disable if no rewards
    if (rewardBalance <= 0n) return true;

    return false;
  }, [claimTx.txHash, claimTx.isTxConfirmed, claimTx.isCompleted, rewardBalance]);

  // Monitor transaction states (for debugging)
  useEffect(() => {
    console.log('Withdraw Transaction State:', {
      txState: withdrawTx.txState,
      isCompleted: withdrawTx.isCompleted,
      hash: withdrawTx.txHash ? `${withdrawTx.txHash.slice(0, 6)}...` : null,
      confirmed: withdrawTx.isTxConfirmed
    });
  }, [withdrawTx.txState, withdrawTx.isCompleted, withdrawTx.txHash, withdrawTx.isTxConfirmed]);

  useEffect(() => {
    console.log('Claim Transaction State:', {
      txState: claimTx.txState,
      isCompleted: claimTx.isCompleted,
      hash: claimTx.txHash ? `${claimTx.txHash.slice(0, 6)}...` : null,
      confirmed: claimTx.isTxConfirmed
    });
  }, [claimTx.txState, claimTx.isCompleted, claimTx.txHash, claimTx.isTxConfirmed]);

  return (
    <>
      <StyledCard>
        <Box p={0}>
          <Typography variant="body2" sx={{ mb: 2 }}>
            <FormattedMessage id="form.howMuchUsdsWithdraw" />
          </Typography>

          {/* Amount input field */}
          <Box sx={{ display: 'flex', alignItems: 'center', borderBottom: 1, borderColor: 'divider', py: 2, gap: 2 }}>
            <StyledTextField
              slotProps={{
                htmlInput: {
                  lang: 'en',
                  inputMode: 'decimal',
                  'aria-label': intl.formatMessage({ id: 'a11y.amountUsdsWithdraw' }),
                  'aria-describedby': 'rewards-withdraw-balance'
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

          {/* Balance and percentage buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="textPrimary" id="rewards-withdraw-balance">
                {formatUSDS(stakedBalance)} USDS
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
        </Box>

        {/* Withdraw button */}
        <Box>
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

      {/* Claim button - only shown if rewards are available */}
      {rewardBalance != 0n && (
        <Button variant="outlined" color="secondary" fullWidth sx={{ mt: 2 }} disabled={isClaimButtonDisabled()} onClick={handleClaimClick}>
          {claimTx.txHash && !claimTx.isTxConfirmed
            ? intl.formatMessage({ id: 'btn.claimingToken' }, { symbol: tokenSymbol })
            : intl.formatMessage(
                { id: 'btn.claimAmount' },
                { amount: formatTokenAmount(rewardBalance.toString(), 4), symbol: tokenSymbol }
              )}
        </Button>
      )}
    </>
  );
};

export default Withdraw;
