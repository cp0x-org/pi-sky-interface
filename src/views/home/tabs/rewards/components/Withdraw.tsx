import { Box, Typography, TextField, Button, styled } from '@mui/material';
import { FC, useEffect, useState } from 'react';
import { ReactComponent as UsdsLogo } from 'assets/images/sky/usds.svg';
import { useAccount, useWriteContract } from 'wagmi';
// import { usdsContractConfig } from '../contracts/Usds';
// import { savingsUsdsContractConfig } from 'config/abi/SavingsUsds';
import { parseEther } from 'viem';
import { stakingRewardContractConfig } from '../../../../../config/abi/StakingReward';
import { skyConfig } from 'config/index';

interface Props {
  stakedBalance?: string;
}

const StyledCard = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4),
  minHeight: 64,
  overflow: 'hidden',
  borderRadius: 16,
  width: '100%',
  background: theme.palette.secondary.light,
  backgroundBlendMode: 'overlay'
}));

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

const Withdraw: FC<Props> = ({ stakedBalance = '...' }) => {
  const [amount, setAmount] = useState<string>('');
  const [buttonText, setButtonText] = useState<string>('Enter Amount');
  const [isWithdrawed, setIsWithdrawed] = useState<boolean>(false);
  // const account = useAccount();
  // const address = account.address as `0x${string}` | undefined;

  const handlePercentClick = (percent: number) => {
    // TODO: Implement percentage calculation based on available balance
    console.log(`Clicked ${percent}%`);
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

    try {
      if (!isWithdrawed) {
        writeWithdraw({
          ...stakingRewardContractConfig,
          address: skyConfig.Mainnet.contracts.StakingRewards,
          functionName: 'withdraw',
          args: [BigInt(amountInWei)]
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
        <Box sx={{ display: 'flex', alignItems: 'center', borderBottom: 1, borderColor: 'divider', py: 2, gap: 2 }}>
          <TextField
            fullWidth
            type="number"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setButtonText(e.target.value ? `Withdraw` : 'Enter Amount');
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
              {stakedBalance} USDS
            </Typography>
          </Box>
          {/*<Box sx={{ display: 'flex', gap: 1 }}>*/}
          {/*  <PercentButton onClick={() => handlePercentClick(25)}>25%</PercentButton>*/}
          {/*  <PercentButton onClick={() => handlePercentClick(50)}>50%</PercentButton>*/}
          {/*  <PercentButton onClick={() => handlePercentClick(100)}>100%</PercentButton>*/}
          {/*</Box>*/}
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
