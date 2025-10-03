import { FC, useEffect, useState } from 'react';
import Card from '@mui/material/Card';
import { apiConfig } from 'config/index';
import { useDelegateData } from 'hooks/useDelegateData';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { IconExternalLink } from '@tabler/icons-react';
import { useConfigChainId } from 'hooks/useConfigChainId';
import { ReactComponent as SkyLogo } from 'assets/images/sky/ethereum/sky.svg';
import { Chip, Divider, Alert, CircularProgress, Paper, Button, Tooltip } from '@mui/material';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { encodeFunctionData, formatEther } from 'viem';
import { lockStakeContractConfig } from 'config/abi/LockStackeEngine';
import { useStakingPositions } from 'hooks/useStakingPositions';
import { ethers } from 'ethers';
import { useStakingApr } from 'hooks/useStakingApr';
import useStakingTvl from 'hooks/useStakingTvl';
import { formatShortUSDS, formatSkyPrice, formatUSDS } from 'utils/sky';
import { useSuppliersByUrns } from 'hooks/useSuppliersByUrns';
import { styled } from '@mui/material/styles';
import { StakingPosition } from 'types/staking';
import useSkyPrice from 'hooks/useSkyPrice';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { dispatchError, dispatchSuccess } from 'utils/snackbar';
import { useDelegateStake } from 'hooks/useDelegateStake';
import { VoteDelegate } from 'config/abi/VoteDelegate';
import { usdsContractConfig } from 'config/abi/Usds';
import { useSpkStakingApr } from 'hooks/useSpkStakingApr';

interface PositionsProps {
  stakeData?: {
    amount: string;
    rewardAddress: string;
    delegatorAddress: string;
  };
  onEditPosition?: (position: StakingPosition) => void;
}
const getRewardSymbol = (
  skyConfig:
    | {
        readonly contracts: {
          readonly USDS: '0xdC035D45d973E3EC169d2276DDab16f1e407384F';
          readonly SKY: '0x56072C95FAA701256059aa122697B133aDEd9279';
          readonly MKR: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2';
          readonly DAI: '0x6b175474e89094c44da98b954eedeac495271d0f';
          readonly USDSStakingRewards: '0x38E4254bD82ED5Ee97CD1C4278FAae748d998865';
          readonly SPKStakingRewards: '0x99cbc0e4e6427f6939536ed24d1275b95ff77404';
          readonly SavingsUSDS: '0xa3931d71877C0E7a3148CB7Eb4463524FEc27fbD';
          readonly StakingRewards: '0x0650CAF159C5A49f711e8169D4336ECB9b950275';
          readonly ChroniclePoints: '0x10ab606B067C9C461d8893c47C7512472E19e2Ce';
          readonly UsdsSpkRewards: '0x173e314C7635B45322cd8Cb14f44b312e079F3af';
          readonly DAIUSDSConverter: '0x3225737a9Bbb6473CB4a45b7244ACa2BeFdB276A';
          readonly MKRSKYConverter: '0xA1Ea1bA18E88C381C724a75F23a130420C403f9a';
          readonly LockStakeEngine: '0xCe01C90dE7FD1bcFa39e237FE6D8D9F569e8A6a3';
          readonly VoteDelegateFactory: '0x4cf3daefa2683cd18df00f7aff5169c00a9eccd5';
        };
        readonly features: {};
        readonly icons: {
          readonly dai: '/assets/images/sky/ethereum/dai.svg';
          readonly usds: '/assets/images/sky/ethereum/usds.svg';
          readonly mkr: '/assets/images/sky/ethereum/mkr.svg';
          readonly sky: '/assets/images/sky/ethereum/sky.svg';
        };
      }
    | {
        readonly contracts: {
          readonly USDS: '0xdC035D45d973E3EC169d2276DDab16f1e407384F';
          readonly SKY: '0x56072C95FAA701256059aa122697B133aDEd9279';
          readonly MKR: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2';
          readonly DAI: '0x6b175474e89094c44da98b954eedeac495271d0f';
          readonly SavingsUSDS: '0xa3931d71877C0E7a3148CB7Eb4463524FEc27fbD';
          readonly StakingRewards: '0x0650CAF159C5A49f711e8169D4336ECB9b950275';
          readonly ChroniclePoints: '0x10ab606B067C9C461d8893c47C7512472E19e2Ce';
          readonly UsdsSpkRewards: '0x173e314C7635B45322cd8Cb14f44b312e079F3af';
          readonly DAIUSDSConverter: '0x3225737a9Bbb6473CB4a45b7244ACa2BeFdB276A';
          readonly MKRSKYConverter: '0xA1Ea1bA18E88C381C724a75F23a130420C403f9a';
          readonly LockStakeEngine: '0xCe01C90dE7FD1bcFa39e237FE6D8D9F569e8A6a3';
          readonly USDSStakingRewards: '0x38E4254bD82ED5Ee97CD1C4278FAae748d998865';
          readonly SPKStakingRewards: '0x99cbc0e4e6427f6939536ed24d1275b95ff77404';
          readonly VoteDelegateFactory: '0x4cf3daefa2683cd18df00f7aff5169c00a9eccd5';
        };
        readonly features: {};
        readonly icons: {
          readonly dai: '/assets/images/sky/arbitrum/dai.svg';
          readonly usds: '/assets/images/sky/arbitrum/usds.svg';
          readonly mkr: '/assets/images/sky/arbitrum/mkr.svg';
          readonly sky: '/assets/images/sky/arbitrum/sky.svg';
        };
      }
    | {
        readonly contracts: {
          readonly USDS: '0xdC035D45d973E3EC169d2276DDab16f1e407384F';
          readonly SKY: '0x56072C95FAA701256059aa122697B133aDEd9279';
          readonly MKR: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2';
          readonly DAI: '0x6b175474e89094c44da98b954eedeac495271d0f';
          readonly SavingsUSDS: '0xa3931d71877C0E7a3148CB7Eb4463524FEc27fbD';
          readonly StakingRewards: '0x0650CAF159C5A49f711e8169D4336ECB9b950275';
          readonly ChroniclePoints: '0x10ab606B067C9C461d8893c47C7512472E19e2Ce';
          readonly UsdsSpkRewards: '0x173e314C7635B45322cd8Cb14f44b312e079F3af';
          readonly DAIUSDSConverter: '0x3225737a9Bbb6473CB4a45b7244ACa2BeFdB276A';
          readonly MKRSKYConverter: '0xA1Ea1bA18E88C381C724a75F23a130420C403f9a';
          readonly LockStakeEngine: '0xCe01C90dE7FD1bcFa39e237FE6D8D9F569e8A6a3';
          readonly USDSStakingRewards: '0x38E4254bD82ED5Ee97CD1C4278FAae748d998865';
          readonly SPKStakingRewards: '0x99cbc0e4e6427f6939536ed24d1275b95ff77404';
          readonly VoteDelegateFactory: '0x4cf3daefa2683cd18df00f7aff5169c00a9eccd5';
        };
        readonly features: {};
        readonly icons: {
          readonly dai: '/assets/images/sky/base/dai.svg';
          readonly usds: '/assets/images/sky/base/usds.svg';
          readonly mkr: '/assets/images/sky/base/mkr.svg';
          readonly sky: '/assets/images/sky/base/sky.svg';
        };
      }
    | {
        readonly contracts: {
          readonly USDS: '0xdC035D45d973E3EC169d2276DDab16f1e407384F';
          readonly SKY: '0x56072C95FAA701256059aa122697B133aDEd9279';
          readonly MKR: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2';
          readonly DAI: '0x6b175474e89094c44da98b954eedeac495271d0f';
          readonly SavingsUSDS: '0xa3931d71877C0E7a3148CB7Eb4463524FEc27fbD';
          readonly StakingRewards: '0x0650CAF159C5A49f711e8169D4336ECB9b950275';
          readonly ChroniclePoints: '0x10ab606B067C9C461d8893c47C7512472E19e2Ce';
          readonly UsdsSpkRewards: '0x173e314C7635B45322cd8Cb14f44b312e079F3af';
          readonly DAIUSDSConverter: '0x3225737a9Bbb6473CB4a45b7244ACa2BeFdB276A';
          readonly MKRSKYConverter: '0xA1Ea1bA18E88C381C724a75F23a130420C403f9a';
          readonly LockStakeEngine: '0xCe01C90dE7FD1bcFa39e237FE6D8D9F569e8A6a3';
          readonly USDSStakingRewards: '0x38E4254bD82ED5Ee97CD1C4278FAae748d998865';
          readonly SPKStakingRewards: '0x99cbc0e4e6427f6939536ed24d1275b95ff77404';
          readonly VoteDelegateFactory: '0x4cf3daefa2683cd18df00f7aff5169c00a9eccd5';
        };
        readonly features: {};
        readonly icons: {
          readonly dai: '/assets/images/sky/ethereum/dai.svg';
          readonly usds: '/assets/images/sky/ethereum/usds.svg';
          readonly mkr: '/assets/images/sky/ethereum/mkr.svg';
          readonly sky: '/assets/images/sky/ethereum/sky.svg';
        };
      },
  position: any
) => {
  console.log('position.reward?.id?.toLowerCase()');
  console.log(position.reward?.id?.toLowerCase());
  if (position.reward?.id?.toLowerCase() === skyConfig.contracts.USDSStakingRewards.toLowerCase()) {
    return 'USDS';
  }

  if (position.reward?.id?.toLowerCase() === skyConfig.contracts.SPKStakingRewards.toLowerCase()) {
    return 'SPK';
  }

  return ''; // fallback, если не совпало
};

const PositionCard = styled(Card)(({ theme }) => ({
  ...theme.typography.body2,
  borderRadius: 2,
  height: '100%',
  padding: theme.spacing(1),
  color: theme.palette.text.primary,
  cursor: 'pointer',
  transition: 'transform 0.2s, box-shadow 0.2s',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[4]
  }
}));

const Positions: FC<PositionsProps> = ({ onEditPosition }) => {
  const { config: skyConfig } = useConfigChainId();
  const { address } = useAccount();
  const { positions, isLoading: positionsLoading, error: positionsError } = useStakingPositions();
  const { delegates, isLoading: delegatesLoading, error: delegatesError } = useDelegateData();
  const { apr } = useStakingApr();
  const { apr: aprSpk } = useSpkStakingApr();
  const { totalDelegators, totalPositions } = useSuppliersByUrns();
  const { skyPrice } = useSkyPrice();

  const { stakeAmount: delegateStakeAmount, isDelegate, delegateAddress } = useDelegateStake();

  const { tvl, totalSky } = useStakingTvl();

  const isLoading = positionsLoading || delegatesLoading;
  const error = positionsError || delegatesError;

  // State for tracking operations
  const [withdrawing, setWithdrawing] = useState<Record<string, boolean>>({});
  const [claiming, setClaiming] = useState<Record<string, boolean>>({});
  const [operationType, setOperationType] = useState<'withdraw' | 'claim' | null>(null);

  // Contract interaction
  const { writeContract, isPending, isSuccess, isError, error: contractError, data: txHash } = useWriteContract();
  const {
    isSuccess: isTxConfirmed,
    isError: isTxConfirmError,
    error: txConfirmError
  } = useWaitForTransactionReceipt({
    hash: txHash,
    query: { enabled: !!txHash }
  });

  // Get user balance
  const { data: userBalance } = useReadContract({
    ...usdsContractConfig,
    address: skyConfig.contracts.SKY,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address
    }
  });

  // Effect to handle transaction submission
  useEffect(() => {
    if (isSuccess && txHash) {
      console.log('Transaction submitted, waiting for confirmation...', txHash);
    }
  }, [isSuccess, txHash]);

  // Effect to handle operation success after confirmation
  useEffect(() => {
    if (isTxConfirmed && operationType) {
      console.log('Transaction confirmed for operation:', operationType);

      const message = operationType === 'claim' ? 'Reward claim successful!' : 'Withdraw successful!';
      dispatchSuccess(message);

      // Reset operation states
      if (operationType === 'claim') {
        setClaiming({});
      } else if (operationType === 'withdraw') {
        setWithdrawing({});
      }

      // Reset operation type
      setOperationType(null);
    }
  }, [isTxConfirmed, operationType]);

  // Effect to handle operation failure
  useEffect(() => {
    if (((isError && contractError) || (isTxConfirmError && txConfirmError)) && operationType) {
      const operationName = operationType === 'claim' ? 'Claim' : 'Withdraw';
      const errorMsg = contractError?.message || txConfirmError?.message || 'Unknown error';
      dispatchError(`${operationName} error: ${errorMsg}`);

      // Reset operation states
      if (operationType === 'claim') {
        setClaiming({});
      } else if (operationType === 'withdraw') {
        setWithdrawing({});
      }

      // Reset operation type
      setOperationType(null);
    }
  }, [isError, contractError, isTxConfirmError, txConfirmError, operationType]);

  // Format delegated address for display
  const shortenAddress = (address: string): string => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const handleWithdraw = (position: StakingPosition) => {
    if (!address || !position.indexPosition || !position.wad) {
      console.error('Missing required data for withdrawal');
      dispatchError('Missing required data for withdrawal');
      return;
    }

    try {
      // Set operation type
      setOperationType('withdraw');

      // Mark this position as withdrawing
      setWithdrawing((prev) => ({ ...prev, [position.indexPosition]: true }));

      // Create the function call data for the free operation
      const callData = encodeFunctionData({
        abi: lockStakeContractConfig.abi,
        functionName: 'free',
        args: [address, BigInt(position.indexPosition), address, BigInt(position.wad)]
      });

      // Execute the contract call
      writeContract({
        address: skyConfig.contracts.LockStakeEngine,
        abi: lockStakeContractConfig.abi,
        functionName: 'multicall',
        args: [[callData] as readonly `0x${string}`[]]
      });

      console.log('Withdraw initiated for position', position.indexPosition);
    } catch (error) {
      console.error('Error preparing withdraw transaction:', error);
      setWithdrawing((prev) => ({ ...prev, [position.indexPosition]: false }));
      dispatchError(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setOperationType(null);
    }
  };

  const handleSelfWithdraw = (amount: string) => {
    if (!address || !amount) {
      console.error('Missing required data for withdrawal');
      dispatchError('Missing required data for withdrawal');
      return;
    }

    try {
      // Set operation type
      setOperationType('withdraw');

      // Mark this position as withdrawing
      setWithdrawing((prev) => ({ ...prev, ['delegate']: true }));

      const biginAmount = BigInt(amount);
      // Execute the contract call
      writeContract({
        address: delegateAddress as `0x${string}`,
        abi: VoteDelegate.abi,
        functionName: 'free',
        args: [biginAmount]
      });

      console.log('Withdraw initiated for delegate position');
    } catch (error) {
      console.error('Error preparing withdraw transaction:', error);
      setWithdrawing((prev) => ({ ...prev, ['delegate']: false }));
      dispatchError(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setOperationType(null);
    }
  };

  const handleClaim = (position: StakingPosition) => {
    if (!address || !position.indexPosition) {
      console.error('Missing required data for claiming rewards');
      dispatchError('Missing required data for claiming rewards');
      return;
    }

    try {
      // Set operation type
      setOperationType('claim');

      console.log('OPERATION TYPE!!!');
      console.log(operationType);

      // Mark this position as claiming
      setClaiming((prev) => ({ ...prev, [position.indexPosition]: true }));

      // Execute the contract call for claiming rewards
      writeContract({
        address: skyConfig.contracts.LockStakeEngine,
        abi: lockStakeContractConfig.abi,
        functionName: 'getReward',
        args: [address, BigInt(position.indexPosition), skyConfig.contracts.USDSStakingRewards, address]
      });

      console.log('Claim initiated for position', position.indexPosition);
    } catch (error) {
      console.error('Error preparing claim transaction:', error);
      setClaiming((prev) => ({ ...prev, [position.indexPosition]: false }));
      dispatchError(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setOperationType(null);
    }
  };

  // Using dispatchSuccess/dispatchError instead of snackbar

  if (isLoading) {
    return (
      <Box sx={{ width: '100%', my: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ mt: 2 }}>
          Loading staking and delegate data...
        </Typography>
      </Box>
    );
  }

  // Calculate total staked amount
  const totalStaked = positions.reduce((sum, position) => {
    try {
      return sum + Number(formatEther(BigInt(position.wad)));
    } catch (error) {
      console.error('Error calculating total staked amount:', error);
      return sum;
    }
  }, 0);

  return (
    <Box sx={{ width: '100%', mt: 4 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 2, bgcolor: 'background.paper' }}>
        <Typography variant="h6" gutterBottom>
          Staking Summary
        </Typography>
        <Divider sx={{ mb: 2 }} />

        {skyPrice !== null && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body1">Sky Price</Typography>
              <Tooltip title="The current market price of SKY token based on Uniswap V2 pool data" arrow>
                <HelpOutlineIcon sx={{ ml: 0.5, fontSize: '1rem', cursor: 'help' }} />
              </Tooltip>
              <Typography variant="body1">:</Typography>
            </Box>

            <Typography variant="h6" color="primary">
              ~{formatSkyPrice(skyPrice)} USD
            </Typography>
          </Box>
        )}

        {apr !== null && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
            <Typography variant="body1">Current APR (USDS):</Typography>
            <Typography variant="h6" color="primary">
              ~{apr.toFixed(2)}%
            </Typography>
          </Box>
        )}

        {/*{aprSpk !== null && (*/}
        {/*  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>*/}
        {/*    <Typography variant="body1">Current APR (SPK):</Typography>*/}
        {/*    <Typography variant="h6" color="primary">*/}
        {/*      ~{aprSpk.toFixed(2)}%*/}
        {/*    </Typography>*/}
        {/*  </Box>*/}
        {/*)}*/}

        {totalDelegators !== null && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
            <Typography variant="body1">Total Unique Suppliers:</Typography>
            <Typography variant="h6" color="primary">
              {totalDelegators}
            </Typography>
          </Box>
        )}

        {totalDelegators !== null && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
            <Typography variant="body1">Total Staking Positions:</Typography>
            <Typography variant="h6" color="primary">
              {totalPositions}
            </Typography>
          </Box>
        )}

        {totalSky !== null && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
            <Typography variant="body1">Total SKY Staked:</Typography>
            <Typography variant="h6" color="primary">
              {formatShortUSDS(totalSky)}
            </Typography>
          </Box>
        )}

        {tvl !== null && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
            <Typography variant="body1">TVL:</Typography>
            <Typography variant="h6" color="primary">
              {formatShortUSDS(tvl)} USDS
            </Typography>
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
          <Typography variant="body1">Your Total Staked Amount:</Typography>
          <Typography variant="h6" color="primary">
            {formatUSDS(totalStaked)} SKY
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
          <Typography variant="body1">Your Number of Positions:</Typography>
          <Typography variant="h6" color="primary">
            {positions.length}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
          <Typography variant="body1">Your SKY Balance:</Typography>
          <Typography variant="h6" color="primary">
            {userBalance ? formatUSDS(formatEther(userBalance)) : '0'}
          </Typography>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Error loading staking position data: {String(error)}
        </Alert>
      )}

      {!address && (
        <Typography variant="h6" sx={{ mt: 2 }}>
          Please connect your wallet to view staking positions
        </Typography>
      )}

      {isLoading && (
        <Box sx={{ width: '100%', my: 4, textAlign: 'center' }}>
          <CircularProgress />
          <Typography variant="body2" sx={{ mt: 2 }}>
            Loading staking positions...
          </Typography>
        </Box>
      )}

      {!isLoading && address && !error && (positions.length > 0 || isDelegate) && (
        <>
          {isDelegate && (
            <Box>
              <Typography variant="h5" gutterBottom>
                Self Delegate Position:
              </Typography>
            </Box>
          )}

          {isDelegate && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              <Box key="-" sx={{ width: { xs: '100%', md: 'calc(50% - 12px)' } }}>
                <PositionCard>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">Delegate Position</Typography>
                      <Chip label="Active" color="success" size="small" />
                    </Box>

                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography color="text.secondary">Locked Amount:</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <SkyLogo width="16" height="16" style={{ marginRight: '8px' }} />
                        <Typography>{formatUSDS(formatEther(BigInt(delegateStakeAmount)))} SKY</Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography color="text.secondary">Delegate:</Typography>

                      <Typography>Your Delegate</Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography color="text.secondary">Delegate Address:</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography
                          variant="body2"
                          sx={{
                            maxWidth: '150px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {shortenAddress(delegateAddress as `0x${string}`)}
                        </Typography>
                        <Box
                          component="a"
                          href={`https://etherscan.io/address/${delegateAddress}`}
                          target="_blank"
                          rel="noreferrer"
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            ml: 1,
                            color: 'primary.main'
                          }}
                        >
                          <IconExternalLink size={16} />
                        </Box>
                      </Box>
                    </Box>
                    <Divider sx={{ my: 2 }} />

                    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        onClick={() => handleSelfWithdraw(delegateStakeAmount.toString())}
                        disabled={ethers.getBigInt(delegateStakeAmount.toString()) <= 0n}
                      >
                        {withdrawing['delegate'] && !txHash
                          ? 'Preparing transaction...'
                          : withdrawing['delegate'] && txHash && !isTxConfirmed
                            ? 'Confirming transaction...'
                            : 'Withdraw Position'}
                      </Button>
                    </Box>
                  </CardContent>
                </PositionCard>
              </Box>
            </Box>
          )}

          {positions.length > 0 && (
            <Box>
              <Typography variant="h5" gutterBottom>
                Your User Staking Positions:
              </Typography>
            </Box>
          )}

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {positions.length === 0 ? (
              <Box sx={{ width: '100%' }}>
                <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No Positions
                </Typography>
              </Box>
            ) : (
              positions.map((position) => (
                <Box key={position.indexPosition} sx={{ width: { xs: '100%', md: 'calc(50% - 12px)' } }}>
                  <PositionCard>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">Position #{Number(position.indexPosition) + 1}</Typography>
                        <Chip
                          // label={ethers.getBigInt(position.wad) > 0n ? 'Active' : 'Zero Balance'}
                          // color={ethers.getBigInt(position.wad) > 0n ? 'success' : 'warning'}
                          label="Active"
                          color="success"
                          size="small"
                        />
                      </Box>

                      <Divider sx={{ my: 2 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography color="text.secondary">Locked Amount:</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <SkyLogo width="16" height="16" style={{ marginRight: '8px' }} />
                          <Typography>{formatUSDS(formatEther(BigInt(position.wad)))} SKY</Typography>
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography color="text.secondary">Delegate:</Typography>

                        <Typography>
                          {position.delegateID
                            ? delegates.find(
                                (d) =>
                                  position.delegateID === apiConfig.cp0xDelegate.toLowerCase() ||
                                  d.voteDelegateAddress === position.delegateID
                              )?.name || `${position.delegateID.slice(0, 6)}...${position.delegateID.slice(-4)}`
                            : '-'}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography color="text.secondary">Delegate Address:</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography
                            variant="body2"
                            sx={{
                              maxWidth: '150px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {shortenAddress(position.delegateID)}
                          </Typography>
                          {position.delegateID && (
                            <Box
                              component="a"
                              href={`https://etherscan.io/address/${position.delegateID}`}
                              target="_blank"
                              rel="noreferrer"
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                ml: 1,
                                color: 'primary.main'
                              }}
                            >
                              <IconExternalLink size={16} />
                            </Box>
                          )}
                        </Box>
                      </Box>

                      {position.transactions && position.transactions.lockHash && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Typography color="text.secondary">Transaction:</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography
                              variant="body2"
                              sx={{
                                maxWidth: '150px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                            >
                              {shortenAddress(position.transactions.lockHash)}
                            </Typography>
                            <Box
                              component="a"
                              href={`https://etherscan.io/tx/${position.transactions.lockHash}`}
                              target="_blank"
                              rel="noreferrer"
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                ml: 1,
                                color: 'primary.main'
                              }}
                            >
                              <IconExternalLink size={16} />
                            </Box>
                          </Box>
                        </Box>
                      )}

                      <Divider sx={{ my: 2 }} />

                      <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {onEditPosition && (
                          <Button
                            variant="outlined"
                            color="info"
                            fullWidth
                            onClick={() => onEditPosition(position)}
                            disabled={withdrawing[position.indexPosition] || claiming[position.indexPosition] || isPending}
                          >
                            Edit Position
                          </Button>
                        )}
                        <Button
                          variant="outlined"
                          color="secondary"
                          fullWidth
                          onClick={() => handleClaim(position)}
                          disabled={
                            withdrawing[position.indexPosition] ||
                            claiming[position.indexPosition] ||
                            isPending ||
                            ethers.getBigInt(position.wad) <= 0n
                          }
                        >
                          {claiming[position.indexPosition] && !txHash
                            ? 'Preparing transaction...'
                            : claiming[position.indexPosition] && txHash && !isTxConfirmed
                              ? 'Confirming transaction...'
                              : `Claim ${
                                  position?.reward ? Number(formatEther(BigInt(position.rewardAmount))).toFixed(5) : '0'
                                } ${getRewardSymbol(skyConfig, position)}`}
                        </Button>

                        <Button
                          variant="contained"
                          color="primary"
                          fullWidth
                          onClick={() => handleWithdraw(position)}
                          disabled={
                            withdrawing[position.indexPosition] ||
                            claiming[position.indexPosition] ||
                            isPending ||
                            ethers.getBigInt(position.wad) <= 0n
                          }
                        >
                          {withdrawing[position.indexPosition] && !txHash
                            ? 'Preparing transaction...'
                            : withdrawing[position.indexPosition] && txHash && !isTxConfirmed
                              ? 'Confirming transaction...'
                              : 'Withdraw Position'}
                        </Button>
                      </Box>
                    </CardContent>
                  </PositionCard>
                </Box>
              ))
            )}
          </Box>
        </>
      )}

      {/* Notifications are now handled by dispatchSuccess/dispatchError */}
    </Box>
  );
};

export default Positions;
