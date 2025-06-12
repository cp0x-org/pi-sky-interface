import { Box, Typography, Button } from '@mui/material';
import { FC, useState, useCallback, useEffect } from 'react';
import { ReactComponent as UsdsLogo } from 'assets/images/sky/usds.svg';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { stakingRewardContractConfig } from 'config/abi/StakingReward';
import { StyledCard } from 'components/StyledCard';
import { StyledTextField } from 'components/StyledTextField';
import { formatTokenAmount } from 'utils/formatters';
import { dispatchError, dispatchSuccess } from 'utils/snackbar';
import { PercentButton } from 'components/PercentButton';

interface Props {
  stakedBalance?: string;
  rewardBalance?: bigint;
  rewardAddress?: string;
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

const Withdraw: FC<Props> = ({ stakedBalance = '0', rewardBalance = 0n, rewardAddress = '' }) => {
  const [amount, setAmount] = useState<string>('');
  const [buttonText, setButtonText] = useState<string>('Enter Amount');

  // Use shared transaction hooks
  const withdrawTx = useContractTransaction(rewardAddress);
  const claimTx = useContractTransaction(rewardAddress);

  // Transaction configurations
  const withdrawConfig: TransactionConfig = {
    functionName: 'withdraw',
    args: [],
    successMessage: 'USDS withdrawn successfully!',
    errorSubmitMessage: 'USDS withdraw transaction failed to submit',
    errorConfirmMessage: 'USDS withdraw transaction failed to confirm'
  };

  const claimConfig: TransactionConfig = {
    functionName: 'getReward',
    args: [],
    successMessage: 'SKY claimed successfully!',
    errorSubmitMessage: 'Failed to submit claim transaction',
    errorConfirmMessage: 'Failed to confirm SKY claim transaction'
  };

  // Dispatch transaction messages when transaction state changes
  useEffect(() => {
    withdrawTx.dispatchTxMessages(withdrawConfig);
  }, [withdrawConfig]);

  useEffect(() => {
    claimTx.dispatchTxMessages(claimConfig);
  }, [claimTx.txState]);

  // Handle percentage button clicks
  const handlePercentClick = (percent: number) => {
    if (stakedBalance === '0') return;

    const balance = parseFloat(stakedBalance);
    if (isNaN(balance)) return;

    const value = (balance * percent) / 100;
    setAmount(value.toString());
    setButtonText('Withdraw');
  };

  // Handle amount input change
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
    setButtonText(e.target.value ? 'Withdraw' : 'Enter Amount');
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
      dispatchError('Failed to process withdrawal amount');
    }
  };

  // Handle claim button click
  const handleClaimClick = () => {
    claimTx.executeTransaction(claimConfig);
  };

  // Compute withdraw button text based on state
  const getWithdrawButtonText = () => {
    if (withdrawTx.txHash && !withdrawTx.isTxConfirmed) {
      return 'Processing withdrawal...';
    }

    if (withdrawTx.txState === 'success') {
      return 'Withdrawn';
    }

    return buttonText;
  };

  return (
    <>
      <StyledCard>
        <Box p={0}>
          <Typography variant="body2" sx={{ mb: 2 }}>
            How much USDS would you like to withdraw?
          </Typography>

          {/* Amount input field */}
          <Box sx={{ display: 'flex', alignItems: 'center', borderBottom: 1, borderColor: 'divider', py: 2, gap: 2 }}>
            <StyledTextField fullWidth type="number" placeholder="Enter amount" value={amount} onChange={handleAmountChange} />

            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <UsdsLogo width="24" height="24" />
              <Typography>USDS</Typography>
            </Box>
          </Box>

          {/* Balance and percentage buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="textPrimary">
                {stakedBalance} USDS
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
              <PercentButton onClick={() => handlePercentClick(25)}>25%</PercentButton>
              <PercentButton onClick={() => handlePercentClick(50)}>50%</PercentButton>
              <PercentButton onClick={() => handlePercentClick(100)}>100%</PercentButton>
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
            disabled={!!withdrawTx.txHash && !withdrawTx.isTxConfirmed}
            onClick={handleWithdrawClick}
          >
            {getWithdrawButtonText()}
            {/*{withdrawTx.txHash && !withdrawTx.isTxConfirmed ? 'Processing withdrawal...' : `WIthdraw`}*/}
          </Button>
        </Box>
      </StyledCard>

      {/* Claim button - only shown if rewards are available */}
      {rewardBalance != 0n && (
        <Button
          variant="outlined"
          color="secondary"
          fullWidth
          sx={{ mt: 2 }}
          disabled={!!claimTx.txHash && !claimTx.isTxConfirmed}
          onClick={handleClaimClick}
        >
          {claimTx.txHash && !claimTx.isTxConfirmed ? 'Claiming SKY...' : `Claim ${formatTokenAmount(rewardBalance.toString(), 4)} SKY`}
        </Button>
      )}
    </>
  );
};

export default Withdraw;
