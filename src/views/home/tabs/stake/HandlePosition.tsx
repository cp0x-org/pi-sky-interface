import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
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
import { useAccount, useReadContract, useWriteContract, useSimulateContract, useWaitForTransactionReceipt } from 'wagmi';
import { Config, readContract } from '@wagmi/core';
import { formatEther } from 'viem';
import { useConfigChainId } from 'hooks/useConfigChainId';
import { usdsContractConfig } from 'config/abi/Usds';
import { SkyContracts, SkyIcons } from 'config/index';
import { useConfig } from 'wagmi';
import StakingSummary from './StakingSummary';
import { dispatchError, dispatchSuccess } from 'utils/snackbar';
import { useTheme } from '@mui/material/styles';

const steps = ['Stake', 'Reward', 'Delegate', 'Confirm'];

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
  const theme = useTheme();
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
  }, [address]);

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
    nextUrnIdx
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
        if (refetchConfirmSimulation) {
          refetchConfirmSimulation();
        }
      }, 100);

      return () => clearTimeout(timer);
    }

    // Reset the ref when approval changes to false
    if (!isApproved) {
      hasRunSimulation.current = false;
    }
  }, [isApproved, callDataArray.length, isStaked, refetchConfirmSimulation]);

  const { writeContract: writeConfirm, isPending: isConfirmPending, error: confirmError, data: confirmData } = useWriteContract();

  const {
    writeContract: writeApprove,
    isPending: isApprovePending,
    error: approveError,
    isError: isApproveError,
    data: approveData
  } = useWriteContract();

  // Separated effects for different transaction states to avoid cascading updates

  // Track transaction confirmation
  const [approvalTxHash, setApprovalTxHash] = useState<`0x${string}` | null>(null);
  const [confirmTxHash, setConfirmTxHash] = useState<`0x${string}` | null>(null);

  // Track transaction confirmation for approval
  const {
    isSuccess: isApprovalTxConfirmed,
    isError: isApprovalTxError,
    error: approvalTxError
  } = useWaitForTransactionReceipt({
    hash: approvalTxHash as `0x${string}`,
    query: { enabled: !!approvalTxHash }
  });

  // Track transaction confirmation for staking
  const {
    isSuccess: isConfirmTxConfirmed,
    isError: isConfirmTxError,
    error: confirmTxError
  } = useWaitForTransactionReceipt({
    hash: confirmTxHash as `0x${string}`,
    query: { enabled: !!confirmTxHash }
  });

  // Combined transaction submission effect
  useEffect(() => {
    // Handle confirmation submission
    if (confirmData) {
      console.log('Staking transaction submitted:', confirmData);
      setConfirmTxHash(confirmData);
    }

    // Handle approval submission
    if (approveData) {
      console.log('Approval transaction submitted:', approveData);
      setApprovalTxHash(approveData);
    }
  }, [confirmData, approveData]);

  // Combined transaction confirmation effect
  useEffect(() => {
    // Handle confirmation success
    if (isConfirmTxConfirmed) {
      console.log('Staking confirmed successfully!');
      setIsStaked(true);
      dispatchSuccess('Staking confirmed successfully!');
    } else if (isApprovalTxConfirmed) {
      console.log('Approval successfully confirmed!');
      setIsApproved(true);

      dispatchSuccess('SKY approved successfully!');
      refetchAllowance();
      // Refresh allowance after approval
      // const timer = setTimeout(() => {
      //   if (refetchAllowance) {
      //     console.log('Refreshing allowance...');
      //     refetchAllowance();
      //   }
      // }, 1);

      // return () => clearTimeout(timer);
    }
  }, [isConfirmTxConfirmed, isStaked, isApprovalTxConfirmed, refetchAllowance]);

  // Combined error handling effect
  useEffect(() => {
    // Handle confirmation error
    if ((confirmError && !confirmTxHash) || (isConfirmTxError && confirmTxError)) {
      console.error('Staking failed:', confirmError || confirmTxError);
      dispatchError('Staking confirmation failed!');
    }

    // Handle approval error
    if ((isApproveError && !approvalTxHash) || (isApprovalTxError && approvalTxError)) {
      console.error('Approval failed:', approveError || approvalTxError);
      dispatchError('SKY approve failed!');
    }
  }, [
    confirmError,
    isConfirmTxError,
    confirmTxError,
    confirmTxHash,
    isApproveError,
    approveError,
    isApprovalTxError,
    approvalTxError,
    approvalTxHash
  ]);

  // We've removed the duplicate approval error handler

  // Compute button text based on transaction status - using useMemo instead of useEffect
  const newButtonText = useMemo(() => {
    if (simulationInProgress) {
      return 'Simulating...';
    } else if (!isApproved) {
      if (approvalTxHash && !isApprovalTxConfirmed) {
        return 'Approving SKY...';
      } else if (isApprovePending) {
        return 'Preparing Approval...';
      } else {
        return 'Approve SKY';
      }
    } else if (isApproved && !isStaked) {
      if (confirmTxHash && !isConfirmTxConfirmed) {
        return 'Confirming Stake...';
      } else if (isConfirmPending) {
        return 'Preparing Transaction...';
      } else {
        return 'Confirm Staking';
      }
    } else if (isStaked) {
      return 'Staked';
    }

    // Default fallback
    return 'Approve SKY';
  }, [
    isApproved,
    simulationInProgress,
    isStaked,
    approvalTxHash,
    isApprovalTxConfirmed,
    isApprovePending,
    confirmTxHash,
    isConfirmTxConfirmed,
    isConfirmPending
  ]);

  // Update button text when computed value changes
  useEffect(() => {
    if (newButtonText !== confirmButtonText) {
      setConfirmButtonText(newButtonText);
    }
  }, [newButtonText, confirmButtonText]);

  const isValidEthereumAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const handleChange = useCallback(
    (field: keyof typeof stakeData, value: string) => {
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
        if (address && value && refetchAllowance) {
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
    },
    [stakeData, address, refetchAllowance]
  );

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

    // Don't submit new transactions if we're waiting for one to be confirmed
    // if (approvalTxHash || (confirmTxHash && !isApprovalTxConfirmed)) {
    //   console.log('Transaction already in progress, waiting for confirmation');
    //   return;
    // }

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
        if (refetchAllowance) {
          await refetchAllowance();
        }
        console.log('Current allowance:', allowanceData ? allowanceData.toString() : 'unknown');

        // Skip approval if allowance is sufficient
        if (allowanceData && stakeData.amount) {
          const amountBigInt = parseEther(stakeData.amount);
          if (allowanceData >= amountBigInt) {
            console.log('Allowance is sufficient, skipping approval');
            setIsApproved(true);
            // Run simulation for confirmation since we're skipping approval
            if (refetchConfirmSimulation) {
              await refetchConfirmSimulation();
            }
            // Use setTimeout to prevent potential render loops
            setTimeout(() => {
              handleSubmit(); // Call again to handle confirmation
            }, 100);
            return;
          }
        }

        console.log('Sending approval transaction...');
        // Reset any previous transaction data
        setApprovalTxHash(null);

        // Directly send the approval transaction without gas calculation
        if (writeApprove) {
          writeApprove({
            address: skyConfig.contracts.SKY,
            abi: usdsContractConfig.abi,
            functionName: 'approve',
            args: [skyConfig.contracts.LockStakeEngine, parseEther(stakeData.amount)]
          });
        }

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
        // Reset any previous transaction data
        setConfirmTxHash(null);

        // Directly send the confirmation transaction
        if (writeConfirm) {
          writeConfirm({
            address: skyConfig.contracts.LockStakeEngine,
            abi: lockStakeContractConfig.abi,
            functionName: 'multicall',
            args: [callDataArray as readonly `0x${string}`[]]
          });
        }

        console.log('Confirmation transaction sent');
      }
    } catch (error) {
      console.error('Transaction failed:', error);
      setApprovalTxHash(null);
      setConfirmTxHash(null);
      setIsApproved(false);
      setIsStaked(false);
      setSimulationInProgress(false);
      dispatchError('Transaction preparation failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
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
        // Disable during approval process
        return isApprovePending || !!approvalTxHash || !stakeData.amount;
      } else {
        // Disable during confirmation process
        return isConfirmPending || !!confirmTxHash || isStaked;
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

  // Memoize the handleChange callback to prevent re-renders
  const memoizedHandleChange = useCallback(
    (field: keyof typeof stakeData, value: string) => handleChange(field, value),
    [stakeData] // Only re-create if stakeData changes
  );

  // Get the step component based on the active step
  const StepComponent = useMemo(() => {
    switch (activeStep) {
      case 0:
        return (
          <StakeAndBorrow
            userBalance={userBalance}
            stakedAmount={stakeData.amount}
            onChange={(v) => memoizedHandleChange('amount', v)}
            originalAmount={positionData?.wad ? formatEther(BigInt(positionData.wad)) : undefined}
            editMode={editMode}
          />
        );
      case 1:
        return <Reward rewardAddress={stakeData.rewardAddress} onChange={(v) => memoizedHandleChange('rewardAddress', v)} />;
      case 2:
        return <Delegate delegatorAddress={stakeData.delegatorAddress} onChange={(v) => memoizedHandleChange('delegatorAddress', v)} />;
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
  }, [activeStep, userBalance, stakeData, memoizedHandleChange, positionData, isApproved, isStaked, allowanceData, editMode]);

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 2 }} color="text.secondary">
        Stake your SKY tokens to earn rewards and participate in the Sky Protocol governance. Follow the steps below to complete your
        staking process.
      </Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <CardHeader title={'Staking Process'}></CardHeader>
          <Card sx={{ borderRadius: '20px' }}>
            <Box sx={{ p: 3 }}>
              <Stepper activeStep={activeStep}>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>

              <Box sx={{ mt: 4 }}>{StepComponent}</Box>

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

                {activeStep === steps.length - 1 && approvalTxHash && !isApprovalTxConfirmed && !isApproved && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Approval transaction sent, waiting for confirmation...
                  </Alert>
                )}

                {activeStep === steps.length - 1 && confirmTxHash && !isConfirmTxConfirmed && !isStaked && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Staking transaction sent, waiting for confirmation...
                  </Alert>
                )}

                {activeStep === steps.length - 1 && isApproved && !isStaked && !confirmTxHash && (
                  <Alert severity="success" sx={{ mt: 2, color: theme.palette.success.main }}>
                    Approval confirmed successfully! Ready to stake.
                  </Alert>
                )}

                {activeStep === steps.length - 1 && isStaked && (
                  <Alert severity="success" sx={{ mt: 2, color: theme.palette.success.main }}>
                    Staking confirmed successfully!
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
