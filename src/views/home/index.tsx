// material-ui
// import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
// import TextField from '@mui/material/TextField';
// import Button from '@mui/material/Button';
import { useState } from 'react';
import { ReactComponent as RewardSvg } from 'assets/images/sky/rewardlogo.svg';
import { ReactComponent as SavingsSvg } from 'assets/images/sky/savings.svg';
import { ReactComponent as UpgradeSvg } from 'assets/images/sky/upgrade.svg';
import { ReactComponent as StakeSvg } from 'assets/images/sky/stake.svg';

// project imports
import MainCard from 'ui-component/cards/MainCard';
import TabPanel from 'ui-component/TabPanel';
import RewardTab from './tabs/Reward';
import SavingsTab from './tabs/Savings';
import UpgradeTab from './tabs/Upgrade';
import StakeTab from './tabs/Stake';

export default function HomePage() {
  const [mainTab, setMainTab] = useState(0);

  const handleMainTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setMainTab(newValue);
  };

  return (
    <MainCard>
      <Box sx={{ width: '100%' }}>
        <Tabs value={mainTab} onChange={handleMainTabChange} centered>
          <Tab label="Rewards" iconPosition="top" icon={<RewardSvg width="24" height="24" />} />
          <Tab label="Savings" iconPosition="top" icon={<SavingsSvg width="24" height="24" />} />
          <Tab label="Upgrade" iconPosition="top" icon={<UpgradeSvg width="24" height="24" />} />
          <Tab label="Stake" iconPosition="top" icon={<StakeSvg width="24" height="24" />} />
        </Tabs>
        <TabPanel value={mainTab} index={0}>
          <RewardTab />
        </TabPanel>
        <TabPanel value={mainTab} index={1}>
          <SavingsTab />
        </TabPanel>
        <TabPanel value={mainTab} index={2}>
          <UpgradeTab />
        </TabPanel>
        <TabPanel value={mainTab} index={3}>
          <StakeTab />
        </TabPanel>
      </Box>
    </MainCard>
  );
}
