import { Box, Typography, TextField, Button, styled, Select } from '@mui/material';
import { FC, useEffect, useState } from 'react';
import { useAccount, useWriteContract, useReadContract } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import { useConfigChainId } from 'hooks/useConfigChainId';
import InputLabel from 'ui-component/extended/Form/InputLabel';
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
import { formatUSDS } from '../../../../utils/sky';
import { formatTokenAmount } from '../../../../utils/formatters';
import { StyledCard } from '../../../../components/StyledCard';
import { StyledTextField } from '../../../../components/StyledTextField';
import { StyledSelect } from '../../../../components/StyledSelect';
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

const PercentButton = styled(Button)(({ theme }) => ({
  height: 24,
  padding: '5px 8px 3px',
  borderRadius: 32,
  fontSize: 13,
  fontWeight: 'normal',
  backgroundColor: 'rgba(0, 0, 0, 0.2)',
  color: theme.palette.text.primary,
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)'
  }
}));

const UpgradeAssets: FC<Props> = ({ daiUserBalance, mkrUserBalance }) => {
  const [amount, setAmount] = useState<string>('');
  const [buttonText, setButtonText] = useState<string>('Enter Amount');

  const [isApproved, setIsApproved] = useState<boolean>(false);
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);
  const [expectedOutput, setExpectedOutput] = useState<string>('0');

  const account = useAccount();
  const address = account.address as `0x${string}` | undefined;
  const { config: skyConfig } = useConfigChainId();
  const [tokenValue, setTokenValue] = useState(tokenOptions[0].value);

  // Get the MKR to SKY conversion rate from the contract
  const { data: mkrToSkyRate, isLoading: isRateLoading } = useReadContract({
    ...mkrSkyConverterConfig,
    address: skyConfig.contracts.MKRSKYConverter,
    functionName: 'rate'
  });

  // Calculate expected SKY output when amount or fee changes
  useEffect(() => {
    if (tokenValue === TOKEN_MKR && amount && amount !== '0') {
      calculateExpectedSky(amount);
    } else {
      setExpectedOutput('0');
    }
  }, [amount, tokenValue]);

  // Calculate the expected SKY output based on MKR input and fee
  const calculateExpectedSky = (mkrAmount: string) => {
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
      const grossSky = mkrAmountFloat * rate;

      setExpectedOutput(formatUSDS(grossSky));
    } catch (error) {
      console.error('Error calculating expected SKY:', error);
      setExpectedOutput('0');
    }
  };

  const handlePercentClick = (percent: number) => {
    let currentBalance: bigint | undefined;

    if (tokenValue === TOKEN_DAI) {
      currentBalance = daiUserBalance;
    } else if (tokenValue === TOKEN_MKR) {
      currentBalance = mkrUserBalance;
    }

    if (!currentBalance) return;

    // Calculate the amount based on the percentage
    const value = (Number(formatEther(currentBalance)) * percent) / 100;

    // Set the amount and update button text
    setAmount(value.toString());
    setButtonText(`Approve ${tokenValue.toUpperCase()}`);
    setIsApproved(false);
    setIsConfirmed(false);
  };

  // Get the current token balance based on selected token
  const getCurrentBalance = () => {
    if (tokenValue === TOKEN_DAI) {
      return daiUserBalance ? formatUSDS(formatEther(daiUserBalance)) : '0';
    } else if (tokenValue === TOKEN_MKR) {
      return mkrUserBalance ? formatTokenAmount(mkrUserBalance.toString(), 5) : '0';
    }
    return '0';
  };

  const {
    writeContract: writeApprove,
    isSuccess: isApproveSuccess,
    error: approveError,
    isError: isApproveError
    // data: approveData,
    // status: approveStatus
  } = useWriteContract();

  const {
    writeContract: writeConfirm,
    error: confirmError,
    isError: isConfirmError,
    isSuccess: isConfirmSuccess
    // data: supplyData,
    // status: supplyStatus
  } = useWriteContract();

  useEffect(() => {
    if (isApproveSuccess) {
      setIsApproved(true);
      setButtonText('Upgrade tokens');
    }
    if (isApproveError) {
      console.error('Approval failed:', approveError);
      setButtonText('Enter Amount');
    }
    if (isConfirmSuccess) {
      setIsConfirmed(true);
      setButtonText('Success!');
    }
    if (isConfirmError) {
      console.error('Deposit failed:', confirmError);
      setButtonText('ERROR');
    }
  }, [isApproveSuccess, isApproveError, approveError, isConfirmSuccess, isConfirmError, confirmError]);

  const handleMainButtonClick = async () => {
    if (!amount) {
      console.log('Supply amount is empty');
      return;
    }

    const amountInWei = parseEther(amount);

    try {
      if (!isApproved) {
        // Approve appropriate token based on user selection
        if (tokenValue === TOKEN_DAI) {
          writeApprove({
            ...daiContractConfig,
            address: skyConfig.contracts.DAI,
            functionName: 'approve',
            args: [skyConfig.contracts.DAIUSDSConverter, BigInt(amountInWei)]
          });
        } else if (tokenValue === TOKEN_MKR) {
          writeApprove({
            ...mkrContractConfig,
            address: skyConfig.contracts.MKR,
            functionName: 'approve',
            args: [skyConfig.contracts.MKRSKYConverter, BigInt(amountInWei)]
          });
        }
      } else if (!isConfirmed) {
        if (tokenValue === TOKEN_DAI) {
          writeConfirm({
            ...daiUsdsConverterConfig,
            address: skyConfig.contracts.DAIUSDSConverter,
            functionName: 'daiToUsds',
            args: [address as `0x${string}`, BigInt(amountInWei)]
          });
        } else if (tokenValue === TOKEN_MKR) {
          writeConfirm({
            ...mkrSkyConverterConfig,
            address: skyConfig.contracts.MKRSKYConverter,
            functionName: 'mkrToSky',
            args: [address as `0x${string}`, BigInt(amountInWei)]
          });
        }
      }
    } catch (error) {
      console.error('Transaction failed:', error);
      setIsApproved(false);
      setIsConfirmed(false);
      setButtonText('Enter Amount');
    }
  };

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
            fullWidth
            type="number"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setButtonText(e.target.value ? `Approve ${tokenValue.toUpperCase()}` : 'Enter Amount');
              setIsApproved(false);
              setIsConfirmed(false);

              if (tokenValue === TOKEN_MKR && e.target.value) {
                calculateExpectedSky(e.target.value);
              }
            }}
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
                onChange={(e: SelectChangeEvent<any>, _child) => {
                  const value = e.target.value;
                  setTokenValue(value);
                  setIsApproved(false);
                  setIsConfirmed(false);
                  if (amount) {
                    setButtonText(`Approve ${value.toUpperCase()}`);
                  }
                }}
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
            <PercentButton onClick={() => handlePercentClick(25)}>25%</PercentButton>
            <PercentButton onClick={() => handlePercentClick(50)}>50%</PercentButton>
            <PercentButton onClick={() => handlePercentClick(100)}>100%</PercentButton>
          </Box>
        </Box>
      </Box>
      <Box>
        <Button variant="contained" color="primary" fullWidth sx={{ mt: 2 }} onClick={() => handleMainButtonClick()}>
          {buttonText}
        </Button>
      </Box>
    </StyledCard>
  );
};

export default UpgradeAssets;
