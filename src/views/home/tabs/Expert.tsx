import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Grid from '@mui/material/Grid';
import TabPanel from 'ui-component/TabPanel';
import Info from './expert/components/Info';
import Stake from './expert/components/Stake';
import Withdraw from './expert/components/Withdraw';
import { useAccount, useReadContract } from 'wagmi';
import { usdsContractConfig } from 'config/abi/Usds';
import Typography from '@mui/material/Typography';
import { useNavigate } from 'react-router-dom';
import { formatEther } from 'viem';
import { formatUSDS } from 'utils/sky';
import { useConfigChainId } from 'hooks/useConfigChainId';
import CardHeader from '@mui/material/CardHeader';
import { Alert } from '@mui/material';
import { stUsdsContractConfig } from 'config/abi/StUsds';

export default function ExpertTab() {
  const [operationType, setOperationType] = useState(0);
  const navigate = useNavigate();
  const account = useAccount();
  const address = account.address as `0x${string}` | undefined;
  const { config: skyConfig } = useConfigChainId();

  const handleOperationChange = (event: React.SyntheticEvent, newValue: number) => {
    setOperationType(newValue);
  };

  const { data: userUsdsBalance } = useReadContract({
    ...usdsContractConfig,
    address: skyConfig.contracts.USDS,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address
    }
  });

  const { data: userStUsdsBalance } = useReadContract({
    ...stUsdsContractConfig,
    address: skyConfig.contracts.STUSDS,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address
    }
  });

  const { data: userMaxWithdrawBalance } = useReadContract({
    ...stUsdsContractConfig,
    address: skyConfig.contracts.STUSDS,
    functionName: 'maxWithdraw',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address
    }
  });

  const { data: totalSupply } = useReadContract({
    ...stUsdsContractConfig,
    address: skyConfig.contracts.STUSDS,
    functionName: 'totalSupply'
  });

  const { data: capacity } = useReadContract({
    ...stUsdsContractConfig,
    address: skyConfig.contracts.STUSDS,
    functionName: 'cap'
  });

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h2" gutterBottom>
        stUSDS
      </Typography>
      <Typography variant="h4" gutterBottom sx={{ mb: 2 }} color="text.secondary">
        Access a variable reward rate on USDS by participating in SKY-backed borrowing
      </Typography>
      {!address && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Please connect your wallet to continue.
        </Alert>
      )}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <CardHeader title={'Use Staking'}></CardHeader>
          <Box sx={{ width: '100%', borderRadius: '20px' }}>
            <Tabs value={operationType} onChange={handleOperationChange}>
              <Tab label="Supply" />
              <Tab label="Withdraw" />
            </Tabs>
            <TabPanel value={operationType} index={0}>
              <Stake userBalance={userUsdsBalance} rewardAddress={skyConfig.contracts.STUSDS} />
            </TabPanel>
            <TabPanel value={operationType} index={1}>
              <Withdraw
                maxWithdrawBalance={userMaxWithdrawBalance ? Number(formatEther(userMaxWithdrawBalance)).toFixed(4) : '0'}
                maxWithdrawBalanceRaw={userMaxWithdrawBalance ? BigInt(userMaxWithdrawBalance) : 0n}
                rewardAddress={skyConfig.contracts.STUSDS}
              />
            </TabPanel>
          </Box>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Box sx={{ width: '100%', display: 'flex' }}>
            <Info
              contractAddress={skyConfig.contracts.STUSDS}
              usdsBalance={userUsdsBalance ? formatUSDS(formatEther(userUsdsBalance)) : '0'}
              stUsdsBalance={userStUsdsBalance ? formatUSDS(formatEther(userStUsdsBalance)) : '0'}
              tvl={totalSupply}
              cap={capacity}
            />
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
