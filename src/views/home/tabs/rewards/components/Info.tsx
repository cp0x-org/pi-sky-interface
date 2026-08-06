import { FC } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import CardHeader from '@mui/material/CardHeader';
import ExternalLink from 'components/ExternalLink';
import KeyValueRow from 'components/KeyValueRow';

interface InfoProps {
  rate?: number;
  balance?: string;
  tvl?: string;
  contractAddress?: string;
}

const Info: FC<InfoProps> = ({ balance = '0', tvl = '0', contractAddress = '' }) => {
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
      <CardHeader title={'Summary'} titleTypographyProps={{ variant: 'h5', component: 'h2' }}></CardHeader>
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
          <ExternalLink href={`https://etherscan.io/address/${contractAddress}`} label="View contract" sx={{ width: '100%' }}>
            View contract
          </ExternalLink>

          <KeyValueRow label="Your Staking balance">{balance} USDS</KeyValueRow>
          <KeyValueRow label="TVL">{tvl}</KeyValueRow>
        </Box>
      </CardContent>
    </Card>
  );
};

export default Info;
