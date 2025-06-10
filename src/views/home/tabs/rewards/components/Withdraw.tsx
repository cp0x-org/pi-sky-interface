import { Box, Typography, Button } from '@mui/material';
import { FC, useEffect, useState } from 'react';
import { ReactComponent as UsdsLogo } from 'assets/images/sky/usds.svg';
import { useWriteContract } from 'wagmi';
import { parseEther } from 'viem';
import { stakingRewardContractConfig } from 'config/abi/StakingReward';
import { StyledCard } from 'components/StyledCard';
import { StyledTextField } from 'components/StyledTextField';
import { formatTokenAmount } from 'utils/formatters';
import { dispatchError, dispatchSuccess } from 'utils/snackbar';
import { PercentButton } from 'components/PercentButton';

interface Props {
  stakedBalance?: string;
  rewardBalance?: bigint;
  rewardAddress?: string;
}

const Withdraw: FC<Props> = ({ stakedBalance = '0', rewardBalance = 0n, rewardAddress = '' }) => {
  const [amount, setAmount] = useState<string>('');
  const [buttonText, setButtonText] = useState<string>('Enter Amount');
  const [isWithdrawed, setIsWithdrawed] = useState<boolean>(false);
  const [isClaimed, setIsClaimed] = useState<boolean>(false);

  const handlePercentClick = (percent: number) => {
    if (stakedBalance === '0') return;

    // Convert stakedBalance from string to number
    const balance = parseFloat(stakedBalance);
    if (isNaN(balance)) return;

    // Calculate the amount based on the percentage
    const value = (balance * percent) / 100;

    // Set the amount and update button text
    setAmount(value.toString());
    setButtonText('Withdraw');
  };

  const {
    writeContract: writeWithdraw,
    error: withdrawError,
    isError: isWithdrawError,
    isSuccess: isWithdrawSuccess
    // data: supplyData,
    // status: supplyStatus
  } = useWriteContract();

  const { writeContract: writeClaim, isError: isClaimError, isSuccess: isClaimSuccess } = useWriteContract();

  useEffect(() => {
    if (isWithdrawSuccess) {
      setIsWithdrawed(true);
      dispatchSuccess('USDS withdrawn successfully!');
    }
    if (isWithdrawError) {
      console.error('Withdraw failed:', withdrawError);
      setButtonText('ERROR');
      dispatchError('USDS Withdraw failed');
    }
    if (isClaimSuccess) {
      dispatchSuccess(`SKY claimed successfully!`);
    }
    if (isClaimError) {
      dispatchError('Failed to claim SKY');
    }
  }, [isWithdrawSuccess, isWithdrawError, withdrawError, isClaimSuccess, isClaimError]);

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
          address: rewardAddress as `0x${string}`,
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

  const handleClaimButtonClick = async () => {
    try {
      if (!isClaimed) {
        writeClaim({
          ...stakingRewardContractConfig,
          address: rewardAddress as `0x${string}`,
          functionName: 'getReward',
          args: []
        });
      }
    } catch (error) {
      console.error('Transaction failed:', error);
      setIsClaimed(false);
    }
  };

  return (
    <>
      <StyledCard>
        <Box p={0}>
          <Typography variant="body2" sx={{ mb: 2 }}>
            How much USDS would you like to withdraw?
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', borderBottom: 1, borderColor: 'divider', py: 2, gap: 2 }}>
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
                {stakedBalance} USDS
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

      {rewardBalance != 0n && (
        <Button variant="outlined" color="secondary" fullWidth sx={{ mt: 2 }} onClick={() => handleClaimButtonClick()}>
          Claim {formatTokenAmount(rewardBalance.toString(), 4)} SKY
        </Button>
      )}
    </>
  );
};

export default Withdraw;
