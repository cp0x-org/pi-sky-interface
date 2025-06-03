import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import { styled } from '@mui/material/styles';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useNavigate } from 'react-router-dom';

export default function RewardTab() {
  const navigate = useNavigate();

  const RewardCard = styled(Paper)(({ theme }) => ({
    ...theme.typography.body2,
    padding: theme.spacing(1),
    color: theme.palette.text.primary,
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: theme.shadows[4]
    },
    ...theme.applyStyles('dark', {
      backgroundColor: theme.palette.secondary.light
    })
  }));

  const handleNavigateToUSDSSky = () => {
    navigate('/rewards/usdsgetsky');
  };

  const handleNavigateToChronicle = () => {
    navigate('/rewards/chronicle');
  };

  return (
    <Box sx={{ width: '100%' }} alignContent={'center'} margin={'auto'}>
      <Typography variant="h2" gutterBottom>
        Sky Token Rewards
      </Typography>
      <Grid container rowSpacing={2} columnSpacing={{ xs: 1, sm: 2, md: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <RewardCard onClick={handleNavigateToUSDSSky}>
            <Box sx={{ p: 2 }}>
              <Typography variant="h4">With: USDS Get: SKY</Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Click to learn more about USDS and SKY rewards
              </Typography>
            </Box>
          </RewardCard>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <RewardCard onClick={handleNavigateToChronicle}>
            <Box sx={{ p: 2 }}>
              <Typography variant="h4">Chronicle Points</Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Click to learn more about Chronicle Points
              </Typography>
            </Box>
          </RewardCard>
        </Grid>
      </Grid>
    </Box>
  );
}
