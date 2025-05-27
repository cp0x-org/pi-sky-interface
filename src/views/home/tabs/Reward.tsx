import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import { styled } from '@mui/material/styles';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

export default function RewardTab() {
  const RewardCard = styled(Paper)(({ theme }) => ({
    ...theme.typography.body2,
    padding: theme.spacing(1),
    color: theme.palette.text.primary,
    ...theme.applyStyles('dark', {
      backgroundColor: theme.palette.secondary.light
    })
  }));
  return (
    <Box sx={{ width: '100%' }}>
      <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 2, md: 3 }}>
        <Grid size={{ xs: 12, sm: 12, md: 6 }}>
          <RewardCard>
            <Typography>With: USDS Get: SKY</Typography>
          </RewardCard>
        </Grid>
        <Grid size={{ xs: 12, sm: 12, md: 6 }}>
          <RewardCard>
            <Typography>Chronicle Points</Typography>
          </RewardCard>
        </Grid>
      </Grid>
    </Box>
  );
}
