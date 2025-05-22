import { useState } from 'react';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import TabPanel from '../../../ui-component/TabPanel';
import { usdsContractConfig } from './contracts/Usds';

import { useReadContract } from 'wagmi';
// const USDS = '0xdC035D45d973E3EC169d2276DDab16f1e407384F';

export default function SavingsTab() {
  const [operationType, setOperationType] = useState(0);

  const handleOperationChange = (event: React.SyntheticEvent, newValue: number) => {
    setOperationType(newValue);
  };

  const { data: balance } = useReadContract({
    ...usdsContractConfig,
    functionName: 'balanceOf',
    args: ['0xEb6ae6fA22D307Eae06BE0862087FdFFdD25Bab4'],
  });

  return (
    <Box sx={{ width: '100%' }}>
      <div>Balance: {balance?.toString()}</div>
      <Tabs value={operationType} onChange={handleOperationChange}>
        <Tab label="Supply" />
        <Tab label="Withdraw" />
      </Tabs>
      <TabPanel value={operationType} index={0}>
        <TextField fullWidth label="Amount to Supply" type="number" margin="normal" />
        <Button variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>
          Deposit
        </Button>
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
