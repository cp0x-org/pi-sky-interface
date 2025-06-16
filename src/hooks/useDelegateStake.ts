import { useAccount, useReadContract } from 'wagmi';
import { useConfigChainId } from './useConfigChainId';
import { VoteDelegateFactory } from 'config/abi/VoteDelegateFactory';
import { useEffect, useState } from 'react';
import { formatEther } from 'viem';
import { VoteDelegate } from 'config/abi/VoteDelegate';

/**
 * Custom hook that checks if the current user is a delegate,
 * retrieves their delegate address and stake amount.
 *
 * @returns {Object} - Returns an object containing:
 * - stake: false if not a delegate, stake amount as string if delegate with stake, '0' if delegate without stake
 * - isDelegate: boolean indicating if the user is a delegate
 */
export const useDelegateStake = () => {
  const { address } = useAccount();
  const { config: skyConfig } = useConfigChainId();
  const [delegateStake, setDelegateStake] = useState<false | string>(false);
  const [isDelegate, setIsDelegate] = useState<boolean>(false);

  // Check if user is a delegate
  const { data: isDelegateData, isLoading: isDelegateLoading } = useReadContract({
    address: skyConfig.contracts.VoteDelegateFactory,
    abi: VoteDelegateFactory.abi,
    functionName: 'isDelegate',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address
    }
  });

  // Get delegate address if user is a delegate
  const { data: delegateAddress, isLoading: delegateAddressLoading } = useReadContract({
    address: skyConfig.contracts.VoteDelegateFactory,
    abi: VoteDelegateFactory.abi,
    functionName: 'delegates',
    args: address && isDelegateData ? [address] : undefined,
    query: {
      enabled: !!address && !!isDelegateData
    }
  });

  // Get stake amount from delegate address
  const { data: stakeAmount, isLoading: stakeLoading } = useReadContract({
    address: delegateAddress as `0x${string}` | undefined,
    abi: VoteDelegate.abi,
    functionName: 'stake',
    args: address && delegateAddress ? [address] : undefined,
    query: {
      enabled: !!address && !!delegateAddress
    }
  });

  useEffect(() => {
    if (isDelegateLoading || delegateAddressLoading || stakeLoading) return;

    // Update isDelegate state based on isDelegateData
    setIsDelegate(!!isDelegateData);

    if (!isDelegateData) {
      setDelegateStake(false);
      return;
    }

    if (!delegateAddress) {
      setDelegateStake(false);
      return;
    }

    if (stakeAmount !== undefined) {
      setDelegateStake(stakeAmount.toString());
    } else {
      setDelegateStake('0');
    }
  }, [isDelegateData, delegateAddress, stakeAmount, isDelegateLoading, delegateAddressLoading, stakeLoading]);

  return { stakeAmount: delegateStake, isDelegate, delegateAddress };
};
