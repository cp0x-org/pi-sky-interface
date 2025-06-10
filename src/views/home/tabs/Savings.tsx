import { useState } from 'react';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Grid from '@mui/material/Grid';
import TabPanel from 'ui-component/TabPanel';
import { usdsContractConfig } from 'config/abi/Usds';
import { savingsUsdsContractConfig } from 'config/abi/SavingsUsds';
import { formatEther } from 'viem';
import { useReadContract, useAccount } from 'wagmi';
import Info from './savings/Info';
import Deposit from './savings/Deposit';
import Withdraw from './savings/Withdraw';
import Typography from '@mui/material/Typography';
import { formatUSDS } from 'utils/sky';
import { useConfigChainId } from 'hooks/useConfigChainId';
import CardHeader from '@mui/material/CardHeader';

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
      <Typography variant="h4" gutterBottom sx={{ mb: 2 }} color="text.secondary">
        The Sky Savings Rate is an automated token-accumulation mechanism for eligible users of the Sky Protocol. It takes into account the
        effect of accumulated USDS compounded in real time.
      </Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <CardHeader title={'Use Savings'}></CardHeader>
          <Box sx={{ width: '100%', borderRadius: '20px' }}>
            <Tabs value={operationType} onChange={handleOperationChange}>
              <Tab label="Supply" />
              <Tab label="Withdraw" />
            </Tabs>

            <TabPanel value={operationType} index={0}>
              <Deposit userBalance={userBalance ? formatUSDS(formatEther(userBalance)) : '0'} />
            </TabPanel>
            <TabPanel value={operationType} index={1}>
              <Withdraw savingsBalance={savingBalance ? formatUSDS(formatEther(savingBalance)) : '0'} />
            </TabPanel>
          </Box>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Box sx={{ width: '100%', display: 'flex' }}>
            <Info
              contractAddress={skyConfig.contracts.SavingsUSDS}
              balance={savingBalance ? formatUSDS(formatEther(savingBalance)) : '0'}
              tvl={totalSupply ? formatUSDS(formatEther(totalSupply)) + ' USDS' : '$0.00'}
            />
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
