import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import { useTotalUpgraded } from 'hooks/useTotalUpgraded';
import { formatTokenAmount } from 'utils/formatters';
import { useReadContract } from 'wagmi';
import { mkrSkyConverterConfig } from 'config/abi/MkrSkyConverter';
import { useConfigChainId } from 'hooks/useConfigChainId';
import CardHeader from '@mui/material/CardHeader';
import KeyValueRow from 'components/KeyValueRow';
import { useIntl } from 'react-intl';

export default function Info() {
  const intl = useIntl();
  const { mkrTotal, daiTotal } = useTotalUpgraded();

  const { config: skyConfig } = useConfigChainId();

  const { data: mkrToSkyRate, isLoading: isRateLoading } = useReadContract({
    ...mkrSkyConverterConfig,
    address: skyConfig.contracts.MKRSKYConverter,
    functionName: 'rate'
  });

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
          <KeyValueRow label={intl.formatMessage({ id: 'upgrade.info.mkrTotalUpgraded' })}>
            {formatTokenAmount(mkrTotal, 4) || 'MKR'}
          </KeyValueRow>
          <KeyValueRow label={intl.formatMessage({ id: 'upgrade.info.skyTotalUpgraded' })}>
            {!isRateLoading && mkrTotal !== undefined && mkrToSkyRate !== undefined
              ? formatTokenAmount((BigInt(mkrTotal) * BigInt(mkrToSkyRate)).toString(), 2)
              : 'SKY'}
          </KeyValueRow>
          <KeyValueRow label={intl.formatMessage({ id: 'upgrade.info.daiTotalUpgraded' })}>
            {formatTokenAmount(daiTotal, 2) || '0 DAI'}
          </KeyValueRow>
        </Box>
      </CardContent>
    </Card>
  );
}
