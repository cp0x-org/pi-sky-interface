import Box from '@mui/material/Box';
import { styled } from '@mui/material/styles';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { useNavigate } from 'react-router-dom';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import TabPanel from '../../../../ui-component/TabPanel';
import Info from './components/Info';
import Stake from './components/Stake';
import Withdraw from './components/Withdraw';
import { useAccount, useReadContract } from 'wagmi';
import { usdsContractConfig } from 'config/abi/Usds';
import { useState } from 'react';
import { skyConfig } from 'config/index';
import { stakingRewardContractConfig } from 'config/abi/StakingReward';

import { formatEther } from 'viem';
import { formatUSDS } from 'utils/sky';

export default function USDSSkyTab() {
  const navigate = useNavigate();
  const account = useAccount();
  const address = account.address as `0x${string}` | undefined;
  const [operationType, setOperationType] = useState(0);

  const USDSSkyCard = styled(Paper)(({ theme }) => ({
    ...theme.typography.body2,
    padding: theme.spacing(3),
    color: theme.palette.text.primary,
    ...theme.applyStyles('dark', {
      backgroundColor: theme.palette.secondary.light
    })
  }));

  const handleOperationChange = (event: React.SyntheticEvent, newValue: number) => {
    setOperationType(newValue);
  };

  const { data: userBalance } = useReadContract({
    ...usdsContractConfig,
    address: skyConfig.Mainnet.contracts.USDS,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address
    }
  });

  const { data: stakedBalance } = useReadContract({
    ...stakingRewardContractConfig,
    address: skyConfig.Mainnet.contracts.StakingRewards,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address
    }
  });

  const { data: totalSupply } = useReadContract({
    ...stakingRewardContractConfig,
    address: skyConfig.Mainnet.contracts.StakingRewards,
    functionName: 'totalSupply'
  });

  const handleBack = () => {
    navigate('/rewards');
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Button variant="outlined" onClick={handleBack} sx={{ mb: 2 }}>
        Back to Rewards
      </Button>
      <Typography variant="h2" gutterBottom>
        With: USDS Get: SKY
      </Typography>
      <Info
        contractAddress={skyConfig.Mainnet.contracts.StakingRewards}
        balance={stakedBalance ? Number(formatEther(stakedBalance)).toFixed(2) : '0'}
        tvl={totalSupply ? formatUSDS(formatEther(totalSupply)) : '$0.00'}
      />
      <USDSSkyCard>
        <Tabs value={operationType} onChange={handleOperationChange}>
          <Tab label="Supply" />
          <Tab label="Withdraw" />
        </Tabs>
        <TabPanel value={operationType} index={0}>
          <Stake userBalance={userBalance ? Number(formatEther(userBalance)).toFixed(4) : '0'} />
        </TabPanel>
        <TabPanel value={operationType} index={1}>
          <Withdraw stakedBalance={stakedBalance ? Number(formatEther(stakedBalance)).toFixed(4) : '0'} />
        </TabPanel>
      </USDSSkyCard>
    </Box>
  );
}
