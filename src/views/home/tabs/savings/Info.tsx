import { FC } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import CardHeader from '@mui/material/CardHeader';
import ExternalLink from 'components/ExternalLink';
import KeyValueRow from 'components/KeyValueRow';
import { useIntl } from 'react-intl';

interface InfoProps {
  rate?: number;
  balance?: string;
  tvl?: string;
  contractAddress?: string;
}

const Info: FC<InfoProps> = ({ balance = '0', tvl = '0', contractAddress = '' }) => {
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

          <KeyValueRow label={intl.formatMessage({ id: 'savings.info.savingsBalance' })}>{balance} USDS</KeyValueRow>
          <KeyValueRow label={intl.formatMessage({ id: 'common.tvl' })}>{tvl}</KeyValueRow>
        </Box>
      </CardContent>
    </Card>
  );
};

export default Info;
