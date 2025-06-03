import { useState } from 'react';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import TabPanel from '../../../ui-component/TabPanel';
import Typography from '@mui/material/Typography';
import UpgradeAssets from './upgrade/UpgradeAssets';
import RevertAssets from './upgrade/RevertAssets';

export default function UpgradeTab() {
  const [operationType, setOperationType] = useState(0);

  const handleOperationChange = (event: React.SyntheticEvent, newValue: number) => {
    setOperationType(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ width: '100%' }}>
        <Typography variant="h2" gutterBottom>
          Upgrade
        </Typography>
        {/*<Info*/}
        {/*  contractAddress={skyConfig.Mainnet.contracts.SavingsUSDS}*/}
        {/*  balance={savingBalance ? Number(formatEther(savingBalance)).toFixed(2) : '0'}*/}
        {/*  tvl={totalSupply ? formatUSDS(formatEther(totalSupply)) : '$0.00'}*/}
        {/*/>*/}
        <Tabs value={operationType} onChange={handleOperationChange}>
          <Tab label="Upgrade" />
          <Tab label="Revert" />
        </Tabs>

        <TabPanel value={operationType} index={0}>
          <UpgradeAssets />
        </TabPanel>
        <TabPanel value={operationType} index={1}>
          <RevertAssets />
        </TabPanel>
      </Box>
    </Box>
  );
}
