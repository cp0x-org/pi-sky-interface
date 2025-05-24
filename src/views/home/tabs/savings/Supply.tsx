import { Box, Typography, TextField, Button, styled } from '@mui/material';
import { useState } from 'react';
import { ReactComponent as UsdsLogo } from 'assets/images/sky/usds.svg';
// import Chip from '@mui/material/Chip';
// import Paper from '@mui/material/Paper';
// import Stack from '@mui/material/Stack';

const StyledCard = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4),
  minHeight: 64,
  overflow: 'hidden',
  borderRadius: 16,
  width: '100%',
  background: 'radial-gradient(100% 333.15% at 0% 100%, rgba(255, 255, 255, 0) 0%, rgba(255, 167, 78, 0.1) 100%) rgba(255, 167, 78, 0.05)',
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

const Supply = () => {
  const [amount, setAmount] = useState<string>('');

  return (
    <StyledCard>
      <Box p={0}>
        <Typography variant="body2" sx={{ mb: 2 }}>
          How much USDS would you like to supply?
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', borderBottom: 1, borderColor: 'divider', py: 2 }}>
          <TextField
            fullWidth
            type="number"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            sx={{ '& .MuiOutlinedInput-notchedOutline': { border: 'none' } }}
          />
          {/*<Chip label="USDS" variant="outlined" avatar={<UsdsLogo width="24" height="24" />} sx={{ border: 'none' }} />*/}

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
            <Typography variant="body2" color="textSecondary">
              13.27 USDS
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <PercentButton>25%</PercentButton>
            <PercentButton>50%</PercentButton>
            <PercentButton>100%</PercentButton>
          </Box>
        </Box>
      </Box>
      <Box>
        <Button variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>
          Deposit
        </Button>
      </Box>
    </StyledCard>
  );
};

export default Supply;
