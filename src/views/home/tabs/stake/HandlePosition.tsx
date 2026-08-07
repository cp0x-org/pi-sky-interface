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
import { apiConfig, isLegacyCp0xDelegate, SkyContracts, SkyIcons } from 'config/index';
import { useConfig } from 'wagmi';
import StakingSummary from './StakingSummary';
import { dispatchError, dispatchSuccess } from 'utils/snackbar';
import { useTheme } from '@mui/material/styles';
import StatusLive from 'components/StatusLive';
import { FormattedMessage, useIntl } from 'react-intl';

const stepIds = ['stake.step.stake', 'stake.step.reward', 'stake.step.delegate', 'stake.step.confirm'];

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
  const intl = useIntl();
  const { config: skyConfig } = useConfigChainId();
  const config = useConfig();
  const steps = stepIds.map((id) => intl.formatMessage({ id }));
  const [activeStep, setActiveStep] = useState(0);
  const [isDelegateSelectionReady, setIsDelegateSelectionReady] = useState(false);
  const theme = useTheme();
  const originalDelegatorAddress = positionData?.delegateID || '';
  const mustMigrateLegacyDelegate = isLegacyCp0xDelegate(originalDelegatorAddress);
  const [stakeData, setStakeData] = useState({
    amount: '',
    rewardAddress: skyConfig.contracts.USDS || '',
    // Legacy cp0x positions are migrated independently of the delegates API so
    // the forced update cannot be bypassed while that API is loading or failing.
    delegatorAddress: mustMigrateLegacyDelegate ? apiConfig.cp0xDelegate : originalDelegatorAddress,
    originalAmount: positionData?.wad ? formatEther(BigInt(positionData.wad)) : '0'
  });

  // For tracking position ID when in edit mode
  const [positionId, setPositionId] = useState<string | null>(positionData?.indexPosition || null);

  // Approval state
  const [isApproved, setIsApproved] = useState(false);
  const [isStaked, setIsStaked] = useState(false);
  const [confirmButtonText, setConfirmButtonText] = useState(intl.formatMessage({ id: 'btn.approveSky' }));
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
        if (stakeData.delegatorAddress.toLowerCase() !== positionData?.delegateID.toLowerCase()) {
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
            args: [address, nextUrnIdx, stakeData.rewardAddress, 1]
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
    // In edit mode with no new amount, nothing is locked so no SKY approval is
    // required — treat as approved so the user can confirm delegate-only changes.
    if (editMode && !stakeData.amount) {
      if (!isApproved) {
        setIsApproved(true);
        setConfirmButtonText(intl.formatMessage({ id: 'btn.confirmStaking' }));
      }
      return;
    }

    if (address && stakeData.amount && allowanceData) {
      try {
        const amountBigInt = parseEther(stakeData.amount);
        const shouldBeApproved = allowanceData >= amountBigInt;

        // Only update state if it's different to avoid unnecessary re-renders
        if (shouldBeApproved !== isApproved) {
          setIsApproved(shouldBeApproved);
          setConfirmButtonText(intl.formatMessage({ id: shouldBeApproved ? 'btn.confirmStaking' : 'btn.approveSky' }));
        }
      } catch (error) {
        console.error('Error checking allowance:', error);
      }
    }
  }, [address, stakeData.amount, allowanceData, isApproved, editMode, intl]);

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
      dispatchSuccess(intl.formatMessage({ id: 'tx.stakingConfirmed' }));
    } else if (isApprovalTxConfirmed) {
      console.log('Approval successfully confirmed!');
      setIsApproved(true);

      dispatchSuccess(intl.formatMessage({ id: 'tx.skyApproved' }));
      refetchAllowance();
    }
  }, [isConfirmTxConfirmed, isStaked, isApprovalTxConfirmed, refetchAllowance, intl]);

  // Combined error handling effect
  useEffect(() => {
    // Handle confirmation error
    if ((confirmError && !confirmTxHash) || (isConfirmTxError && confirmTxError)) {
      console.error('Staking failed:', confirmError || confirmTxError);
      dispatchError(intl.formatMessage({ id: 'tx.stakingConfirmFailed' }));
    }

    // Handle approval error
    if ((isApproveError && !approvalTxHash) || (isApprovalTxError && approvalTxError)) {
      console.error('Approval failed:', approveError || approvalTxError);
      dispatchError(intl.formatMessage({ id: 'tx.skyApproveFailed' }));
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
    approvalTxHash,
    intl
  ]);

  // We've removed the duplicate approval error handler

  // Compute button text based on transaction status - using useMemo instead of useEffect
  const newButtonText = useMemo(() => {
    if (simulationInProgress) {
      return intl.formatMessage({ id: 'btn.simulating' });
    } else if (!isApproved) {
      if (approvalTxHash && !isApprovalTxConfirmed) {
        return intl.formatMessage({ id: 'btn.approvingSky' });
      } else if (isApprovePending) {
        return intl.formatMessage({ id: 'btn.preparingApproval' });
      } else {
        return intl.formatMessage({ id: 'btn.approveSky' });
      }
    } else if (isApproved && !isStaked) {
      if (confirmTxHash && !isConfirmTxConfirmed) {
        return intl.formatMessage({ id: 'btn.confirmingStake' });
      } else if (isConfirmPending) {
        return intl.formatMessage({ id: 'btn.preparingTransaction' });
      } else {
        return intl.formatMessage({ id: 'btn.confirmStaking' });
      }
    } else if (isStaked) {
      return intl.formatMessage({ id: 'btn.staked' });
    }

    // Default fallback
    return intl.formatMessage({ id: 'btn.approveSky' });
  }, [
    isApproved,
    simulationInProgress,
    isStaked,
    approvalTxHash,
    isApprovalTxConfirmed,
    isApprovePending,
    confirmTxHash,
    isConfirmTxConfirmed,
    isConfirmPending,
    intl
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
      if (activeStep === 1) {
        setIsDelegateSelectionReady(false);
      }
      setActiveStep((prev) => prev + 1);

      // When reaching the final step, check allowance
      if (activeStep === 2 && address && stakeData.amount) {
        refetchAllowance();
      }
    }
  };

  const handleBack = () => {
    if (activeStep === 3) {
      setIsDelegateSelectionReady(false);
    }
    setActiveStep((prev) => prev - 1);
  };

  const handleSkip = () => {
    // Skip the current step. Skipping the amount step clears the amount (no extra
    // stake). In edit mode, skipping the delegate step restores the position's
    // original delegate so no delegate-change call is generated. The reward step
    // just keeps its current value.
    setStakeData((prev) => ({
      ...prev,
      ...(activeStep === 0 ? { amount: '' } : {}),
      ...(activeStep === 2 ? { delegatorAddress: editMode ? originalDelegatorAddress : '' } : {})
    }));
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
      dispatchError(
        intl.formatMessage(
          { id: 'tx.transactionPreparationFailed' },
          { error: error instanceof Error ? error.message : intl.formatMessage({ id: 'common.unknownError' }) }
        )
      );
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
      const keepsLegacyCp0xDelegate = mustMigrateLegacyDelegate && isLegacyCp0xDelegate(stakeData.delegatorAddress);
      return !stakeData.delegatorAddress || keepsLegacyCp0xDelegate || (!isDelegateSelectionReady && !mustMigrateLegacyDelegate);
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
        return (
          <Delegate
            delegatorAddress={stakeData.delegatorAddress}
            originalDelegatorAddress={originalDelegatorAddress}
            onChange={(v) => memoizedHandleChange('delegatorAddress', v)}
            onReadyChange={setIsDelegateSelectionReady}
          />
        );
      case 3:
        return (
          <Confirm
            stakeData={stakeData}
            isApproved={isApproved}
            isStaked={isStaked}
            originalAmount={positionData ? formatEther(BigInt(positionData.wad)) : undefined}
          />
        );
      default:
        return null;
    }
  }, [activeStep, userBalance, stakeData, memoizedHandleChange, positionData, originalDelegatorAddress, isApproved, isStaked, editMode]);

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" component="p" gutterBottom sx={{ mb: 2 }} color="text.secondary">
        <FormattedMessage id="stake.processDescription" />
      </Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <CardHeader title={intl.formatMessage({ id: 'stake.stakingProcess' })}></CardHeader>
          <Card sx={{ borderRadius: '20px' }}>
            <Box sx={{ p: 3 }}>
              <Stepper activeStep={activeStep} aria-label={intl.formatMessage({ id: 'stake.stepsAriaLabel' })}>
                {steps.map((label, index) => (
                  <Step key={label}>
                    <StepLabel aria-current={activeStep === index ? 'step' : undefined}>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
              <StatusLive
                message={intl.formatMessage(
                  { id: 'stake.stepStatus' },
                  { current: activeStep + 1, total: steps.length, label: steps[activeStep] }
                )}
              />

              <Box sx={{ mt: 4 }}>{StepComponent}</Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {activeStep === steps.length - 1 && isSimulateApproveError && !isApproved && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    <FormattedMessage
                      id="stake.approvalSimulationFailed"
                      values={{ error: simulateApproveError?.message || intl.formatMessage({ id: 'common.unknownError' }) }}
                    />
                  </Alert>
                )}

                {activeStep === steps.length - 1 && isSimulateConfirmError && isApproved && !isStaked && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    <FormattedMessage
                      id="stake.confirmationSimulationFailed"
                      values={{ error: simulateConfirmError?.message || intl.formatMessage({ id: 'common.unknownError' }) }}
                    />
                  </Alert>
                )}

                {activeStep === steps.length - 1 && approvalTxHash && !isApprovalTxConfirmed && !isApproved && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <FormattedMessage id="stake.approvalTxSent" />
                  </Alert>
                )}

                {activeStep === steps.length - 1 && confirmTxHash && !isConfirmTxConfirmed && !isStaked && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <FormattedMessage id="stake.stakingTxSent" />
                  </Alert>
                )}

                {activeStep === steps.length - 1 && isApproved && !isStaked && !confirmTxHash && (
                  <Alert severity="success" sx={{ mt: 2, color: theme.palette.success.main }}>
                    <FormattedMessage id="stake.approvalConfirmed" />
                  </Alert>
                )}

                {activeStep === steps.length - 1 && isStaked && (
                  <Alert severity="success" sx={{ mt: 2, color: theme.palette.success.main }}>
                    <FormattedMessage id="tx.stakingConfirmed" />
                  </Alert>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                  <Button disabled={activeStep === 0} onClick={handleBack}>
                    <FormattedMessage id="btn.back" />
                  </Button>

                  {activeStep === steps.length - 1 ? (
                    <Button variant="contained" onClick={handleNext} disabled={isNextButtonDisabled()}>
                      {confirmButtonText}
                    </Button>
                  ) : (
                    <Stack direction="row" spacing={2}>
                      {(activeStep === 2 || editMode) && !(activeStep === 2 && mustMigrateLegacyDelegate) && (
                        <Button variant="text" onClick={handleSkip} disabled={!address}>
                          <FormattedMessage id="btn.skip" />
                        </Button>
                      )}
                      <Button variant="contained" onClick={handleNext} disabled={isNextButtonDisabled()}>
                        <FormattedMessage id="btn.next" />
                      </Button>
                    </Stack>
                  )}
                </Box>
                <StatusLive message={activeStep === steps.length - 1 ? confirmButtonText : ''} />
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
