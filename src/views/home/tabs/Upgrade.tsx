import { useState } from 'react';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import TabPanel from '../../../ui-component/TabPanel';
import Typography from '@mui/material/Typography';
import UpgradeAssets from './upgrade/UpgradeAssets';
import RevertAssets from './upgrade/RevertAssets';
import { useAccount, useReadContract } from 'wagmi';
import { usdsContractConfig } from '../../../config/abi/Usds';
import { useConfigChainId } from '../../../hooks/useConfigChainId';
import { daiContractConfig } from '../../../config/abi/Dai';
import { mkrContractConfig } from '../../../config/abi/Mkr';

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
          <UpgradeAssets daiUserBalance={daiUserBalance} mkrUserBalance={mkrUserBalance} />
        </TabPanel>
        <TabPanel value={operationType} index={1}>
          <RevertAssets usdsUserBalance={usdsUserBalance} />
        </TabPanel>
      </Box>
    </Box>
  );
}
