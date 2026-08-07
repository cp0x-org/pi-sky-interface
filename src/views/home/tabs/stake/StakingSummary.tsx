import Card from '@mui/material/Card';
import { useDelegateData } from 'hooks/useDelegateData';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Box from '@mui/material/Box';
import { useConfigChainId } from 'hooks/useConfigChainId';
import { Alert, IconButton, Tooltip } from '@mui/material';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';
import { useStakingPositions } from 'hooks/useStakingPositions';
import { useSkyStakingApr } from 'hooks/useSkyStakingApr';
import useStakingTvl from 'hooks/useStakingTvl';
import { formatShortUSDS, formatSkyPrice, formatUSDS } from 'utils/sky';
import { useSuppliersByUrns } from 'hooks/useSuppliersByUrns';
import useSkyPrice from 'hooks/useSkyPrice';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ExternalLink from 'components/ExternalLink';
import KeyValueRow from 'components/KeyValueRow';
import LoadingIndicator from 'components/LoadingIndicator';
import { FormattedMessage, useIntl } from 'react-intl';

export default function StakingSummary() {
  const intl = useIntl();
  const { config: skyConfig } = useConfigChainId();
  const { address } = useAccount();
  const { positions, isLoading: positionsLoading, error: positionsError } = useStakingPositions();
  const { isLoading: delegatesLoading, error: delegatesError } = useDelegateData();
  const { apr } = useSkyStakingApr();
  const { skyPrice } = useSkyPrice();
  const { totalDelegators, totalPositions } = useSuppliersByUrns();

  const { tvl, totalSky } = useStakingTvl();

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
        <CardHeader
          title={intl.formatMessage({ id: 'common.summary' })}
          titleTypographyProps={{ variant: 'h5', component: 'h2' }}
        ></CardHeader>
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
          <LoadingIndicator label={intl.formatMessage({ id: 'stake.loadingStakingData' })} />
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
        <CardHeader
          title={intl.formatMessage({ id: 'common.summary' })}
          titleTypographyProps={{ variant: 'h5', component: 'h2' }}
        ></CardHeader>
        <CardContent sx={{ p: 3 }}>
          <Alert severity="error">
            <FormattedMessage id="stake.errorLoadingStakingData" values={{ error }} />
          </Alert>
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
        <CardHeader
          title={intl.formatMessage({ id: 'common.summary' })}
          titleTypographyProps={{ variant: 'h5', component: 'h2' }}
        ></CardHeader>
        <CardContent sx={{ p: 3 }}>
          <Alert severity="info">
            <FormattedMessage id="stake.connectWalletPositions" />
          </Alert>
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
      <CardHeader
        title={intl.formatMessage({ id: 'common.summary' })}
        titleTypographyProps={{ variant: 'h5', component: 'h2' }}
      ></CardHeader>
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
          <ExternalLink
            href={`https://etherscan.io/address/${skyConfig.contracts.LockStakeEngine}`}
            label={intl.formatMessage({ id: 'stake.viewStakingContract' })}
            sx={{ width: '100%' }}
          >
            {intl.formatMessage({ id: 'stake.viewStakingContract' })}
          </ExternalLink>

          {skyPrice !== null && (
            <KeyValueRow
              label={
                <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
                  <FormattedMessage id="stake.skyPrice" />
                  <Tooltip title={intl.formatMessage({ id: 'stake.skyPriceTooltip' })} arrow>
                    <IconButton size="small" aria-label={intl.formatMessage({ id: 'stake.aboutSkyPrice' })} sx={{ ml: 0.5, p: 0.25 }}>
                      <HelpOutlineIcon sx={{ fontSize: '1rem' }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              }
            >
              ~{formatSkyPrice(skyPrice)} USD
            </KeyValueRow>
          )}

          {apr !== null && <KeyValueRow label={intl.formatMessage({ id: 'stake.currentAprSky' })}>~{apr.toFixed(2)}%</KeyValueRow>}

          {/*{aprSpk !== null && (*/}
          {/*  <Box*/}
          {/*    sx={{*/}
          {/*      width: '100%',*/}
          {/*      display: 'flex',*/}
          {/*      justifyContent: 'space-between',*/}
          {/*      alignItems: 'center',*/}
          {/*      borderBottom: '1px solid',*/}
          {/*      borderColor: 'divider',*/}
          {/*      pb: 1*/}
          {/*    }}*/}
          {/*  >*/}
          {/*    <Typography color="text.secondary" variant="body2">*/}
          {/*      Current APR(SPK)*/}
          {/*    </Typography>*/}
          {/*    <Typography variant="h6">~{aprSpk.toFixed(2)}%</Typography>*/}
          {/*  </Box>*/}
          {/*)}*/}

          {totalDelegators !== null && (
            <KeyValueRow label={intl.formatMessage({ id: 'stake.totalUniqueSuppliers' })}>{totalDelegators}</KeyValueRow>
          )}

          {totalPositions !== null && (
            <KeyValueRow label={intl.formatMessage({ id: 'stake.totalStakingPositions' })}>{totalPositions}</KeyValueRow>
          )}

          {totalSky !== null && (
            <KeyValueRow label={intl.formatMessage({ id: 'stake.totalSkyStaked' })}>{formatShortUSDS(totalSky)}</KeyValueRow>
          )}

          {tvl !== null && <KeyValueRow label={intl.formatMessage({ id: 'common.tvl' })}>{formatShortUSDS(tvl)} USDS</KeyValueRow>}

          <KeyValueRow label={intl.formatMessage({ id: 'stake.yourTotalStaked' })}>{formatUSDS(totalStaked)} SKY</KeyValueRow>

          <KeyValueRow label={intl.formatMessage({ id: 'stake.yourNumberOfPositions' })}>{positions?.length || 0}</KeyValueRow>

          {!positions || positions.length === 0 ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              <FormattedMessage id="stake.noActivePositions" />
            </Alert>
          ) : null}
        </Box>
      </CardContent>
    </Card>
  );
}
