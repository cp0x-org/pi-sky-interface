import { FC, useEffect, useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { IconExternalLink } from '@tabler/icons-react';
import { useConfigChainId } from '../../../../hooks/useConfigChainId';
import { ReactComponent as SkyLogo } from 'assets/images/sky/ethereum/sky.svg';
import { Chip, Divider, Alert, Grid, CircularProgress, Paper, Skeleton } from '@mui/material';
import { useAccount } from 'wagmi';
import { useDelegationData } from '../../../../hooks/useDelegationData';
import { formatEther } from 'viem';
import { useStakingData } from '../../../../hooks/useStakingData';

interface PositionsProps {
  stakeData?: {
    amount: string;
    rewardAddress: string;
    delegatorAddress: string;
  };
}

const formatAmount = (amount: string): string => {
  try {
    // Convert from wei to ETH and format to 4 decimal places
    return Number(formatEther(BigInt(amount))).toFixed(4);
  } catch (error) {
    console.error('Error formatting amount:', error);
    return '0.0000';
  }
};

const Positions: FC<PositionsProps> = ({ stakeData }) => {
  const { config: skyConfig } = useConfigChainId();
  const { address } = useAccount();
  const { delegatedTo, totalDelegated, isLoading, error } = useDelegationData();
  const { stakingLocks, stakingFrees } = useStakingData();

  // Create a set of freed position indexes for quick lookup
  const [freedPositionIndexes, setFreedPositionIndexes] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (stakingFrees && stakingFrees.length > 0) {
      const freedIndexes = new Set(stakingFrees.map((free) => free.index));
      setFreedPositionIndexes(freedIndexes);
      console.log('Freed position indexes:', Array.from(freedIndexes));
    }
  }, [stakingFrees]);

  // Format delegated address for display
  const shortenAddress = (address: string): string => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  if (isLoading) {
    return (
      <Box sx={{ width: '100%', my: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ mt: 2 }}>
          Loading delegation data...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Error loading delegation data: {error}
      </Alert>
    );
  }

  if (delegatedTo.length === 0 || !address) {
    return (
      <Typography variant="body2" sx={{ mt: 2 }}>
        You don't have any active delegation positions.
      </Typography>
    );
  }

  console.log('DELEGRATED TO');
  console.log(delegatedTo);

  // Filter out positions that have been freed
  const activePositions = delegatedTo;

  return (
    <Box sx={{ width: '100%', mt: 4 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 2, bgcolor: 'background.paper' }}>
        <Typography variant="h6" gutterBottom>
          Your Delegation Summary
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body1">Total Delegated Amount:</Typography>
          <Typography variant="h6" color="primary">
            {totalDelegated.toFixed(4)} SKY
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
          <Typography variant="body1">Number of Delegates:</Typography>
          <Typography variant="h6" color="primary">
            {activePositions.length}
          </Typography>
        </Box>
      </Paper>

      <Typography variant="h5" gutterBottom>
        Delegation Positions
      </Typography>

      <Grid container spacing={3}>
        {activePositions.length === 0 ? (
          <Grid item xs={12}>
            <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              No Positions
            </Typography>
          </Grid>
        ) : (
          activePositions.map((item, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Card sx={{ borderRadius: 2, height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      {item.positionIndex !== undefined ? `Position #${item.positionIndex}` : `Delegate Position #${index + 1}`}
                    </Typography>
                    <Chip label="Active" color="success" size="small" />
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography color="text.secondary">Delegate Address:</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography
                        variant="body2"
                        sx={{
                          maxWidth: '150px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {shortenAddress(item.address)}
                      </Typography>
                      <Box
                        component="a"
                        href={`https://etherscan.io/address/${item.address}`}
                        target="_blank"
                        rel="noreferrer"
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          ml: 1,
                          color: 'primary.main'
                        }}
                      >
                        <IconExternalLink size={16} />
                      </Box>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography color="text.secondary">Locked Amount:</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <SkyLogo width="16" height="16" style={{ marginRight: '8px' }} />
                      <Typography>{formatAmount(item.lockAmount)} SKY</Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography color="text.secondary">Position Index:</Typography>
                    <Typography>
                      {item.positionIndex !== undefined
                        ? `#${item.positionIndex}`
                        : item.events && item.events[0] && item.events[0].hash
                          ? 'Processing...'
                          : 'Unknown'}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography color="text.secondary">Last Updated:</Typography>
                    <Typography variant="body2">
                      {item.events && item.events.length > 0 ? new Date(item.events[0].blockTimestamp).toLocaleDateString() : 'Unknown'}
                    </Typography>
                  </Box>

                  {item.events && item.events.length > 0 && item.events[0].hash && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography color="text.secondary">Transaction:</Typography>
                      <Box
                        component="a"
                        href={`https://etherscan.io/tx/${item.events[0].hash}`}
                        target="_blank"
                        rel="noreferrer"
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          color: 'primary.main',
                          fontSize: '0.875rem'
                        }}
                      >
                        {shortenAddress(item.events[0].hash)}
                        <IconExternalLink size={14} style={{ marginLeft: '4px' }} />
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>
    </Box>
  );
};

export default Positions;
