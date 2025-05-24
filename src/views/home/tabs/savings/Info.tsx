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

const Info: FC<InfoProps> = ({
  rate = 4.5,
  balance = '<0.0001 USDS',
  tvl = '3.2B USDS',
  contractAddress = '0xa3931d71877C0E7a3148CB7Eb4463524FEc27fbD'
}) => {
  return (
    <Card sx={{ borderRadius: '20px', my: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <UsdsLogo width="24" height="24" />
            {/*<Box component="img" src={UsdsLogo} sx={{ width: 24, height: 24 }} />*/}
            <Typography>Sky Savings Rate</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography color="success.main">Rate: {rate}%</Typography>
            <IconButton size="small">
              <IconInfoCircle size={16} />
            </IconButton>
          </Box>
        </Box>

        <Accordion sx={{ boxShadow: 'none', '&:before': { display: 'none' } }}>
          <AccordionSummary expandIcon={<IconChevronDown />}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <Box component="a"
                   href={`https://etherscan.io/address/${contractAddress}`}
                   target="_blank"
                   rel="noreferrer"
                sx={{ display: 'flex', alignItems: 'center', gap: 0.5, textDecoration: 'none', color: 'inherit' }}
              >
                View contract
                <IconExternalLink size={14} />
              </Box>
              <Typography variant="body2">Savings info</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
              <Box>
                <Typography color="text.secondary" variant="body2">Savings balance</Typography>
                <Typography>{balance}</Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography color="text.secondary" variant="body2">TVL</Typography>
                <Typography>{tvl}</Typography>
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default Info;
