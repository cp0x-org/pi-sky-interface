import { FC } from 'react';
import { Box, Typography, TextField, Button, styled } from '@mui/material';
import { useEffect, useState } from 'react';
import { ReactComponent as UsdsLogo } from 'assets/images/sky/usds.svg';
import { useAccount, useWriteContract } from 'wagmi';
import { usdsContractConfig } from 'config/abi/Usds';
import { parseEther, formatEther } from 'viem';
import { stakingRewardContractConfig } from '../../../../../config/abi/StakingReward';
import { skyConfig } from 'config/index';
import Alert from '@mui/material/Alert';
import { openSnackbar } from '../../../../../store/slices/snackbar';
import { useDispatch } from 'store';
import { useConfigChainId } from '../../../../../hooks/useConfigChainId';
import { formatUSDS } from '../../../../../utils/sky';
interface Props {
  userBalance?: bigint;
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

const Stake: FC<Props> = ({ userBalance = 0n }) => {
  const [amount, setAmount] = useState<string>('');
  const [buttonText, setButtonText] = useState<string>('Enter Amount');
  const [isApproved, setIsApproved] = useState<boolean>(false);
  const [isDeposited, setIsDeposited] = useState<boolean>(false);
  const [showAlert, setShowAlert] = useState<boolean>(true);
  const dispatch = useDispatch();
  const handlePercentClick = (percent: number) => {
    if (!userBalance) return;
    const value = (Number(formatEther(BigInt(userBalance))) * percent) / 100;
    setAmount(value.toString());
    setButtonText('Approve supply amount');
  };
  const { config: skyConfig } = useConfigChainId();
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
      setShowAlert(true);
    }
    if (isDepositError) {
      console.error('Deposit failed:', depositError);
      setButtonText('ERROR');
    }
    if (showAlert) {
      openSnackbar({
        open: true,
        anchorOrigin: { vertical: 'top', horizontal: 'center' }
      });
      setTimeout(function () {
        setShowAlert(false);
      }, 3000);
    }
  }, [isApproveSuccess, isApproveError, approveError, isDepositSuccess, isDepositError, depositError]);

  const handleMainButtonClick = async () => {
    // dispatch(
    //   openSnackbar({
    //     open: true,
    //     anchorOrigin: { vertical: 'top', horizontal: 'center' },
    //     message: 'This is default message',
    //     variant: 'alert',
    //     alert: { color: 'success' },
    //     severity: 'success'
    //   })
    // );
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
          args: [skyConfig.contracts.StakingRewards, BigInt(amountInWei)]
        });
      } else if (!isDeposited) {
        writeDeposit({
          ...stakingRewardContractConfig,
          address: skyConfig.contracts.StakingRewards,
          functionName: 'stake',
          args: [BigInt(amountInWei), 1]
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
        <Box sx={{ display: 'flex', alignItems: 'center', borderBottom: 1, borderColor: 'divider', py: 2, gap: 2 }}>
          <TextField
            fullWidth
            type="number"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '' || Number(value) >= 0) {
                setAmount(value);
                setButtonText(value ? `Approve supply amount` : 'Enter Amount');
              }
            }}
            // sx={{
            //   '& input::-webkit-outer-spin-button': {
            //     display: 'none'
            //   },
            //   '& input::-webkit-inner-spin-button': { display: 'none' },
            //   '& input[type=number]': {
            //     MozAppearance: 'textfield'
            //   }
            // }}
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
              {userBalance ? formatUSDS(formatEther(userBalance)) : '0'} USDS
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
      {/*<Box>*/}
      {/*  {showAlert && (*/}
      {/*    <Alert variant="filled" severity="success">*/}
      {/*      This is an error alert — check it out!*/}
      {/*    </Alert>*/}
      {/*  )}*/}
      {/*</Box>*/}
    </StyledCard>
  );
};

export default Stake;
