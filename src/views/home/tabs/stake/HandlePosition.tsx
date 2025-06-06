import { useMemo, useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import { Step, StepLabel, Stepper, Stack, Alert, Typography, Grid, CardContent, CardHeader } from '@mui/material';
import { IconExternalLink } from '@tabler/icons-react';
import StakeAndBorrow from './StakeAndBorrow';
import Reward from './Reward';
import Delegate from './Delegate';
import Confirm from './Confirm';
import { encodeFunctionData, parseEther } from 'viem';
import { lockStakeContractConfig } from 'config/abi/LockStackeEngine';
import { useAccount, useReadContract, useWriteContract, useSimulateContract } from 'wagmi';
import { Config, readContract } from '@wagmi/core';
import { formatEther } from 'viem';
import { formatUSDS } from 'utils/sky';
import { useConfigChainId } from 'hooks/useConfigChainId';
import { usdsContractConfig } from 'config/abi/Usds';
import { SkyContracts, SkyIcons } from 'config/index';
import { useConfig } from 'wagmi';
import StakingSummary from './StakingSummary';

const steps = ['Stake', 'Select reward', 'Select a delegate', 'Confirm'];

type SkyConfig = {
  readonly contracts: SkyContracts;
  readonly features: {}; // можно уточнить тип, если появится
  readonly icons: SkyIcons;
};

async function fetchUrnsCount(skyConfig: SkyConfig, config: Config, address: `0x${string}` | undefined) {
  if (!address) return undefined;

  const result = await readContract(config, {
    abi: lockStakeContractConfig.abi,
    address: skyConfig.contracts.LockStakeEngine, // <-- обязательно!
    functionName: 'ownerUrnsCount',
    args: [address]
  });

  return result as bigint;
}

export default function HandlePosition() {
  const { address } = useAccount();
  const { config: skyConfig } = useConfigChainId();
  const config = useConfig();
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
  const [simulationInProgress, setSimulationInProgress] = useState(false);
  const [nextUrnIdx, setNextUrnIdx] = useState<bigint>(0n);

  // Get user balance
  const { data: userBalance } = useReadContract({
    ...usdsContractConfig,
    address: skyConfig.contracts.SKY,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address
    }
  });

  // Check allowance to determine if approval is needed
  const { data: allowanceData, refetch: refetchAllowance } = useReadContract({
    ...usdsContractConfig,
    address: skyConfig.contracts.SKY,
    functionName: 'allowance',
    args: address ? [address, skyConfig.contracts.LockStakeEngine] : undefined,
    query: {
      enabled: !!address
    }
  });

  // Simulate approve transaction
  const { isError: isSimulateApproveError, error: simulateApproveError } = useSimulateContract({
    ...usdsContractConfig,
    address: skyConfig.contracts.SKY,
    functionName: 'approve',
    args: address && stakeData.amount ? [skyConfig.contracts.LockStakeEngine, parseEther(stakeData.amount)] : undefined,
    query: {
      enabled: !!address && !!stakeData.amount && !isApproved
    }
  });

  useEffect(() => {
    if (!address) return;

    const getUrnsCount = async () => {
      const count = await fetchUrnsCount(skyConfig, config, address);
      setNextUrnIdx(count ?? 0n);
    };

    getUrnsCount();
  }, [address, skyConfig]);

  const callDataArray = useMemo(() => {
    if (!address || !stakeData.amount || !stakeData.rewardAddress || !stakeData.delegatorAddress) return [];

    const dataArray = [
      encodeFunctionData({
        abi: lockStakeContractConfig.abi,
        functionName: 'open',
        args: [nextUrnIdx]
      }),
      encodeFunctionData({
        abi: lockStakeContractConfig.abi,
        functionName: 'lock',
        args: [address, nextUrnIdx, parseEther(stakeData.amount), 1]
      }),
      encodeFunctionData({
        abi: lockStakeContractConfig.abi,
        functionName: 'selectFarm',
        args: [address, nextUrnIdx, skyConfig.contracts.USDSStakingRewards, 1]
      })
    ];

    if (stakeData.delegatorAddress) {
      dataArray.push(
        encodeFunctionData({
          abi: lockStakeContractConfig.abi,
          functionName: 'selectVoteDelegate',
          args: [address, nextUrnIdx, `0x${stakeData.delegatorAddress.replace(/^0x/, '')}`]
        })
      );
    }

    return dataArray;
  }, [address, stakeData.amount, stakeData.rewardAddress, stakeData.delegatorAddress, nextUrnIdx, skyConfig.contracts.USDSStakingRewards]);

  // Simulate confirm transaction
  const {
    isError: isSimulateConfirmError,
    error: simulateConfirmError,
    refetch: refetchConfirmSimulation
  } = useSimulateContract({
    address: skyConfig.contracts.LockStakeEngine,
    abi: lockStakeContractConfig.abi,
    functionName: 'multicall',
    args: callDataArray.length > 0 ? [callDataArray] : undefined,
    query: {
      enabled: !!address && callDataArray.length > 0 && isApproved && !isStaked
    }
  });

  // Effect to check if approval is needed when amount changes or allowance updates
  useEffect(() => {
    if (address && stakeData.amount && allowanceData) {
      try {
        const amountBigInt = parseEther(stakeData.amount);
        if (allowanceData >= amountBigInt) {
          // Already approved enough tokens
          setIsApproved(true);
          setConfirmButtonText('Confirm Staking');
          // Run simulation for confirmation since we're skipping approval
          refetchConfirmSimulation();
        } else {
          setIsApproved(false);
          setConfirmButtonText('Approve SKY');
        }
      } catch (error) {
        console.error('Error checking allowance:', error);
      }
    }
  }, [address, stakeData.amount, allowanceData, refetchConfirmSimulation]);

  const { writeContract: writeConfirm, isSuccess: isConfirmSuccess, isPending: isConfirmPending, error: confirmError } = useWriteContract();

  const {
    writeContract: writeApprove,
    isSuccess: isApproveSuccess,
    isPending: isApprovePending,
    error: approveError,
    isError: isApproveError
  } = useWriteContract();

  useEffect(() => {
    console.log('Transaction status changed:', {
      isApproveSuccess,
      isApproveError,
      isConfirmSuccess,
      hasApproveError: !!approveError,
      hasConfirmError: !!confirmError
    });

    if (isApproveSuccess) {
      console.log('Approval successful!');
      setIsApproved(true);
      setConfirmButtonText('Confirm Staking');
      // After successful approval, run simulation for the confirm transaction
      if (refetchConfirmSimulation) {
        console.log('Fetching confirmation simulation...');
        refetchConfirmSimulation();
      }
      // Also refresh allowance
      if (refetchAllowance) {
        console.log('Refreshing allowance...');
        refetchAllowance();
      }
    }
    if (isApproveError) {
      console.error('Approval failed:', approveError);
      setConfirmButtonText('Approve SKY');
    }
    if (isConfirmSuccess) {
      console.log('Staking confirmed successfully!');
      setIsStaked(true);
      setConfirmButtonText('Success!');
    }
    if (confirmError) {
      console.error('Staking failed:', confirmError);
      setConfirmButtonText('Error');
    }
  }, [isApproveSuccess, isApproveError, approveError, isConfirmSuccess, confirmError]);

  // Effect to update button text based on simulation status
  useEffect(() => {
    if (!isApproved && simulationInProgress) {
      setConfirmButtonText('Simulating...');
    } else if (!isApproved && !simulationInProgress) {
      setConfirmButtonText('Approve SKY');
    }

    // Debug logging
    console.log('Button state updated:', {
      isApproved,
      simulationInProgress,
      confirmButtonText,
      allowance: allowanceData ? allowanceData.toString() : 'unknown'
    });
  }, [isApproved, simulationInProgress, allowanceData]);

  const isValidEthereumAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const handleChange = (field: keyof typeof stakeData, value: string) => {
    if (field === 'amount') {
      if (!value || isNaN(Number(value))) {
        return;
      }

      // Check allowance again when amount changes
      if (address && value) {
        refetchAllowance();
      }

      // Note: We accept values that exceed balance, but StakeAndBorrow will show an error
      // The Next button will still be enabled, but we'll guide users with validation UI
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

      // When reaching the final step, check allowance
      if (activeStep === 2 && address && stakeData.amount) {
        refetchAllowance();
      }
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
    if (!address || !stakeData.amount) {
      console.log('Missing address or stake amount');
      return;
    }

    // Check if amount exceeds balance
    if (userBalance) {
      try {
        const amountBigInt = parseEther(stakeData.amount);
        if (amountBigInt > userBalance) {
          console.error('Amount exceeds balance', {
            amount: stakeData.amount,
            balance: formatEther(userBalance)
          });
          // We still allow the transaction to go through, as the blockchain will reject it
          // This is just to log the issue
        }
      } catch (error) {
        console.error('Error checking balance:', error);
      }
    }

    try {
      // If not approved and approval needed
      if (!isApproved) {
        console.log('Starting approval process...');

        // Check allowance first
        await refetchAllowance();
        console.log('Current allowance:', allowanceData ? allowanceData.toString() : 'unknown');

        // Skip approval if allowance is sufficient
        if (allowanceData && stakeData.amount) {
          const amountBigInt = parseEther(stakeData.amount);
          if (allowanceData >= amountBigInt) {
            console.log('Allowance is sufficient, skipping approval');
            setIsApproved(true);
            setConfirmButtonText('Confirm Staking');
            // Run simulation for confirmation since we're skipping approval
            await refetchConfirmSimulation();
            handleSubmit(); // Call again to handle confirmation
            return;
          }
        }

        console.log('Sending approval transaction...');
        // Directly send the approval transaction without gas calculation
        writeApprove({
          address: skyConfig.contracts.SKY,
          abi: usdsContractConfig.abi,
          functionName: 'approve',
          args: [skyConfig.contracts.LockStakeEngine, parseEther(stakeData.amount)]
        });

        console.log('Approval transaction sent');
      }
      // If approved but not staked yet
      else if (!isStaked) {
        console.log('Starting confirmation process...');

        if (!callDataArray.length) {
          console.error('Call data array is empty');
          return;
        }

        console.log('Sending confirmation transaction...');
        // Directly send the confirmation transaction
        writeConfirm({
          address: skyConfig.contracts.LockStakeEngine,
          abi: lockStakeContractConfig.abi,
          functionName: 'multicall',
          args: [callDataArray]
        });

        console.log('Confirmation transaction sent');
      }
    } catch (error) {
      console.error('Transaction failed:', error);
      setIsApproved(false);
      setIsStaked(false);
      setConfirmButtonText('Approve SKY');
      setSimulationInProgress(false);
    }
  }

  const isNextButtonDisabled = () => {
    // Always disable if wallet is not connected
    if (!address) {
      return true;
    }

    // On confirm step
    if (activeStep === steps.length - 1) {
      if (simulationInProgress) {
        return true;
      }

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
        return <StakeAndBorrow userBalance={userBalance} stakedAmount={stakeData.amount} onChange={(v) => handleChange('amount', v)} />;
      case 1:
        return <Reward rewardAddress={stakeData.rewardAddress} onChange={(v) => handleChange('rewardAddress', v)} />;
      case 2:
        return <Delegate delegatorAddress={stakeData.delegatorAddress} onChange={(v) => handleChange('delegatorAddress', v)} />;
      case 3:
        return <Confirm stakeData={stakeData} isApproved={isApproved} isStaked={isStaked} allowanceData={allowanceData} />;
      default:
        return null;
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 2 }} color="text.secondary">
        Stake your SKY tokens to earn rewards and participate in the Sky Protocol governance. Follow the steps below to complete your
        staking process.
      </Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <CardHeader title={'Staking Process'}></CardHeader>
          <Card sx={{ borderRadius: '20px', mb: 3 }}>
            <Box sx={{ p: 3 }}>
              <Stepper activeStep={activeStep}>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>

              <Box sx={{ mt: 4 }}>{getStepComponent()}</Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {activeStep === steps.length - 1 && isSimulateApproveError && !isApproved && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    Approval simulation failed: {simulateApproveError?.message || 'Unknown error'}
                  </Alert>
                )}

                {activeStep === steps.length - 1 && isSimulateConfirmError && isApproved && !isStaked && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    Confirmation simulation failed: {simulateConfirmError?.message || 'Unknown error'}
                  </Alert>
                )}

                {activeStep === steps.length - 1 && isConfirmSuccess && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    Transaction sent
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
                      {activeStep === steps.length - 1
                        ? allowanceData && stakeData.amount && allowanceData >= parseEther(stakeData.amount)
                          ? 'Confirm Staking'
                          : confirmButtonText
                        : 'Next'}
                    </Button>
                  )}
                </Box>
              </Box>
            </Box>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Box sx={{ width: '100%', display: 'flex' }}>
            <StakingSummary />
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
