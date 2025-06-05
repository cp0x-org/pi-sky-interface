import { useState } from 'react';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Grid from '@mui/material/Grid';
import TabPanel from '../../../ui-component/TabPanel';
import Typography from '@mui/material/Typography';
import UpgradeAssets from './upgrade/UpgradeAssets';
import RevertAssets from './upgrade/RevertAssets';
import { useAccount, useReadContract } from 'wagmi';
import { usdsContractConfig } from '../../../config/abi/Usds';
import { useConfigChainId } from '../../../hooks/useConfigChainId';
import { daiContractConfig } from '../../../config/abi/Dai';
import { mkrContractConfig } from '../../../config/abi/Mkr';
import Info from './upgrade/Info';
import CardHeader from '@mui/material/CardHeader';

export default function UpgradeTab() {
  const [operationType, setOperationType] = useState(0);
  const account = useAccount();
  const address = account.address as `0x${string}` | undefined;
  const { config: skyConfig } = useConfigChainId();

  const handleOperationChange = (event: React.SyntheticEvent, newValue: number) => {
    setOperationType(newValue);
  };

  const { data: daiUserBalance } = useReadContract({
    ...daiContractConfig,
    address: skyConfig.contracts.DAI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address
    }
  });

  const { data: mkrUserBalance } = useReadContract({
    ...mkrContractConfig,
    address: skyConfig.contracts.MKR,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address
    }
  });

  const { data: usdsUserBalance } = useReadContract({
    ...usdsContractConfig,
    address: skyConfig.contracts.USDS,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address
    }
  });

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h2" gutterBottom>
        Upgrade
      </Typography>
      <Typography variant="h4" gutterBottom sx={{ mb: 2 }} color="text.secondary">
        Easily upgrade MKR to SKY, or swap DAI in both directions with USDS.
      </Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <CardHeader title={'Use Upgrade'}></CardHeader>
          <Box sx={{ width: '100%', borderRadius: '20px' }}>
            <Tabs value={operationType} onChange={handleOperationChange}>
              <Tab label="Upgrade" />
              <Tab label="Revert" />
            </Tabs>

            <TabPanel value={operationType} index={0}>
              <UpgradeAssets daiUserBalance={daiUserBalance} mkrUserBalance={mkrUserBalance} />
            </TabPanel>
            <TabPanel value={operationType} index={1}>
              <RevertAssets usdsUserBalance={usdsUserBalance} />
            </TabPanel>
          </Box>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Box sx={{ width: '100%', display: 'flex' }}>
            <Info />
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
