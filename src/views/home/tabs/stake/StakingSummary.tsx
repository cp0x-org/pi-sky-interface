import { FC, useEffect, useState } from 'react';
import Card from '@mui/material/Card';
import { useDelegateData } from '../../../../hooks/useDelegateData';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { IconExternalLink } from '@tabler/icons-react';
import { useConfigChainId } from '../../../../hooks/useConfigChainId';
import { ReactComponent as SkyLogo } from 'assets/images/sky/ethereum/sky.svg';
import { Alert, CircularProgress } from '@mui/material';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';
import { useStakingPositions } from '../../../../hooks/useStakingPositions';
import { useStabilityRate } from '../../../../hooks/useStabilityRate';
import { useStakingApr } from '../../../../hooks/useStakingApr';
import useStakingTvl from '../../../../hooks/useStakingTvl';
import { formatUSDS } from '../../../../utils/sky';
import { useSuppliersByUrns } from '../../../../hooks/useSuppliersByUrns';

export default function StakingSummary() {
  const { config: skyConfig } = useConfigChainId();
  const { address } = useAccount();
  const { positions, isLoading: positionsLoading, error: positionsError } = useStakingPositions();
  const { delegates, isLoading: delegatesLoading, error: delegatesError } = useDelegateData();
  const { apr, isLoading: isLoadingApr, error: errorApr } = useStakingApr();
  const { totalDelegators, isLoading: isDelegatorsLoading, error: delegatorError } = useSuppliersByUrns();

  const { tvl, totalSky } = useStakingTvl(skyConfig.contracts.USDSStakingRewards);

  const isLoading = positionsLoading || delegatesLoading;
  const error = positionsError || delegatesError;

  // Calculate total staked amount
  const totalStaked =
    positions?.reduce((sum, position) => {
      try {
        return sum + Number(formatEther(BigInt(position.wad)));
      } catch (error) {
        console.error('Error calculating total staked amount:', error);
        return sum;
      }
    }, 0) || 0;

  if (isLoading) {
    return (
      <Card
        sx={{
          borderRadius: '20px',
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <CardHeader title={'Summary'}></CardHeader>
        <CardContent
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            p: 3
          }}
        >
          <CircularProgress />
          <Typography variant="body2" sx={{ mt: 2 }}>
            Loading staking data...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card
        sx={{
          borderRadius: '20px',
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <CardHeader title={'Summary'}></CardHeader>
        <CardContent sx={{ p: 3 }}>
          <Alert severity="error">Error loading staking data: {error}</Alert>
        </CardContent>
      </Card>
    );
  }

  if (!address) {
    return (
      <Card
        sx={{
          borderRadius: '20px',
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <CardHeader title={'Summary'}></CardHeader>
        <CardContent sx={{ p: 3 }}>
          <Alert severity="info">Please connect your wallet to view staking positions</Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        borderRadius: '20px',
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <CardHeader title={'Summary'}></CardHeader>
      <CardContent
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: 3
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            gap: 4
          }}
        >
          <Box
            component="a"
            href={`https://etherscan.io/address/${skyConfig.contracts.LockStakeEngine}`}
            target="_blank"
            rel="noreferrer"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              textDecoration: 'none',
              color: 'inherit',
              width: '100%',
              justifyContent: 'flex-start'
            }}
          >
            View staking contract
            <IconExternalLink size={14} />
          </Box>

          {apr !== null && (
            <Box
              sx={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid',
                borderColor: 'divider',
                pb: 1
              }}
            >
              <Typography color="text.secondary" variant="body2">
                Current APR
              </Typography>
              <Typography variant="h6">~{apr.toFixed(2)}%</Typography>
            </Box>
          )}

          {totalDelegators !== null && (
            <Box
              sx={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid',
                borderColor: 'divider',
                pb: 1
              }}
            >
              <Typography color="text.secondary" variant="body2">
                Total Staking Positions
              </Typography>
              <Typography variant="h6">{totalDelegators}</Typography>
            </Box>
          )}

          {totalSky !== null && (
            <Box
              sx={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid',
                borderColor: 'divider',
                pb: 1
              }}
            >
              <Typography color="text.secondary" variant="body2">
                Total SKY Staked
              </Typography>
              <Typography variant="h6">{formatUSDS(totalSky)}</Typography>
            </Box>
          )}

          {tvl !== null && (
            <Box
              sx={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid',
                borderColor: 'divider',
                pb: 1
              }}
            >
              <Typography color="text.secondary" variant="body2">
                TVL
              </Typography>
              <Typography variant="h6">{formatUSDS(tvl)} USDS</Typography>
            </Box>
          )}

          <Box
            sx={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid',
              borderColor: 'divider',
              pb: 1
            }}
          >
            <Typography color="text.secondary" variant="body2">
              Your Total Staked Amount
            </Typography>
            <Typography variant="h6">{formatUSDS(totalStaked)} SKY</Typography>
          </Box>

          <Box
            sx={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid',
              borderColor: 'divider',
              pb: 1
            }}
          >
            <Typography color="text.secondary" variant="body2">
              Your Number of Positions
            </Typography>
            <Typography variant="h6">{positions?.length || 0}</Typography>
          </Box>

          {!positions || positions.length === 0 ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              No active staking positions found
            </Alert>
          ) : null}
        </Box>
      </CardContent>
    </Card>
  );
}
