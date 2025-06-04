import { useState, useEffect } from 'react';
import { useDelegateData } from './useDelegateData';

interface SubgraphDelegate {
  delegators: string;
  id: string;
  totalDelegated: string;
}

interface DelegatorsResponse {
  data: {
    delegates: SubgraphDelegate[];
  };
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
    extensions?: Record<string, any>;
  }>;
}

interface UseDelegatorsSumResult {
  totalDelegators: number;
  totalDelegated: string;
  isLoading: boolean;
  error: string | null;
}

export const useDelegatorsSum = (): UseDelegatorsSumResult => {
  const [totalDelegators, setTotalDelegators] = useState<number>(0);
  const [totalDelegated, setTotalDelegated] = useState<string>('0');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Get the delegate data from useDelegateData
  const { delegates: frontendDelegates, isLoading: delegatesLoading, error: delegatesError } = useDelegateData();

  useEffect(() => {
    // Wait until we have the delegate data from frontend
    if (delegatesLoading || delegatesError) return;

    const fetchDelegators = async () => {
      // Only proceed if we have delegates from the frontend
      if (!frontendDelegates || frontendDelegates.length === 0) {
        setIsLoading(false);
        setError('No delegates available from frontend data');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Get all delegate addresses from the frontend data
        const delegateAddresses = frontendDelegates.map((delegate) => delegate.voteDelegateAddress.toLowerCase());

        const query = `
          {
            delegates(where: {delegators_gt: 0}, first: 300) {
              delegators
              id
              totalDelegated
            }
          }
        `;

        // Add a timeout to prevent hanging if the GraphQL endpoint is slow
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        try {
          const response = await fetch('https://query-subgraph.sky.money/subgraphs/name/jetstreamgg/sky-subgraph-mainnet', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query }),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`Error fetching delegators data: ${response.statusText}`);
          }

          const result: DelegatorsResponse = await response.json();

          if (result.errors) {
            throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
          }

          if (!result.data || !result.data.delegates) {
            throw new Error('GraphQL response missing delegates data');
          }

          // Filter subgraph delegates to only include those present in frontend delegates
          // const filteredDelegates = result.data.delegates.filter((delegate) => delegateAddresses.includes(delegate.id.toLowerCase()));
          const filteredDelegates = result.data.delegates;
          console.log('Filtered delegates from subgraph:', filteredDelegates.length);

          // Calculate the sum of delegators from filtered delegates
          const delegatorsSum = filteredDelegates.reduce((total, delegate) => {
            return total + Number(delegate.delegators);
          }, 0);

          // Calculate the sum of totalDelegated as BigInt to handle large numbers
          const delegatedSum = filteredDelegates.reduce((total, delegate) => {
            try {
              return total + BigInt(delegate.totalDelegated || '0');
            } catch (error) {
              console.error('Error parsing totalDelegated:', error);
              return total;
            }
          }, BigInt(0));

          setTotalDelegators(delegatorsSum);
          setTotalDelegated(delegatedSum.toString());

          console.log('Filtered total delegators:', delegatorsSum);
          console.log('Filtered total delegated:', delegatedSum.toString());
        } catch (fetchError: any) {
          if (fetchError.name === 'AbortError') {
            throw new Error('GraphQL request timed out');
          }
          throw fetchError;
        }
      } catch (err) {
        console.error('Error fetching or processing delegators data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDelegators();
  }, [frontendDelegates, delegatesLoading, delegatesError]);

  // Combine loading and error states from both hooks
  const combinedIsLoading = isLoading || delegatesLoading;
  const combinedError = error || delegatesError;

  return {
    totalDelegators,
    totalDelegated,
    isLoading: combinedIsLoading,
    error: combinedError
  };
};
