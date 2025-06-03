import { useMemo, useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import { Step, StepLabel, Stepper, Typography, Stack, Alert } from '@mui/material';
import StakeAndBorrow from './Stake/StakeAndBorrow';
import Reward from './Stake/Reward';
import Delegate from './Stake/Delegate';
import Confirm from './Stake/Confirm';
import { encodeFunctionData, parseEther } from 'viem';
import { lockStakeContractConfig } from 'config/abi/LockStackeEngine';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { useConfigChainId } from '../../../hooks/useConfigChainId';
import { usdsContractConfig } from '../../../config/abi/Usds';

const steps = ['Stake and Borrow', 'Select reward', 'Select a delegate', 'Confirm'];

export default function StakeTab() {
  const { address } = useAccount();
  const { config: skyConfig } = useConfigChainId();

  const [activeStep, setActiveStep] = useState(0);
  const [stakeData, setStakeData] = useState({
    amount: '',
    rewardAddress: '',
    delegatorAddress: ''
  });

  // Approval state
  const [isApproved, setIsApproved] = useState(false);
  const [isStaked, setIsStaked] = useState(false);
  const [confirmButtonText, setConfirmButtonText] = useState('Approve SKY');

  const { data: userBalance } = useReadContract({
    ...usdsContractConfig,
    address: skyConfig.contracts.SKY,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address
    }
  });

  const callDataArray = useMemo(() => {
    if (!address || !stakeData.amount) return [];

    const dataArray = [
      encodeFunctionData({
        abi: lockStakeContractConfig.abi,
        functionName: 'open',
        args: [3n]
      }),
      encodeFunctionData({
        abi: lockStakeContractConfig.abi,
        functionName: 'lock',
        args: [address, 3n, parseEther(stakeData.amount), 1]
      }),
      encodeFunctionData({
        abi: lockStakeContractConfig.abi,
        functionName: 'selectFarm',
        args: [address, 3n, skyConfig.contracts.USDSStakingRewards, 1]
      })
    ];

    // Only add delegate selection if an address was provided
    if (stakeData.delegatorAddress) {
      dataArray.push(
        encodeFunctionData({
          abi: lockStakeContractConfig.abi,
          functionName: 'selectVoteDelegate',
          args: [address, 3n, `0x${stakeData.delegatorAddress.replace(/^0x/, '')}`]
        })
      );
    }

    return dataArray;
  }, [address, stakeData, skyConfig]);

  const {
    writeContract: writeConfirm,
    isSuccess: isConfirmSuccess,
    isPending: isConfirmPending,
    error: confirmError,
    data: confirmData
  } = useWriteContract();

  const {
    writeContract: writeApprove,
    isSuccess: isApproveSuccess,
    isPending: isApprovePending,
    error: approveError,
    isError: isApproveError
  } = useWriteContract();

  useEffect(() => {
    if (isApproveSuccess) {
      setIsApproved(true);
      setConfirmButtonText('Confirm Staking');
    }
    if (isApproveError) {
      console.error('Approval failed:', approveError);
      setConfirmButtonText('Approve SKY');
    }
    if (isConfirmSuccess) {
      setIsStaked(true);
      setConfirmButtonText('Success!');
    }
    if (confirmError) {
      console.error('Staking failed:', confirmError);
      setConfirmButtonText('Error');
    }
  }, [isApproveSuccess, isApproveError, approveError, isConfirmSuccess, confirmError]);

  const isValidEthereumAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const handleChange = (field: keyof typeof stakeData, value: string) => {
    if (field === 'amount') {
      if (!value || isNaN(Number(value))) {
        return;
      }
    }

    if ((field === 'rewardAddress' || field === 'delegatorAddress') && value) {
      if (!isValidEthereumAddress(value)) {
        return;
      }
    }

    setStakeData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      handleSubmit();
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSkip = () => {
    // Clear delegator address and move to next step
    setStakeData((prev) => ({ ...prev, delegatorAddress: '' }));
    setActiveStep((prev) => prev + 1);
  };

  async function handleSubmit() {
    if (!address || callDataArray.length === 0) return;

    try {
      if (!isApproved) {
        writeApprove({
          ...usdsContractConfig,
          address: skyConfig.contracts.SKY,
          functionName: 'approve',
          args: [skyConfig.contracts.LockStakeEngine, parseEther(stakeData.amount)]
        });
      } else if (!isStaked) {
        writeConfirm({
          address: skyConfig.contracts.LockStakeEngine,
          abi: lockStakeContractConfig.abi,
          functionName: 'multicall',
          args: [callDataArray]
        });
      }
    } catch (error) {
      console.error('Transaction failed:', error);
      setIsApproved(false);
      setIsStaked(false);
      setConfirmButtonText('Approve SKY');
    }
  }

  const isNextButtonDisabled = () => {
    // Always disable if wallet is not connected
    if (!address) {
      return true;
    }

    // On confirm step
    if (activeStep === steps.length - 1) {
      if (!isApproved) {
        return isApprovePending || !stakeData.amount;
      } else {
        return isConfirmPending || isStaked;
      }
    }

    // First step validation
    if (activeStep === 0) {
      return !stakeData.amount;
    }

    // Second step validation
    if (activeStep === 1) {
      return !stakeData.rewardAddress;
    }

    // Third step validation
    if (activeStep === 2) {
      return !stakeData.delegatorAddress;
    }

    return false;
  };

  const getStepComponent = () => {
    switch (activeStep) {
      case 0:
        return <StakeAndBorrow userBalance={userBalance} amount={stakeData.amount} onChange={(v) => handleChange('amount', v)} />;
      case 1:
        return <Reward rewardAddress={stakeData.rewardAddress} onChange={(v) => handleChange('rewardAddress', v)} />;
      case 2:
        return <Delegate delegatorAddress={stakeData.delegatorAddress} onChange={(v) => handleChange('delegatorAddress', v)} />;
      case 3:
        return <Confirm stakeData={stakeData} isApproved={isApproved} isStaked={isStaked} />;
      default:
        return null;
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h2" gutterBottom>
        Staking Engine
      </Typography>
      <Card sx={{ my: 2, p: 2 }}>
        <Stepper activeStep={activeStep}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ mt: 4 }}>{getStepComponent()}</Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {!address && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Please connect your wallet to continue with staking.
            </Alert>
          )}

          {activeStep === steps.length - 1 && isConfirmSuccess && confirmData?.hash && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Transaction sent: {confirmData.hash}
            </Alert>
          )}

          {activeStep === steps.length - 1 && confirmError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Error: {confirmError.message}
            </Alert>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Button disabled={activeStep === 0} onClick={handleBack}>
              Back
            </Button>

            {activeStep === 2 ? (
              <Stack direction="row" spacing={2}>
                <Button variant="outlined" onClick={handleSkip} disabled={!address}>
                  Skip
                </Button>
                <Button variant="contained" onClick={handleNext} disabled={isNextButtonDisabled()}>
                  Next
                </Button>
              </Stack>
            ) : (
              <Button variant="contained" onClick={handleNext} disabled={isNextButtonDisabled()}>
                {activeStep === steps.length - 1 ? confirmButtonText : 'Next'}
              </Button>
            )}
          </Box>
        </Box>
      </Card>
    </Box>
  );
}
