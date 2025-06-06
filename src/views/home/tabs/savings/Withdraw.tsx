import { Box, Typography, TextField, Button, styled } from '@mui/material';
import { FC, useEffect, useState } from 'react';
import { ReactComponent as UsdsLogo } from 'assets/images/sky/usds.svg';
import { useAccount, useWriteContract } from 'wagmi';

import { savingsUsdsContractConfig } from 'config/abi/SavingsUsds';
import { parseEther } from 'viem';
import { skyConfig } from 'config/index';
import { useConfigChainId } from '../../../../hooks/useConfigChainId';
import { useTheme } from '@mui/material/styles';
import { StyledCard } from '../../../../components/StyledCard';
import { StyledTextField } from '../../../../components/StyledTextField';

interface Props {
  savingsBalance?: string;
}

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

const Withdraw: FC<Props> = ({ savingsBalance = '...' }) => {
  const [amount, setAmount] = useState<string>('');
  const [buttonText, setButtonText] = useState<string>('Enter Amount');
  const [isWithdrawed, setIsWithdrawed] = useState<boolean>(false);
  const account = useAccount();
  const address = account.address as `0x${string}` | undefined;
  const { config: skyConfig } = useConfigChainId();
  const theme = useTheme();
  const handlePercentClick = (percent: number) => {
    if (savingsBalance === '...') return;

    // Convert savingsBalance from string to number
    const balance = parseFloat(savingsBalance);
    if (isNaN(balance)) return;

    // Calculate the amount based on the percentage
    const value = (balance * percent) / 100;

    // Set the amount and update button text
    setAmount(value.toString());
    setButtonText('Withdraw');
  };

  // const { writeContract: writeApprove } = useWriteContract();
  // const { writeContract: writeSupply } = useWriteContract();

  const {
    writeContract: writeWithdraw,
    error: withdrawError,
    isError: isWithdrawError,
    isSuccess: isWithdrawSuccess
    // data: supplyData,
    // status: supplyStatus
  } = useWriteContract();

  useEffect(() => {
    if (isWithdrawSuccess) {
      setIsWithdrawed(true);
      setButtonText('Success!');
    }
    if (isWithdrawError) {
      console.error('Withdraw failed:', withdrawError);
      setButtonText('ERROR');
    }
  }, [isWithdrawSuccess, isWithdrawError, withdrawError]);

  const handleMainButtonClick = async () => {
    if (!amount) {
      console.log('Withdraw amount is empty');
      return;
    } else {
      console.log('Withdraw amount is not empty');
    }

    const amountInWei = parseEther(amount);
    console.log(amountInWei.toString());
    console.log(BigInt(amountInWei).toString());

    const hexAmount = `0x${amountInWei.toString(16)}`;
    console.log(hexAmount);

    try {
      if (!isWithdrawed) {
        writeWithdraw({
          ...savingsUsdsContractConfig,
          address: skyConfig.contracts.SavingsUSDS,
          functionName: 'withdraw',
          args: [BigInt(hexAmount), address as `0x${string}`, address as `0x${string}`]
        });
      }
    } catch (error) {
      console.error('Transaction failed:', error);
      setIsWithdrawed(false);
      setButtonText('Enter Amount');
    }
  };

  return (
    <StyledCard>
      <Box p={0}>
        <Typography variant="body2" sx={{ mb: 2 }}>
          How much USDS would you like to withdraw?
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            borderBottom: 1,
            borderColor: 'divider',
            py: 2,
            gap: 2
          }}
        >
          <StyledTextField
            fullWidth
            type="number"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setButtonText(e.target.value ? `Withdraw` : 'Enter Amount');
            }}
          />

          <Box
            sx={{
              display: 'flex',
              gap: 1,
              alignItems: 'center'
            }}
          >
            <UsdsLogo width="24" height="24" />
            <Typography>USDS</Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="textPrimary">
              {savingsBalance} USDS
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

export default Withdraw;
