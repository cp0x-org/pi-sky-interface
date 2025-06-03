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

interface InfoProps {
  rate?: number;
  balance?: string;
  tvl?: string;
  contractAddress?: string;
}

const Confirm: FC<InfoProps> = ({ rate = 0, balance = '...', tvl = '...', contractAddress = '' }) => {
  return (
    <Card sx={{ borderRadius: '20px', my: 2 }}>
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            width: '100%',
            alignItems: 'center',
            flexDirection: {
              xs: 'column',
              sm: 'row'
            },
            gap: 2
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
              width: { xs: '100%', sm: 'auto' },
              justifyContent: { xs: 'center', sm: 'flex-start' }
            }}
          >
            View contract
            <IconExternalLink size={14} />
          </Box>

          <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
            <Typography color="text.secondary" variant="body2">
              Your Savings balance
            </Typography>
            <Typography>{balance}</Typography>
          </Box>

          <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
            <Typography color="text.secondary" variant="body2">
              TVL
            </Typography>
            <Typography>{tvl}</Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default Confirm;
