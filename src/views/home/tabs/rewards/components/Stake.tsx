import { FC } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useEffect, useState, useCallback } from 'react';
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

const Stake: FC<Props> = ({ userBalance = 0n, rewardAddress = '' }) => {
  const [amount, setAmount] = useState<string>('');

  // Track transaction states
  const [approveState, setApproveState] = useState<TxState>('idle');
  const [stakeState, setStakeState] = useState<TxState>('idle');

  // Track whether each transaction step is completed
  const [isApproved, setIsApproved] = useState<boolean>(false);
  const [isDeposited, setIsDeposited] = useState<boolean>(false);

  const { config: skyConfig } = useConfigChainId();

  // Approve transaction hooks
  const {
    writeContract: writeApprove,
    error: approveError,
    isError: isApproveError,
    isSuccess: isApproveSubmitted,
    data: approveTxHash
  } = useWriteContract();

  // Monitor approve transaction receipt
  const {
    isSuccess: isApproveConfirmed,
    isError: isApproveConfirmError,
    error: approveConfirmError
  } = useWaitForTransactionReceipt({
    hash: approveTxHash,
    query: { enabled: !!approveTxHash }
  });

  // Stake transaction hooks
  const {
    writeContract: writeDeposit,
    error: depositError,
    isError: isDepositError,
    isSuccess: isDepositSubmitted,
    data: depositTxHash
  } = useWriteContract();

  // Monitor stake transaction receipt
  const {
    isSuccess: isDepositConfirmed,
    isError: isDepositConfirmError,
    error: depositConfirmError
  } = useWaitForTransactionReceipt({
    hash: depositTxHash,
    query: { enabled: !!depositTxHash }
  });

  // Handle percentage button clicks
  const handlePercentClick = (percent: number) => {
    if (!userBalance) return;
    const value = (Number(formatEther(BigInt(userBalance))) * percent) / 100;
    setAmount(value.toString());
  };

  // Handle approve submission
  useEffect(() => {
    if (isApproveSubmitted && !approveTxHash) return;

    if (isApproveSubmitted) {
      setApproveState('submitted');
      console.log('Approve transaction submitted:', approveTxHash);
    }
  }, [isApproveSubmitted, approveTxHash]);

  // Handle approve confirmation
  useEffect(() => {
    if (!approveTxHash || !isApproveConfirmed) return;

    console.log('Approve transaction confirmed!');
    setApproveState('confirmed');
    setIsApproved(true);
    dispatchSuccess('USDS Approved Successfully!');
  }, [approveTxHash, isApproveConfirmed]);

  // Handle approve errors
  useEffect(() => {
    if (isApproveError || isApproveConfirmError) {
      setApproveState('error');
      console.error('Approval failed:', approveError || approveConfirmError);
      dispatchError('USDS Approve Failed!');
    }
  }, [isApproveError, isApproveConfirmError, approveError, approveConfirmError]);

  // Handle deposit submission
  useEffect(() => {
    if (isDepositSubmitted && !depositTxHash) return;

    if (isDepositSubmitted) {
      setStakeState('submitted');
      console.log('Deposit transaction submitted:', depositTxHash);
    }
  }, [isDepositSubmitted, depositTxHash]);

  // Handle deposit confirmation
  useEffect(() => {
    if (!depositTxHash || !isDepositConfirmed) return;

    console.log('Deposit transaction confirmed!');
    setStakeState('confirmed');
    setIsDeposited(true);
    dispatchSuccess('USDS deposited successfully!');
  }, [depositTxHash, isDepositConfirmed]);

  // Handle deposit errors
  useEffect(() => {
    if (isDepositError || isDepositConfirmError) {
      setStakeState('error');
      console.error('Deposit failed:', depositError || depositConfirmError);
      dispatchError('Deposit failed');
    }
  }, [isDepositError, isDepositConfirmError, depositError, depositConfirmError]);

  // Reset transaction states
  const resetTransactionStates = useCallback(() => {
    if (approveState === 'error') {
      setApproveState('idle');
    }
    if (stakeState === 'error') {
      setStakeState('idle');
    }
  }, [approveState, stakeState]);

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
    console.log('Current states - Approved:', isApproved, 'ApproveState:', approveState, 'DepositState:', stakeState);

    try {
      // Step 1: Approve tokens if not already approved
      if (!isApproved) {
        console.log('Initiating approve transaction...');
        setApproveState('submitting');
        writeApprove({
          ...usdsContractConfig,
          address: skyConfig.contracts.USDS,
          functionName: 'approve',
          args: [rewardAddress as `0x${string}`, BigInt(amountInWei)]
        });
        console.log('Approve transaction submitted');
      }
      // Step 2: Stake tokens if approved but not yet deposited
      else if (isApproved && !isDeposited) {
        console.log('Initiating stake transaction...');
        setStakeState('submitting');
        writeDeposit({
          ...stakingRewardContractConfig,
          address: rewardAddress as `0x${string}`,
          functionName: 'stake',
          args: [BigInt(amountInWei), 1]
        });
        console.log('Stake transaction submitted');
      }
    } catch (error) {
      console.error('Transaction failed:', error);
      if (!isApproved) {
        setApproveState('error');
        dispatchError('Failed to approve USDS');
      } else {
        setStakeState('error');
        dispatchError('Failed to stake USDS');
      }
    }
  }, [
    amount,
    isApproved,
    isDeposited,
    approveState,
    stakeState,
    writeApprove,
    writeDeposit,
    rewardAddress,
    skyConfig.contracts.USDS,
    resetTransactionStates
  ]);

  // Force update isApproved state when approveState changes to confirmed
  useEffect(() => {
    if (approveState === 'confirmed' && !isApproved) {
      console.log('Setting isApproved to true because approveState is confirmed');
      setIsApproved(true);
    }
  }, [approveState, isApproved]);

  // Compute button text based on transaction states
  const getButtonText = () => {
    if (!amount) {
      return 'Enter Amount';
    }

    if (!isApproved) {
      if (approveTxHash && !isApproveConfirmed) {
        return 'Approving USDS...';
      }
      if (approveState === 'error') {
        return 'Approval Failed - Try again';
      }
      return 'Approve USDS';
    }

    if (!isDeposited) {
      if (depositTxHash && !isDepositConfirmed) {
        return 'Staking USDS...';
      }
      if (stakeState === 'error') {
        return 'Staking Failed - Try again';
      }
      return 'Stake USDS';
    }

    return 'Success!';
  };

  // Determine if button should be disabled
  const isButtonDisabled = () => {
    if (!amount) return true;

    // Disable during transactions
    if (approveTxHash && !isApproveConfirmed) return true;
    if (depositTxHash && !isDepositConfirmed) return true;

    // Disable when completed
    if (isDeposited) return true;

    return false;
  };

  return (
    <StyledCard>
      <Box p={0}>
        <Typography variant="body2" sx={{ mb: 2 }}>
          How much USDS would you like to supply?
        </Typography>

        {/* Amount input field */}
        <Box sx={{ display: 'flex', alignItems: 'center', borderBottom: 1, borderColor: 'divider', py: 2, gap: 2 }}>
          <StyledTextField
            fullWidth
            type="number"
            placeholder="Enter amount"
            value={amount}
            disabled={isDeposited || approveState === 'submitted' || stakeState === 'submitted'}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '' || Number(value) >= 0) {
                setAmount(value);
                // Reset states if user changes amount
                if (approveState === 'error' || stakeState === 'error') {
                  setApproveState('idle');
                  setStakeState('idle');
                }
              }
            }}
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
            <PercentButton
              onClick={() => handlePercentClick(25)}
              disabled={isDeposited || approveState === 'submitted' || stakeState === 'submitted'}
            >
              25%
            </PercentButton>
            <PercentButton
              onClick={() => handlePercentClick(50)}
              disabled={isDeposited || approveState === 'submitted' || stakeState === 'submitted'}
            >
              50%
            </PercentButton>
            <PercentButton
              onClick={() => handlePercentClick(100)}
              disabled={isDeposited || approveState === 'submitted' || stakeState === 'submitted'}
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
      </Box>
    </StyledCard>
  );
};

export default Stake;
