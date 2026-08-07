import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import { styled } from '@mui/material/styles';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router-dom';
import { Alert } from '@mui/material';
import { useAccount } from 'wagmi';
import { FormattedMessage } from 'react-intl';

export default function RewardTab() {
  const account = useAccount();
  const address = account.address as `0x${string}` | undefined;

  const RewardCard = styled(Paper)<{ component?: React.ElementType; to?: string }>(({ theme }) => ({
    ...theme.typography.body2,
    display: 'block',
    padding: theme.spacing(1),
    color: theme.palette.text.primary,
    textDecoration: 'none',
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

  return (
    <Box sx={{ width: '100%' }} alignContent={'center'} margin={'auto'}>
      <Typography variant="h2" component="h1" gutterBottom>
        <FormattedMessage id="rewards.title" />
      </Typography>
      {!address && (
        <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
          <FormattedMessage id="common.connectWallet" />
        </Alert>
      )}
      <Grid container rowSpacing={2} columnSpacing={{ xs: 1, sm: 2, md: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <RewardCard component={RouterLink} to="/rewards/usdsgetsky">
            <Box sx={{ p: 2 }}>
              <Typography variant="h4" component="h2">
                <FormattedMessage id="rewards.usdsSky.title" />
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                <FormattedMessage id="rewards.usdsSky.cardDescription" />
              </Typography>
            </Box>
          </RewardCard>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <RewardCard component={RouterLink} to="/rewards/chronicle">
            <Box sx={{ p: 2 }}>
              <Typography variant="h4" component="h2">
                <FormattedMessage id="rewards.chronicle.title" />
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                <FormattedMessage id="rewards.chronicle.cardDescription" />
              </Typography>
            </Box>
          </RewardCard>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <RewardCard component={RouterLink} to="/rewards/usdsgetspk">
            <Box sx={{ p: 2 }}>
              <Typography variant="h4" component="h2">
                <FormattedMessage id="rewards.usdsSpk.title" />
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                <FormattedMessage id="rewards.usdsSpk.cardDescription" />
              </Typography>
            </Box>
          </RewardCard>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <RewardCard component={RouterLink} to="/rewards/usdsgetgrove">
            <Box sx={{ p: 2 }}>
              <Typography variant="h4" component="h2">
                <FormattedMessage id="rewards.usdsGrove.title" />
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                <FormattedMessage id="rewards.usdsGrove.cardDescription" />
              </Typography>
            </Box>
          </RewardCard>
        </Grid>
      </Grid>
    </Box>
  );
}
