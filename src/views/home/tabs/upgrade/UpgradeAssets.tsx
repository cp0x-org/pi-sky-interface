import { Box, Typography, Button } from '@mui/material';
import { FC, useCallback, useEffect, useState } from 'react';
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import { useConfigChainId } from 'hooks/useConfigChainId';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import daiLogo from 'assets/images/sky/ethereum/dai.svg?url';
import mkrLogo from 'assets/images/sky/ethereum/mkr.svg?url';
import { daiUsdsConverterConfig } from 'config/abi/DaiUsdsConverter';
import { mkrSkyConverterConfig } from 'config/abi/MkrSkyConverter';
import { daiContractConfig } from 'config/abi/Dai';
import { mkrContractConfig } from 'config/abi/Mkr';
import { SelectChangeEvent } from '@mui/material/Select';
import Avatar from 'ui-component/extended/Avatar';
import { formatUSDS } from 'utils/sky';
import { formatTokenAmount } from 'utils/formatters';
import { StyledCard } from 'components/StyledCard';
import { StyledTextField } from 'components/StyledTextField';
import { StyledSelect } from 'components/StyledSelect';
import { PercentButton } from 'components/PercentButton';
import { dispatchError, dispatchSuccess } from 'utils/snackbar';
import { useDebounce } from 'hooks/useDebounce';

interface Props {
  daiUserBalance?: bigint;
  mkrUserBalance?: bigint;
}

const TOKEN_DAI = 'dai';
const TOKEN_MKR = 'mkr';

const tokenOptions = [
  { label: 'DAI', value: TOKEN_DAI, img: daiLogo },
  { label: 'MKR', value: TOKEN_MKR, img: mkrLogo }
];

// Transaction states
type TxState = 'idle' | 'submitting' | 'submitted' | 'confirmed' | 'error';

// Custom hook for transaction management
const useTransaction = () => {
  const [txState, setTxState] = useState<TxState>('idle');
  const [isCompleted, setIsCompleted] = useState(false);

  const { writeContract, error: txError, isError: isTxError, isSuccess: isTxSubmitted, data: txHash } = useWriteContract();

  const {
    isSuccess: isTxConfirmed,
    isError: isTxConfirmError,
    error: txConfirmError
  } = useWaitForTransactionReceipt({
    hash: txHash,
    query: { enabled: !!txHash }
  });

  // Reset the transaction state
  const resetTx = useCallback(() => {
    if (txState === 'error') {
      setTxState('idle');
    }
  }, [txState]);

  // Reset the transaction state
  const setTxIdle = useCallback(() => {
    setTxState('idle');
  }, []);

  // Process transaction status changes
  const processTxState = useCallback(() => {
    if (isTxSubmitted && txState === 'idle') {
      setTxState('submitted');
      console.log('Transaction submitted:', txHash);
    } else if (isTxConfirmed && txState === 'submitted') {
      setTxState('confirmed');
      setIsCompleted(true);
      console.log('Transaction confirmed!');
    } else if ((isTxError || isTxConfirmError) && txState !== 'error') {
      setTxState('error');
      console.error('Transaction failed:', txError || txConfirmError);
    }
  }, [isTxSubmitted, isTxConfirmed, isTxError, isTxConfirmError, txState, txHash, txError, txConfirmError]);

  return {
    writeContract,
    txState,
    txHash,
    isCompleted,
    isTxConfirmed,
    resetTx,
    processTxState,
    setTxIdle
  };
};

const UpgradeAssets: FC<Props> = ({ daiUserBalance, mkrUserBalance }) => {
  const [amount, setAmount] = useState<string>('');
  const [expectedOutput, setExpectedOutput] = useState<string>('0');
  // Create a debounced version of amount that updates 500ms after amount changes
  const debouncedAmount = useDebounce(amount, 500);

  const account = useAccount();
  const address = account.address as `0x${string}` | undefined;
  const { config: skyConfig } = useConfigChainId();
  const [tokenValue, setTokenValue] = useState(tokenOptions[0].value);

  // Track when allowance checking is in progress (during debounce)
  const [allowanceChecking, setAllowanceChecking] = useState(false);

  // Use custom transaction hooks
  const approveTx = useTransaction();
  const upgradeTx = useTransaction();

  // Track process completion
  const [isApproved, setIsApproved] = useState(false);
  const [isUpgraded, setIsUpgraded] = useState(false);

  // Get the MKR to SKY conversion rate from the contract
  const { data: mkrToSkyRate, isLoading: isRateLoading } = useReadContract({
    ...mkrSkyConverterConfig,
    address: skyConfig.contracts.MKRSKYConverter,
    functionName: 'rate'
  });

  // Check allowance to determine if approval is needed
  const { data: daiAllowanceData, refetch: refetchDaiAllowance } = useReadContract({
    ...daiContractConfig,
    address: skyConfig.contracts.DAI,
    functionName: 'allowance',
    args: address ? [address, skyConfig.contracts.DAIUSDSConverter] : undefined,
    query: {
      enabled: !!address && tokenValue === TOKEN_DAI
    }
  });

  const { data: mkrAllowanceData, refetch: refetchMkrAllowance } = useReadContract({
    ...mkrContractConfig,
    address: skyConfig.contracts.MKR,
    functionName: 'allowance',
    args: address ? [address, skyConfig.contracts.MKRSKYConverter] : undefined,
    query: {
      enabled: !!address && tokenValue === TOKEN_MKR
    }
  });

  // Use debounced amount to validate and trigger refetchAllowance
  useEffect(() => {
    if (debouncedAmount) {
      setAllowanceChecking(false); // Clear checking state when debounced value is processed
      if (tokenValue === TOKEN_DAI && refetchDaiAllowance) {
        refetchDaiAllowance();
      } else if (tokenValue === TOKEN_MKR && refetchMkrAllowance) {
        refetchMkrAllowance();
      }
    }
  }, [debouncedAmount, tokenValue]);

  // Track when amount is changing but debounced value hasn't updated yet
  useEffect(() => {
    setAllowanceChecking(amount !== debouncedAmount && amount !== '');
  }, [amount, debouncedAmount]);

  // Check if approval is needed
  useEffect(() => {
    if (!address || !debouncedAmount) return;

    try {
      const amountBigInt = parseEther(debouncedAmount);
      let currentAllowance;

      if (tokenValue === TOKEN_DAI && daiAllowanceData) {
        currentAllowance = daiAllowanceData;
      } else if (tokenValue === TOKEN_MKR && mkrAllowanceData) {
        currentAllowance = mkrAllowanceData;
      } else {
        return;
      }

      const shouldBeApproved = currentAllowance >= amountBigInt;

      // Only update state if it's different to avoid unnecessary re-renders
      if (shouldBeApproved !== isApproved) {
        setIsApproved(shouldBeApproved);
      }
    } catch (error) {
      console.error('Error checking allowance:', error);
    }
  }, [address, debouncedAmount, tokenValue, isApproved, daiAllowanceData, mkrAllowanceData]);

  // Calculate the expected SKY output based on MKR input
  const calculateExpectedSky = useCallback(
    (mkrAmount: string) => {
      try {
        const mkrAmountFloat = parseFloat(mkrAmount);
        if (isNaN(mkrAmountFloat) || mkrAmountFloat <= 0) {
          setExpectedOutput('0');
          return;
        }

        if (!mkrToSkyRate) {
          console.error('MKR to SKY rate not available');
          return;
        }

        // Calculate gross SKY amount using the rate from the contract
        const rate = Number(mkrToSkyRate);
        // Use Math.floor to round down to ensure users don't see higher amounts than they'll receive
        const grossSky = Math.floor(mkrAmountFloat * rate * 100) / 100;

        setExpectedOutput(formatUSDS(grossSky));
      } catch (error) {
        console.error('Error calculating expected SKY:', error);
        setExpectedOutput('0');
      }
    },
    [mkrToSkyRate]
  );

  // Calculate expected SKY output when amount changes
  useEffect(() => {
    if (tokenValue === TOKEN_MKR && amount && amount !== '0') {
      calculateExpectedSky(amount);
    } else {
      setExpectedOutput('0');
    }
  }, [amount, tokenValue]);

  // Process transaction states
  useCallback(() => {
    approveTx.processTxState();
    upgradeTx.processTxState();

    // Update approval status when confirmed
    if (approveTx.txState === 'confirmed' && !isApproved) {
      // Refetch allowance data after approval
      if (tokenValue === TOKEN_DAI && refetchDaiAllowance) {
        refetchDaiAllowance();
      } else if (tokenValue === TOKEN_MKR && refetchMkrAllowance) {
        refetchMkrAllowance();
      }
      dispatchSuccess(`${tokenValue.toUpperCase()} Approved Successfully!`);
    }

    // Update upgrade status when confirmed
    if (upgradeTx.txState === 'confirmed' && !isUpgraded) {
      setIsUpgraded(true);
      dispatchSuccess(`${tokenValue.toUpperCase()} Upgraded Successfully!`);
    }

    // Handle errors
    if (approveTx.txState === 'error') {
      dispatchError(`${tokenValue.toUpperCase()} Approve Failed!`);
    }

    if (upgradeTx.txState === 'error') {
      dispatchError(`${tokenValue.toUpperCase()} Upgrade failed!`);
    }
  }, [approveTx, upgradeTx, isApproved, isUpgraded, tokenValue, refetchDaiAllowance, refetchMkrAllowance])();

  // Reset transaction states
  const resetTransactionStates = useCallback(() => {
    approveTx.resetTx();
    upgradeTx.resetTx();
  }, [approveTx, upgradeTx]);

  // Handle percentage button clicks
  const handlePercentClick = useCallback(
    (percent: number) => {
      let currentBalance: bigint | undefined;

      if (tokenValue === TOKEN_DAI) {
        currentBalance = daiUserBalance;
      } else if (tokenValue === TOKEN_MKR) {
        currentBalance = mkrUserBalance;
      }

      if (!currentBalance) return;

      // Calculate the amount based on the percentage and ensure it's rounded down
      // Use appropriate precision: 6 decimal places for safe rounding
      const balanceNumber = Number(formatEther(currentBalance));
      const percentValue = (balanceNumber * percent) / 100;

      // Round down to ensure we never exceed the actual balance
      // For MKR (which is more valuable), use 6 decimal places
      // For DAI, 2 decimal places is sufficient
      const decimalPlaces = tokenValue === TOKEN_MKR ? 6 : 2;
      const multiplier = Math.pow(10, decimalPlaces);
      const value = Math.floor(percentValue * multiplier) / multiplier;

      // Set the amount - allowance checking will be triggered by the amount change effect
      setAmount(value.toString());

      // Reset transaction states if changing amount
      resetTransactionStates();
      setIsApproved(false);
      setIsUpgraded(false);
    },
    [tokenValue, daiUserBalance, mkrUserBalance, resetTransactionStates]
  );

  // Get the current token balance based on selected token
  const getCurrentBalance = useCallback(() => {
    if (tokenValue === TOKEN_DAI) {
      return daiUserBalance ? formatUSDS(formatEther(daiUserBalance)) : '0';
    } else if (tokenValue === TOKEN_MKR) {
      return mkrUserBalance ? formatTokenAmount(mkrUserBalance.toString(), 5) : '0';
    }
    return '0';
  }, [tokenValue, daiUserBalance, mkrUserBalance]);

  // Handle amount change
  const handleAmountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (value === '' || Number(value) >= 0) {
        setAmount(value);

        // Calculate expected output for MKR
        if (tokenValue === TOKEN_MKR && value) {
          calculateExpectedSky(value);
        }

        // Reset transaction states when amount changes
        if (approveTx.txState === 'error' || upgradeTx.txState === 'error' || isApproved || isUpgraded) {
          resetTransactionStates();
          setIsApproved(false);
          setIsUpgraded(false);
        }
      }
    },
    [tokenValue, approveTx.txState, upgradeTx.txState, resetTransactionStates, isApproved, isUpgraded, calculateExpectedSky]
  );

  // Handle token change
  const handleTokenChange = useCallback(
    (e: SelectChangeEvent<any>, _child: React.ReactNode) => {
      const value = e.target.value;
      setTokenValue(value);

      // Reset states when token changes
      resetTransactionStates();
      setIsApproved(false);
      setIsUpgraded(false);

      // Recalculate expected output if MKR
      if (value === TOKEN_MKR && amount) {
        calculateExpectedSky(amount);
      } else {
        setExpectedOutput('0');
      }
    },
    [amount, calculateExpectedSky, resetTransactionStates]
  );

  // Handle main button click
  const handleMainButtonClick = useCallback(async () => {
    if (!amount) {
      console.log('Amount is empty');
      return;
    }

    // Reset error states if trying again
    resetTransactionStates();

    // Round down the amount to ensure we don't try to use more tokens than available
    // Use different precision for different tokens
    const amountFloat = parseFloat(amount);
    const decimalPlaces = tokenValue === TOKEN_MKR ? 6 : 2;
    const multiplier = Math.pow(10, decimalPlaces);
    const roundedAmount = Math.floor(amountFloat * multiplier) / multiplier;

    // Convert to Wei for blockchain transaction
    const amountInWei = parseEther(roundedAmount.toString());

    console.log('Attempting transaction with amount:', roundedAmount, 'Wei:', amountInWei.toString());
    console.log('Current states - Approved:', isApproved, 'Token:', tokenValue);

    try {
      // Step 1: Approve tokens if not already approved
      if (!isApproved) {
        console.log('Initiating approve transaction...');

        if (tokenValue === TOKEN_DAI) {
          approveTx.writeContract({
            ...daiContractConfig,
            address: skyConfig.contracts.DAI,
            functionName: 'approve',
            args: [skyConfig.contracts.DAIUSDSConverter, BigInt(amountInWei)]
          });
        } else if (tokenValue === TOKEN_MKR) {
          approveTx.writeContract({
            ...mkrContractConfig,
            address: skyConfig.contracts.MKR,
            functionName: 'approve',
            args: [skyConfig.contracts.MKRSKYConverter, BigInt(amountInWei)]
          });
        }
      }
      // Step 2: Upgrade tokens if approved but not yet upgraded
      else if (isApproved && !isUpgraded) {
        console.log('Initiating upgrade transaction...');

        if (tokenValue === TOKEN_DAI) {
          upgradeTx.writeContract({
            ...daiUsdsConverterConfig,
            address: skyConfig.contracts.DAIUSDSConverter,
            functionName: 'daiToUsds',
            args: [address as `0x${string}`, BigInt(amountInWei)]
          });
        } else if (tokenValue === TOKEN_MKR) {
          upgradeTx.writeContract({
            ...mkrSkyConverterConfig,
            address: skyConfig.contracts.MKRSKYConverter,
            functionName: 'mkrToSky',
            args: [address as `0x${string}`, BigInt(amountInWei)]
          });
        }
      }
    } catch (error) {
      console.error('Transaction failed:', error);
      if (!isApproved) {
        dispatchError(`Failed to approve ${tokenValue.toUpperCase()}`);
      } else {
        dispatchError(`Failed to upgrade ${tokenValue.toUpperCase()}`);
      }
    }
  }, [amount, isApproved, isUpgraded, tokenValue, approveTx, upgradeTx, address, skyConfig.contracts, resetTransactionStates]);

  // Compute button text based on transaction states
  const getButtonText = useCallback(() => {
    // Show checking status when amount is being debounced
    if (allowanceChecking) {
      return 'Checking allowance...';
    }

    if (!amount) {
      return 'Enter Amount';
    }

    if (!isApproved) {
      if (approveTx.txHash && !approveTx.isTxConfirmed) {
        return `Approving ${tokenValue.toUpperCase()}...`;
      }
      if (approveTx.txState === 'error') {
        return 'Approval Failed - Try again';
      }
      return `Approve ${tokenValue.toUpperCase()}`;
    }

    if (!isUpgraded) {
      if (upgradeTx.txHash && !upgradeTx.isTxConfirmed) {
        return `Upgrading ${tokenValue.toUpperCase()}...`;
      }
      if (upgradeTx.txState === 'error') {
        return 'Upgrade Failed - Try again';
      }
      return `Upgrade ${tokenValue.toUpperCase()}`;
    }

    return 'Success!';
  }, [
    amount,
    isApproved,
    isUpgraded,
    allowanceChecking,
    tokenValue,
    approveTx.txHash,
    approveTx.isTxConfirmed,
    approveTx.txState,
    upgradeTx.txHash,
    upgradeTx.isTxConfirmed,
    upgradeTx.txState
  ]);

  // Determine if button should be disabled
  const isButtonDisabled = useCallback(() => {
    if (!amount) return true;

    // Disable during allowance checking (debounce period)
    if (allowanceChecking) return true;

    // Disable during transactions
    if (approveTx.txHash && !approveTx.isTxConfirmed) return true;
    if (upgradeTx.txHash && !upgradeTx.isTxConfirmed) return true;

    // Disable when completed
    return isUpgraded;
  }, [amount, allowanceChecking, approveTx.txHash, approveTx.isTxConfirmed, upgradeTx.txHash, upgradeTx.isTxConfirmed, isUpgraded]);

  // Determine if input, token selector, and percentage buttons should be disabled
  const isInputDisabled = isUpgraded || approveTx.txState === 'submitted' || upgradeTx.txState === 'submitted';

  return (
    <StyledCard>
      <Box p={0}>
        <Typography variant="body2" sx={{ mb: 2 }}>
          {tokenValue === TOKEN_MKR ? 'Enter the amount of MKR to receive SKY:' : 'Enter the amount of DAI to receive USDS:'}
        </Typography>
        {tokenValue === TOKEN_MKR && isRateLoading && (
          <Typography variant="body2" sx={{ mb: 2 }}>
            Loading conversion rate...
          </Typography>
        )}
        {tokenValue === TOKEN_MKR && amount && amount !== '0' && !isRateLoading && (
          <Typography variant="body2" sx={{ mb: 2, color: 'success.main' }}>
            Expected output: {expectedOutput} SKY
          </Typography>
        )}
        <Box sx={{ display: 'flex', alignItems: 'center', borderBottom: 1, borderColor: 'divider', py: 2, gap: 2 }}>
          <StyledTextField
            slotProps={{
              input: {
                lang: 'en'
              }
            }}
            fullWidth
            type="number"
            placeholder="Enter amount"
            value={amount}
            onChange={handleAmountChange}
            disabled={isInputDisabled}
            sx={{ '& .MuiOutlinedInput-notchedOutline': { border: 'none' } }}
          />

          <Box
            sx={{
              display: 'flex',
              gap: 1,
              alignItems: 'center'
            }}
          >
            <FormControl fullWidth>
              <StyledSelect
                value={tokenValue}
                label="Token"
                onChange={handleTokenChange}
                disabled={isInputDisabled}
                renderValue={(selected) => {
                  const item = tokenOptions.find((o) => o.value === selected);
                  return (
                    <Box display="flex" alignItems="center" gap={1}>
                      <Avatar src={item?.img} sx={{ width: 24, height: 24 }} />
                      {item?.label}
                    </Box>
                  );
                }}
              >
                {tokenOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Avatar src={option.img} sx={{ width: 24, height: 24 }} />
                      {option.label}
                    </Box>
                  </MenuItem>
                ))}
              </StyledSelect>
            </FormControl>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="textPrimary">
              {getCurrentBalance()} {tokenValue.toUpperCase()}
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
            <PercentButton onClick={() => handlePercentClick(25)} disabled={isInputDisabled}>
              25%
            </PercentButton>
            <PercentButton onClick={() => handlePercentClick(50)} disabled={isInputDisabled}>
              50%
            </PercentButton>
            <PercentButton onClick={() => handlePercentClick(100)} disabled={isInputDisabled}>
              100%
            </PercentButton>
          </Box>
        </Box>
      </Box>
      <Box>
        <Button variant="contained" color="primary" fullWidth sx={{ mt: 2 }} disabled={isButtonDisabled()} onClick={handleMainButtonClick}>
          {getButtonText()}
        </Button>
      </Box>
    </StyledCard>
  );
};

export default UpgradeAssets;
