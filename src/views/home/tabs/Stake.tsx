import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import { Step, StepLabel, Stepper, Typography } from '@mui/material';
import StakeAndBorrow from './Stake/StakeAndBorrow';
import Reward from './Stake/Reward';
import Delegate from './Stake/Delegate';
import Confirm from './Stake/Confirm';
import { encodeFunctionData, formatEther, parseEther } from 'viem';
import { lockStakeContractConfig } from 'config/abi/LockStackeEngine';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { useConfigChainId } from '../../../hooks/useConfigChainId';
import { usdsContractConfig } from '../../../config/abi/Usds';

const steps = ['Stake and Borrow', 'Select reward', 'Select a delegate', 'Confirm'];

export default function StakeTab() {
  const { address } = useAccount();
  const { config: skyConfig } = useConfigChainId();

  const [activeStep, setActiveStep] = useState(0);
  const [stakeData, setStakeData] = useState({
    amount: '',
    rewardAddress: '',
    delegatorAddress: ''
  });

  const { data: userBalance } = useReadContract({
    ...usdsContractConfig,
    address: skyConfig.contracts.SKY,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address
    }
  });

  const callDataArray = useMemo(() => {
    if (!address || !stakeData.amount || !stakeData.delegatorAddress) return [];

    return [
      encodeFunctionData({
        abi: lockStakeContractConfig.abi,
        functionName: 'open',
        args: [0n]
      }),
      encodeFunctionData({
        abi: lockStakeContractConfig.abi,
        functionName: 'lock',
        args: [address, 0n, parseEther(stakeData.amount), 1]
      }),
      encodeFunctionData({
        abi: lockStakeContractConfig.abi,
        functionName: 'selectFarm',
        args: [address, 0n, skyConfig.contracts.USDSStakingRewards, 1]
      }),
      encodeFunctionData({
        abi: lockStakeContractConfig.abi,
        functionName: 'selectVoteDelegate',
        args: [address, 0n, `0x${stakeData.delegatorAddress.replace(/^0x/, '')}`]
      })
    ];
  }, [address, stakeData, skyConfig]);

  const { writeContract: writeConfirm, isSuccess, isPending, error: writeError, data } = useWriteContract();

  const [validationErrors, setValidationErrors] = useState<Partial<Record<keyof typeof stakeData, string>>>({});

  const isValidEthereumAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const handleChange = (field: keyof typeof stakeData, value: string) => {
    const errors: typeof validationErrors = {};

    if (field === 'amount') {
      if (!value) {
        errors.amount = 'Amount is required';
      } else if (isNaN(Number(value))) {
        errors.amount = 'Amount must be a number';
      }
    }

    if ((field === 'reward' || field === 'delegatorAddress') && value) {
      if (!isValidEthereumAddress(value)) {
        errors[field] = 'Invalid Ethereum address';
      }
    }

    setValidationErrors(errors);

    setStakeData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      handleSubmit();
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  async function handleSubmit() {
    if (!address || !writeConfirm) return;
    writeConfirm({
      address: skyConfig.contracts.LockStakeEngine,
      abi: lockStakeContractConfig.abi,
      functionName: 'multicall',
      args: [callDataArray]
    });
  }

  const getStepComponent = () => {
    switch (activeStep) {
      case 0:
        return <StakeAndBorrow userBalance={userBalance} amount={stakeData.amount} onChange={(v) => handleChange('amount', v)} />;
      case 1:
        return <Reward value={stakeData.reward} onChange={(v) => handleChange('reward', v)} />;
      case 2:
        return <Delegate value={stakeData.delegatorAddress} onChange={(v) => handleChange('delegatorAddress', v)} />;
      case 3:
        return <Confirm />; // no input here?
      default:
        return null;
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h2" gutterBottom>
        Staking Engine
      </Typography>
      <Card sx={{ my: 2, p: 2 }}>
        <Stepper activeStep={activeStep}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ mt: 4 }}>{getStepComponent()}</Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button disabled={activeStep === 0} onClick={handleBack}>
            Back
          </Button>
          <Button variant="contained" onClick={handleNext} disabled={activeStep === steps.length - 1 && (!writeConfirm || isPending)}>
            {activeStep === steps.length - 1 ? 'Confirm' : 'Next'}
          </Button>
        </Box>

        {isSuccess && data && <Typography sx={{ mt: 4 }}>Transaction sent: {data.hash}</Typography>}
        {writeError && (
          <Typography color="error" sx={{ mt: 2 }}>
            Error: {writeError.message}
          </Typography>
        )}
      </Card>
    </Box>
  );
}
