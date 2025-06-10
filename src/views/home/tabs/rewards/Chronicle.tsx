import { useState } from 'react';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Grid from '@mui/material/Grid';
import TabPanel from '../../../../ui-component/TabPanel';
import Info from './components/Info';
import Stake from './components/Stake';
import Withdraw from './components/Withdraw';
import { useAccount, useReadContract } from 'wagmi';
import { usdsContractConfig } from 'config/abi/Usds';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { useNavigate } from 'react-router-dom';
import { stakingRewardContractConfig } from '../../../../config/abi/StakingReward';
import { formatEther } from 'viem';
import { formatUSDS } from 'utils/sky';
import { useConfigChainId } from '../../../../hooks/useConfigChainId';
import CardHeader from '@mui/material/CardHeader';

export default function ChronicleTab() {
  const [operationType, setOperationType] = useState(0);
  const navigate = useNavigate();
  const account = useAccount();
  const address = account.address as `0x${string}` | undefined;
  const { config: skyConfig } = useConfigChainId();

  const handleOperationChange = (event: React.SyntheticEvent, newValue: number) => {
    setOperationType(newValue);
  };

  const handleBack = () => {
    navigate('/rewards');
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

  const { data: stakedBalance } = useReadContract({
    ...stakingRewardContractConfig,
    address: skyConfig.contracts.ChroniclePoints,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address
    }
  });

  const { data: totalSupply } = useReadContract({
    ...stakingRewardContractConfig,
    address: skyConfig.contracts.ChroniclePoints,
    functionName: 'totalSupply'
  });

  const { data: userRewardBalance } = useReadContract({
    ...stakingRewardContractConfig,
    address: skyConfig.contracts.ChroniclePoints,
    functionName: 'earned',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address
    }
  });

  return (
    <Box sx={{ width: '100%' }}>
      <Button variant="outlined" onClick={handleBack} sx={{ mb: 2 }}>
        Back to Rewards
      </Button>
      <Typography variant="h2" gutterBottom>
        Chronicle Points
      </Typography>
      <Typography variant="h4" gutterBottom sx={{ mb: 2 }} color="text.secondary">
        Chronicle Points allow you to earn rewards by staking your USDS tokens in the Sky Protocol ecosystem. The system tracks your
        contributions and rewards you accordingly.
      </Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <CardHeader title={'Use Chronicle Points'}></CardHeader>
          <Box sx={{ width: '100%', borderRadius: '20px' }}>
            <Tabs value={operationType} onChange={handleOperationChange}>
              <Tab label="Supply" />
              {userRewardBalance ? <Tab label="Withdraw/Claim" /> : <Tab label="Withdraw" />}
            </Tabs>

            <TabPanel value={operationType} index={0}>
              <Stake userBalance={userBalance} rewardAddress={skyConfig.contracts.ChroniclePoints} />
            </TabPanel>
            <TabPanel value={operationType} index={1}>
              <Withdraw stakedBalance={stakedBalance ? formatUSDS(formatEther(stakedBalance)) : '0'} rewardBalance={userRewardBalance} />
            </TabPanel>
          </Box>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Box sx={{ width: '100%', display: 'flex' }}>
            <Info
              contractAddress={skyConfig.contracts.ChroniclePoints}
              balance={stakedBalance ? formatUSDS(formatEther(stakedBalance)) : '0'}
              tvl={totalSupply ? formatUSDS(formatEther(totalSupply)) + ' USDS' : '$0.00'}
            />
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
