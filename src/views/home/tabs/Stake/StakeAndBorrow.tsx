import { Box, Typography, TextField, Button, styled, Alert } from '@mui/material';
import { FC, useState, useEffect } from 'react';
import { ReactComponent as SkyLogo } from 'assets/images/sky/ethereum/sky.svg';
import { useAccount, useChainId, useWriteContract } from 'wagmi';
import { usdsContractConfig } from 'config/abi/Usds';
import { savingsUsdsContractConfig } from 'config/abi/SavingsUsds';
import { formatEther, parseEther } from 'viem';
import { useConfigChainId } from '../../../../hooks/useConfigChainId';

interface Props {
  userBalance?: bigint;
  amount: string;
  onChange: (v: string) => void;
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

const StakeAndBorrow: FC<Props> = ({ userBalance = 0n, amount, onChange }) => {
  const [error, setError] = useState<string | null>(null);
  const maxAmount = userBalance ? formatEther(userBalance) : '0';

  // Helper function to safely compare amounts
  const isAmountTooLarge = (amount: string, maxAmount: string): boolean => {
    try {
      const amountNum = parseFloat(amount);
      const maxAmountNum = parseFloat(maxAmount);
      return amountNum > maxAmountNum;
    } catch (error) {
      return false;
    }
  };

  // Validate amount whenever it changes
  useEffect(() => {
    if (amount && isAmountTooLarge(amount, maxAmount)) {
      setError(`Amount exceeds your balance. Maximum: ${parseFloat(maxAmount).toFixed(4)} SKY`);
    } else {
      setError(null);
    }
  }, [amount, maxAmount]);

  const handlePercentClick = (percent: number) => {
    if (!userBalance) return;
    const percentAmount = (userBalance * BigInt(percent)) / 100n;
    onChange(formatEther(percentAmount));
  };

  const handleAmountChange = (value: string) => {
    // Accept the input even if it exceeds balance, but show an error
    onChange(value);
  };

  return (
    <StyledCard>
      <Box p={0}>
        <Typography variant="body2" sx={{ mb: 2 }}>
          How much SKY would you like to stake?
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', borderBottom: 1, borderColor: error ? 'error.main' : 'divider', py: 2, gap: 2 }}>
          <TextField
            fullWidth
            type="number"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            error={!!error}
            sx={{
              '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
              '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
                '-webkit-appearance': 'none',
                margin: 0
              },
              '& input[type=number]': {
                '-moz-appearance': 'textfield'
              }
            }}
          />

          <Box
            sx={{
              display: 'flex',
              gap: 1,
              alignItems: 'center'
            }}
          >
            <SkyLogo width="24" height="24" />
            <Typography>SKY</Typography>
          </Box>
        </Box>

        {error && (
          <Typography color="error" variant="caption" sx={{ mt: 1, display: 'block' }}>
            {error}
          </Typography>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="textPrimary">
              {userBalance ? Number(formatEther(userBalance)).toFixed(4) : '0'} SKY
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <PercentButton onClick={() => handlePercentClick(25)}>25%</PercentButton>
            <PercentButton onClick={() => handlePercentClick(50)}>50%</PercentButton>
            <PercentButton onClick={() => handlePercentClick(100)}>100%</PercentButton>
          </Box>
        </Box>
      </Box>
    </StyledCard>
  );
};

export default StakeAndBorrow;
