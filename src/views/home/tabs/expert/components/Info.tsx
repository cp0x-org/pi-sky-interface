import { FC } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import CardHeader from '@mui/material/CardHeader';
import { formatUSDS } from 'utils/sky';
import { formatEther } from 'viem';
import ExternalLink from 'components/ExternalLink';
import KeyValueRow from 'components/KeyValueRow';
import { useIntl } from 'react-intl';

interface InfoProps {
  rate?: number;
  usdsBalance?: string;
  stUsdsBalance?: string;
  tvl?: bigint;
  cap?: bigint;
  contractAddress?: string;
}

const Info: FC<InfoProps> = ({ usdsBalance = '0', stUsdsBalance = '0', tvl = 0n, cap = 0n, contractAddress = '' }) => {
  const intl = useIntl();

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
            href={`https://etherscan.io/address/${contractAddress}`}
            label={intl.formatMessage({ id: 'common.viewContract' })}
            sx={{ width: '100%' }}
          >
            {intl.formatMessage({ id: 'common.viewContract' })}
          </ExternalLink>

          <KeyValueRow label={intl.formatMessage({ id: 'expert.info.yourBalanceUsds' })}>{usdsBalance}</KeyValueRow>
          <KeyValueRow label={intl.formatMessage({ id: 'expert.info.yourBalanceStUsds' })}>{stUsdsBalance}</KeyValueRow>
          <KeyValueRow label={intl.formatMessage({ id: 'expert.info.capacity' })}>{formatUSDS(formatEther(cap))}</KeyValueRow>
          <KeyValueRow label={intl.formatMessage({ id: 'expert.info.tvl' })}>{formatUSDS(formatEther(tvl))}</KeyValueRow>
          <KeyValueRow label={intl.formatMessage({ id: 'expert.info.remainingCapacity' })}>
            {formatUSDS(formatEther(cap - tvl))}
          </KeyValueRow>
        </Box>
      </CardContent>
    </Card>
  );
};

export default Info;
