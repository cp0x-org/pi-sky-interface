import { useState } from 'react';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import TabPanel from '../../../ui-component/TabPanel';
import { usdsContractConfig } from 'config/abi/Usds';
import { savingsUsdsContractConfig } from 'config/abi/SavingsUsds';
import { formatEther } from 'viem';
import { useReadContract, useAccount } from 'wagmi';
import Info from './savings/Info';
import Deposit from './savings/Deposit';
import Withdraw from './savings/Withdraw';
import Typography from '@mui/material/Typography';
import { formatUSDS } from 'utils/sky';
import { useConfigChainId } from '../../../hooks/useConfigChainId';

export default function SavingsTab() {
  const [operationType, setOperationType] = useState(0);
  const account = useAccount();
  const address = account.address as `0x${string}` | undefined;
  // const chainId = useChainId();
  const { config: skyConfig } = useConfigChainId();

  const handleOperationChange = (event: React.SyntheticEvent, newValue: number) => {
    setOperationType(newValue);
  };

  const { data: userBalance } = useReadContract({
    ...usdsContractConfig,
    address: skyConfig.contracts.USDS,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address
    }
  });

  const { data: savingBalance } = useReadContract({
    ...savingsUsdsContractConfig,
    address: skyConfig.contracts.SavingsUSDS,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address
    }
  });

  const { data: totalSupply } = useReadContract({
    ...savingsUsdsContractConfig,
    address: skyConfig.contracts.SavingsUSDS,
    functionName: 'totalSupply'
  });

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h2" gutterBottom>
        Sky Savings Rate
      </Typography>
      <Info
        contractAddress={skyConfig.contracts.SavingsUSDS}
        balance={savingBalance ? Number(formatEther(savingBalance)).toFixed(2) : '0'}
        tvl={totalSupply ? formatUSDS(formatEther(totalSupply)) : '$0.00'}
      />
      <Tabs value={operationType} onChange={handleOperationChange}>
        <Tab label="Supply" />
        <Tab label="Withdraw" />
      </Tabs>

      <TabPanel value={operationType} index={0}>
        <Deposit userBalance={userBalance ? Number(formatEther(userBalance)).toFixed(4) : '0'} />
      </TabPanel>
      <TabPanel value={operationType} index={1}>
        <Withdraw savingsBalance={savingBalance ? Number(formatEther(savingBalance)).toFixed(4) : '0'} />
      </TabPanel>
    </Box>
  );
}
