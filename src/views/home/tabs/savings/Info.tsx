import { FC } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import { IconInfoCircle, IconChevronDown, IconExternalLink } from '@tabler/icons-react';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import { ReactComponent as UsdsLogo } from 'assets/images/sky/usds.svg';
import CardHeader from '@mui/material/CardHeader';

interface InfoProps {
  rate?: number;
  balance?: string;
  tvl?: string;
  contractAddress?: string;
}

const Info: FC<InfoProps> = ({ rate = 0, balance = '0', tvl = '0', contractAddress = '' }) => {
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
            href={`https://etherscan.io/address/${contractAddress}`}
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
            View contract
            <IconExternalLink size={14} />
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
              Your Savings balance
            </Typography>
            <Typography variant="h6">{balance} USDS</Typography>
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
              TVL
            </Typography>
            <Typography variant="h6">{tvl}</Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default Info;
