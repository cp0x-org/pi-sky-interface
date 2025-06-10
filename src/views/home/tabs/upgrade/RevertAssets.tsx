import { Box, Typography, TextField, Button, styled } from '@mui/material';
import { FC, useEffect, useState } from 'react';
import { ReactComponent as UsdsLogo } from 'assets/images/sky/usds.svg';
import { useAccount, useWriteContract } from 'wagmi';

import { formatEther, parseEther } from 'viem';
import { useConfigChainId } from '../../../../hooks/useConfigChainId';
import { daiUsdsConverterConfig } from '../../../../config/abi/DaiUsdsConverter';
import { usdsContractConfig } from '../../../../config/abi/Usds';
import { daiContractConfig } from '../../../../config/abi/Dai';
import { formatUSDS } from '../../../../utils/sky';
import { StyledCard } from '../../../../components/StyledCard';
import { StyledTextField } from '../../../../components/StyledTextField';

interface Props {
  usdsUserBalance?: bigint;
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

const RevertAssets: FC<Props> = ({ usdsUserBalance }) => {
  const [amount, setAmount] = useState<string>('');
  const [buttonText, setButtonText] = useState<string>('Enter Amount');

  const [isApproved, setIsApproved] = useState<boolean>(false);
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);

  const account = useAccount();
  const address = account.address as `0x${string}` | undefined;
  const { config: skyConfig } = useConfigChainId();
  const handlePercentClick = (percent: number) => {
    if (!usdsUserBalance) return;

    // Calculate the amount based on the percentage
    const value = (Number(formatEther(usdsUserBalance)) * percent) / 100;

    // Set the amount and update button text
    setAmount(value.toString());
    setButtonText('Approve');
    setIsApproved(false);
    setIsConfirmed(false);
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
      setButtonText('Revert USDS -> DAI');
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
        writeApprove({
          ...usdsContractConfig,
          address: skyConfig.contracts.USDS,
          functionName: 'approve',
          args: [skyConfig.contracts.DAIUSDSConverter, BigInt(amountInWei)]
        });
      } else if (!isConfirmed) {
        writeConfirm({
          ...daiUsdsConverterConfig,
          address: skyConfig.contracts.DAIUSDSConverter,
          functionName: 'usdsToDai',
          args: [address as `0x${string}`, BigInt(amountInWei)]
        });
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
          How much USDS would you like to revert to DAI?
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', borderBottom: 1, borderColor: 'divider', py: 2, gap: 2 }}>
          <StyledTextField
            fullWidth
            type="number"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setButtonText(e.target.value ? `Revert` : 'Enter Amount');
              setIsApproved(false);
              setIsConfirmed(false);
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

          {/*<Chip label="USDS" variant="outlined" avatar={<UsdsLogo width="24" height="24" />} sx={{ border: 'none' }} />*/}

          {/*<Button*/}
          {/*  disabled*/}
          {/*  sx={{ maxWidth: 104 }}*/}
          {/*  startIcon={<UsdsLogo width="24" height="24" />}*/}
          {/*>*/}
          {/*  USDS*/}
          {/*</Button>*/}
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="textPrimary">
              {usdsUserBalance ? formatUSDS(formatEther(usdsUserBalance)) : '0'} USDS
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

export default RevertAssets;
