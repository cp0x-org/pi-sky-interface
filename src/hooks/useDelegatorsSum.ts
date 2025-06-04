import { useState, useEffect } from 'react';

interface Delegate {
  delegators: string;
}

interface DelegatorsResponse {
  data: {
    delegates: Delegate[];
  };
}

interface UseDelegatorsSumResult {
  totalDelegators: number;
  isLoading: boolean;
  error: string | null;
}

export const useDelegatorsSum = (): UseDelegatorsSumResult => {
  const [totalDelegators, setTotalDelegators] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDelegators = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const query = `
          {
            delegates(where: {delegators_gt: 0}, first: 300) {
              delegators
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

          // Calculate the sum of all delegators
          const sum = result.data.delegates.reduce((total, delegate) => {
            // Parse delegators as a number and add to total
            return total + Number(delegate.delegators);
          }, 0);

          setTotalDelegators(sum);
          console.log('Total delegators calculated successfully:', sum);
        } catch (fetchError: any) {
          if (fetchError.name === 'AbortError') {
            throw new Error('GraphQL request timed out');
          }
          throw fetchError;
        }
      } catch (err) {
        console.error('Error fetching delegators data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDelegators();
  }, []);

  return {
    totalDelegators,
    isLoading,
    error
  };
};
