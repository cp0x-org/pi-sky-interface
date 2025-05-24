import { useState } from 'react';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import TabPanel from '../../../ui-component/TabPanel';
import { usdsContractConfig } from './contracts/Usds';
import { formatEther } from 'viem';
import { useReadContract, useAccount } from 'wagmi';
import Info from './savings/Info';
import Supply from './savings/Supply';
// const USDS = '0xdC035D45d973E3EC169d2276DDab16f1e407384F';
// import companyLightLogo from 'assets/images/maintenance/img-ct-light-logo.png';
export default function SavingsTab() {
  const [operationType, setOperationType] = useState(0);
  const account = useAccount();
  const address = account.address as `0x${string}` | undefined;

  const handleOperationChange = (event: React.SyntheticEvent, newValue: number) => {
    setOperationType(newValue);
  };

  const { data: balance } = useReadContract({
    ...usdsContractConfig,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address
    }
  });

  return (
    <Box sx={{ width: '100%' }}>
      <div>Balance: {balance ? formatEther(balance).toString() : '0'}</div>
      <Tabs value={operationType} onChange={handleOperationChange}>
        <Tab label="Supply" />
        <Tab label="Withdraw" />
      </Tabs>
      <TabPanel value={operationType} index={0}>
        <Info />
        <Supply />
        {/*<TextField fullWidth label="Amount to Supply" type="number" margin="normal" />*/}
        {/*<Button variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>*/}
        {/*  Deposit*/}
        {/*</Button>*/}
      </TabPanel>
      <TabPanel value={operationType} index={1}>
        <TextField
          fullWidth
          label="Amount to Withdraw"
          type="number"
          margin="normal"
        />
        <Button variant="contained" color="secondary" fullWidth sx={{ mt: 2 }}>
          Withdraw
        </Button>
      </TabPanel>
    </Box>
  );
}
