import { Box, Typography, TextField, Button, styled } from '@mui/material';
import { FC, useEffect, useState } from 'react';
import { ReactComponent as UsdsLogo } from 'assets/images/sky/usds.svg';
import { useAccount, useChainId, useWriteContract } from 'wagmi';
import { usdsContractConfig } from 'config/abi/Usds';
import { savingsUsdsContractConfig } from 'config/abi/SavingsUsds';
import { parseEther } from 'viem';
import { useConfigChainId } from '../../../../hooks/useConfigChainId';
import { useTheme } from '@mui/material/styles';
import { StyledCard } from '../../../../components/StyledCard';
import { StyledTextField } from '../../../../components/StyledTextField';

interface Props {
  userBalance?: string;
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

const Deposit: FC<Props> = ({ userBalance = '0' }) => {
  const [amount, setAmount] = useState<string>('');
  const [buttonText, setButtonText] = useState<string>('Enter Amount');
  const [isApproved, setIsApproved] = useState<boolean>(false);
  const [isDeposited, setIsDeposited] = useState<boolean>(false);
  const account = useAccount();
  const address = account.address as `0x${string}` | undefined;
  const theme = useTheme();
  const { config: skyConfig } = useConfigChainId();

  const handlePercentClick = (percent: number) => {
    if (userBalance === '0') return;

    // Convert userBalance from string to number
    const balance = parseFloat(userBalance);
    if (isNaN(balance)) return;

    // Calculate the amount based on the percentage
    const value = (balance * percent) / 100;

    // Set the amount and update button text
    setAmount(value.toString());
    setButtonText('Approve supply amount');
  };

  // const { writeContract: writeApprove } = useWriteContract();
  // const { writeContract: writeSupply } = useWriteContract();

  const {
    writeContract: writeApprove,
    isSuccess: isApproveSuccess,
    error: approveError,
    isError: isApproveError
    // data: approveData,
    // status: approveStatus
  } = useWriteContract();

  const {
    writeContract: writeDeposit,
    error: depositError,
    isError: isDepositError,
    isSuccess: isDepositSuccess
    // data: supplyData,
    // status: supplyStatus
  } = useWriteContract();

  useEffect(() => {
    if (isApproveSuccess) {
      setIsApproved(true);
      setButtonText('Supply USDS');
    }
    if (isApproveError) {
      console.error('Approval failed:', approveError);
      setButtonText('Enter Amount');
    }
    if (isDepositSuccess) {
      setIsDeposited(true);
      setButtonText('Success!');
    }
    if (isDepositError) {
      console.error('Deposit failed:', depositError);
      setButtonText('ERROR');
    }
  }, [isApproveSuccess, isApproveError, approveError, isDepositSuccess, isDepositError, depositError]);

  const handleMainButtonClick = async () => {
    if (!amount) {
      console.log('Supply amount is empty');
      return;
    }

    const amountInWei = parseEther(amount);

    try {
      if (!isApproved) {
        writeApprove({
          ...usdsContractConfig,
          address: skyConfig.contracts.USDS,
          functionName: 'approve',
          args: [skyConfig.contracts.SavingsUSDS, BigInt(amountInWei)]
        });
      } else if (!isDeposited) {
        writeDeposit({
          ...savingsUsdsContractConfig,
          address: skyConfig.contracts.SavingsUSDS,
          functionName: 'deposit',
          args: [BigInt(amountInWei), address as `0x${string}`, 1]
        });
      }
    } catch (error) {
      console.error('Transaction failed:', error);
      setIsApproved(false);
      setIsDeposited(false);
      setButtonText('Enter Amount');
    }
  };

  return (
    <StyledCard>
      <Box p={0}>
        <Typography variant="body2" sx={{ mb: 2 }}>
          How much USDS would you like to supply?
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
              setButtonText(e.target.value ? `Approve supply amount` : 'Enter Amount');
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
              {userBalance} USDS
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
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

export default Deposit;
