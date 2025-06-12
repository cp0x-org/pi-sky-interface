import { useMemo, useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import { Step, StepLabel, Stepper, Stack, Alert, Typography, Grid, CardHeader } from '@mui/material';
import { StakingPosition } from 'types/staking';
import StakeAndBorrow from './StakeAndBorrow';
import Reward from './Reward';
import Delegate from './Delegate';
import Confirm from './Confirm';
import { encodeFunctionData, parseEther } from 'viem';
import { lockStakeContractConfig } from 'config/abi/LockStackeEngine';
import { useAccount, useReadContract, useWriteContract, useSimulateContract } from 'wagmi';
import { Config, readContract } from '@wagmi/core';
import { formatEther } from 'viem';
import { useConfigChainId } from 'hooks/useConfigChainId';
import { usdsContractConfig } from 'config/abi/Usds';
import { SkyContracts, SkyIcons } from 'config/index';
import { useConfig } from 'wagmi';
import StakingSummary from './StakingSummary';
import { dispatchError, dispatchSuccess } from 'utils/snackbar';

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

interface HandlePositionProps {
  editMode?: boolean;
  positionData?: StakingPosition | null;
}

export default function HandlePosition({ editMode = false, positionData = null }: HandlePositionProps) {
  const { address } = useAccount();
  const { config: skyConfig } = useConfigChainId();
  const config = useConfig();
  const [activeStep, setActiveStep] = useState(0);
  const [stakeData, setStakeData] = useState({
    amount: '',
    rewardAddress: skyConfig.contracts.USDS || '',
    delegatorAddress: positionData?.delegateID || '',
    originalAmount: positionData?.wad ? formatEther(BigInt(positionData.wad)) : '0'
  });

  // For tracking position ID when in edit mode
  const [positionId, setPositionId] = useState<string | null>(positionData?.indexPosition || null);

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
  }, [address, config, skyConfig]);

  const callDataArray = useMemo(() => {
    if (!address || (!editMode && !stakeData.amount) || !stakeData.rewardAddress) return [];

    let dataArray: string[] = [];

    try {
      if (editMode && positionId !== null) {
        // In edit mode, we only update the delegate and reward settings
        const positionIdBigInt = BigInt(positionId);

        // Add delegate selection if provided
        if (stakeData.delegatorAddress !== positionData?.delegateID) {
          let newDelegatorAddress = stakeData.delegatorAddress || '0';

          dataArray.push(
            encodeFunctionData({
              abi: lockStakeContractConfig.abi,
              functionName: 'selectVoteDelegate',
              args: [address, positionIdBigInt, newDelegatorAddress as `0x${string}`]
            })
          );
        }

        // Add the farm selection
        if (stakeData.amount) {
          dataArray.push(
            encodeFunctionData({
              abi: lockStakeContractConfig.abi,
              functionName: 'lock',
              args: [address, positionIdBigInt, parseEther(stakeData.amount), 1]
            })
          );
        }
      } else if (stakeData.amount) {
        // Standard new position flow
        dataArray = [
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

        if (stakeData.delegatorAddress && stakeData.delegatorAddress != '0x0') {
          dataArray.push(
            encodeFunctionData({
              abi: lockStakeContractConfig.abi,
              functionName: 'selectVoteDelegate',
              args: [address, nextUrnIdx, stakeData.delegatorAddress as `0x${string}`]
            })
          );
        }
      }
    } catch (error) {
      console.error('Error generating call data array:', error);
    }

    return dataArray;
  }, [
    address,
    editMode,
    stakeData.amount,
    stakeData.rewardAddress,
    stakeData.delegatorAddress,
    positionId,
    positionData?.delegateID,
    nextUrnIdx,
    skyConfig.contracts.USDSStakingRewards
  ]);

  // Simulate confirm transaction
  const {
    isError: isSimulateConfirmError,
    error: simulateConfirmError,
    refetch: refetchConfirmSimulation
  } = useSimulateContract({
    address: skyConfig.contracts.LockStakeEngine,
    abi: lockStakeContractConfig.abi,
    functionName: 'multicall',
    args: [callDataArray as readonly `0x${string}`[]],
    query: {
      enabled: !!address && callDataArray.length > 0 && isApproved && !isStaked
    }
  });

  // Effect to check if approval is needed when amount changes or allowance updates
  // Set position ID once at the beginning if in edit mode
  useEffect(() => {
    if (editMode && positionData) {
      setPositionId(positionData.indexPosition);
    }
  }, [editMode, positionData]);

  // Check if approval is needed
  useEffect(() => {
    if (address && stakeData.amount && allowanceData) {
      try {
        const amountBigInt = parseEther(stakeData.amount);
        const shouldBeApproved = allowanceData >= amountBigInt;

        // Only update state if it's different to avoid unnecessary re-renders
        if (shouldBeApproved !== isApproved) {
          setIsApproved(shouldBeApproved);
          setConfirmButtonText(shouldBeApproved ? 'Confirm Staking' : 'Approve SKY');
        }
      } catch (error) {
        console.error('Error checking allowance:', error);
      }
    }
  }, [address, stakeData.amount, allowanceData, isApproved]);

  // Use a ref to track if we've already run the simulation
  const hasRunSimulation = useRef<boolean>(false);

  // Separate effect for simulation to avoid circular dependencies
  useEffect(() => {
    // Only run simulation when approval state changes to true and we haven't run it yet
    if (isApproved && callDataArray.length > 0 && !isStaked && !hasRunSimulation.current) {
      // Mark that we've run the simulation
      hasRunSimulation.current = true;

      // Use setTimeout to break the potential update cycle
      const timer = setTimeout(() => {
        refetchConfirmSimulation();
      }, 0);

      return () => clearTimeout(timer);
    }

    // Reset the ref when approval changes to false
    if (!isApproved) {
      hasRunSimulation.current = false;
    }
  }, [isApproved, callDataArray.length, isStaked]);

  const { writeContract: writeConfirm, isSuccess: isConfirmSuccess, isPending: isConfirmPending, error: confirmError } = useWriteContract();

  const {
    writeContract: writeApprove,
    isSuccess: isApproveSuccess,
    isPending: isApprovePending,
    error: approveError,
    isError: isApproveError
  } = useWriteContract();

  // Separated effects for different transaction states to avoid cascading updates

  // Handle confirmation success
  useEffect(() => {
    if (isConfirmSuccess && !isStaked) {
      console.log(editMode ? 'Position updated successfully!' : 'Staking confirmed successfully!');
      setIsStaked(true);
      dispatchSuccess('Staking confirmed successfully!');
    }
  }, [isConfirmSuccess, isStaked, editMode]);

  // Handle confirmation error
  useEffect(() => {
    if (confirmError) {
      console.error('Staking failed:', confirmError);
      dispatchError('Staking confirmation failed!');
    }
  }, [confirmError]);

  // Handle approval success
  useEffect(() => {
    if (isApproveSuccess && !isApproved) {
      console.log('Approval successful!');
      setIsApproved(true);

      if (!isStaked) {
        dispatchSuccess('SKY approved successfully!');
      }

      // Refresh allowance after approval
      const timer = setTimeout(() => {
        if (refetchAllowance) {
          console.log('Refreshing allowance...');
          refetchAllowance();
        }
      }, 0);

      return () => clearTimeout(timer);
    }
  }, [isApproveSuccess, isApproved, isStaked, refetchAllowance]);

  // Handle approval error
  useEffect(() => {
    if (isApproveError) {
      console.error('Approval failed:', approveError);
      dispatchError('SKY approve failed!');
    }
  }, [isApproveError, approveError]);

  // Effect to update button text based on simulation status
  useEffect(() => {
    let newButtonText = confirmButtonText;

    if (simulationInProgress) {
      newButtonText = 'Simulating...';
    } else if (!isApproved) {
      newButtonText = 'Approve SKY';
    } else if (isApproved && !isStaked) {
      newButtonText = 'Confirm Staking';
    } else if (isStaked) {
      newButtonText = 'Staked';
    }

    // Only update if text has changed to avoid unnecessary re-renders
    if (newButtonText !== confirmButtonText) {
      setConfirmButtonText(newButtonText);
    }

    // Remove debug logging to avoid unnecessary re-renders
  }, [isApproved, simulationInProgress, isStaked, confirmButtonText]);

  const isValidEthereumAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const handleChange = (field: keyof typeof stakeData, value: string) => {
    // Return early if the value hasn't changed to prevent unnecessary updates
    if (stakeData[field] === value) {
      return;
    }

    // Validate amount
    if (field === 'amount') {
      if (!value || isNaN(Number(value))) {
        return;
      }

      // Check allowance again when amount changes
      if (address && value) {
        refetchAllowance();
      }
    }

    // Validate Ethereum addresses
    if ((field === 'rewardAddress' || field === 'delegatorAddress') && value) {
      // Skip validation for the 0x0 special case
      if (value !== '0x0' && !isValidEthereumAddress(value)) {
        return;
      }

      // Make sure addresses always start with 0x for delegator/reward addresses
      if ((field === 'delegatorAddress' || field === 'rewardAddress') && value && !value.startsWith('0x')) {
        value = `0x${value}`;
      }
    }

    // Update the state
    setStakeData((prev) => {
      // Only update if the value is actually different
      if (prev[field] === value) {
        return prev;
      }
      return { ...prev, [field]: value };
    });
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
    if (!address) {
      console.log('Missing address');
      return;
    }

    if (!editMode && !stakeData.amount) {
      console.log('Missing stake amount');
      return;
    }

    // In edit mode, we don't need to check balance since we're not staking more
    if (!editMode && userBalance) {
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
          args: [callDataArray as readonly `0x${string}`[]]
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
    // Always disable if the wallet is not connected
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

    if (activeStep === 3) {
      return !isStaked;
    }

    return false;
  };

  const getStepComponent = useMemo(() => {
    switch (activeStep) {
      case 0:
        return (
          <StakeAndBorrow
            userBalance={userBalance}
            stakedAmount={stakeData.amount}
            onChange={(v) => handleChange('amount', v)}
            originalAmount={positionData?.wad ? formatEther(BigInt(positionData.wad)) : undefined}
            editMode={editMode}
          />
        );
      case 1:
        return <Reward rewardAddress={stakeData.rewardAddress} onChange={(v) => handleChange('rewardAddress', v)} />;
      case 2:
        return <Delegate delegatorAddress={stakeData.delegatorAddress} onChange={(v) => handleChange('delegatorAddress', v)} />;
      case 3:
        return (
          <Confirm
            stakeData={stakeData}
            isApproved={isApproved}
            isStaked={isStaked}
            allowanceData={allowanceData}
            originalAmount={positionData ? formatEther(BigInt(positionData.wad)) : undefined}
          />
        );
      default:
        return null;
    }
  }, [activeStep, userBalance, stakeData, handleChange, positionData, isApproved, isStaked, allowanceData, editMode]);

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

              <Box sx={{ mt: 4 }}>{getStepComponent}</Box>

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
