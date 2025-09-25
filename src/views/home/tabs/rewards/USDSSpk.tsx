import { useState } from 'react';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Grid from '@mui/material/Grid';
import TabPanel from 'ui-component/TabPanel';
import Info from './components/Info';
import Stake from './components/Stake';
import Withdraw from './components/Withdraw';
import { useAccount, useReadContract } from 'wagmi';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { useNavigate } from 'react-router-dom';
import { formatEther } from 'viem';
import { formatUSDS } from 'utils/sky';
import { useConfigChainId } from 'hooks/useConfigChainId';
import CardHeader from '@mui/material/CardHeader';
import { Alert } from '@mui/material';
import { usdsSpkRewardContractConfig } from 'config/abi/UsdsSpkReward';

export default function USDSSpkTab() {
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

  const { data: userRewardBalance } = useReadContract({
    ...usdsSpkRewardContractConfig,
    address: skyConfig.contracts.UsdsSpkRewards,
    functionName: 'earned',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address
    }
  });

  const { data: userBalance } = useReadContract({
    ...usdsSpkRewardContractConfig,
    address: skyConfig.contracts.USDS,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address
    }
  });

  const { data: stakedBalance } = useReadContract({
    ...usdsSpkRewardContractConfig,
    address: skyConfig.contracts.UsdsSpkRewards,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address
    }
  });

  const { data: totalSupply } = useReadContract({
    ...usdsSpkRewardContractConfig,
    address: skyConfig.contracts.UsdsSpkRewards,
    functionName: 'totalSupply'
  });

  return (
    <Box sx={{ width: '100%' }}>
      <Button variant="outlined" onClick={handleBack} sx={{ mb: 2 }}>
        Back to Rewards
      </Button>
      <Typography variant="h2" gutterBottom>
        With: USDS Get: Spk
      </Typography>
      <Typography variant="h4" gutterBottom sx={{ mb: 2 }} color="text.secondary">
        Stake your USDS tokens to earn SPK rewards. This staking option allows you to participate in the Sky Protocol ecosystem and earn
        rewards proportional to your contribution.
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
              {userRewardBalance ? <Tab label="Withdraw/Claim" /> : <Tab label="Withdraw" />}
            </Tabs>

            <TabPanel value={operationType} index={0}>
              <Stake userBalance={userBalance} rewardAddress={skyConfig.contracts.UsdsSpkRewards} />
            </TabPanel>
            <TabPanel value={operationType} index={1}>
              <Withdraw
                stakedBalance={stakedBalance ? Number(formatEther(stakedBalance)).toFixed(4) : '0'}
                rewardBalance={userRewardBalance}
                rewardAddress={skyConfig.contracts.UsdsSpkRewards}
                tokenSymbol={'SPK'}
              />
            </TabPanel>
          </Box>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Box sx={{ width: '100%', display: 'flex' }}>
            <Info
              contractAddress={skyConfig.contracts.UsdsSpkRewards}
              balance={stakedBalance ? formatUSDS(formatEther(stakedBalance)) : '0'}
              tvl={totalSupply ? formatUSDS(formatEther(totalSupply)) + ' USDS' : '$0.00'}
            />
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
