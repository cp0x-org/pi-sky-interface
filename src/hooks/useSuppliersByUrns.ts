import { useEffect, useState } from 'react';

interface StakingUrn {
  owner: string;
}

interface StakingUrnsResponse {
  data: {
    stakingUrns: StakingUrn[];
  };
  errors?: any;
}

interface UseDelegatorsSumResult {
  totalDelegators: number;
  isLoading: boolean;
  error: string | null;
}

export const useSuppliersByUrns = (): UseDelegatorsSumResult => {
  const [totalDelegators, setTotalDelegators] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStakingUrns = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const query = `
          {
                stakingUrns(first: 1000, where: {skyLocked_gt: "0"}) {
                  owner
                  skyLocked
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
            throw new Error(`Error fetching staking urns data: ${response.statusText}`);
          }

          const result: StakingUrnsResponse = await response.json();

          if (result.errors) {
            throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
          }

          if (!result.data || !result.data.stakingUrns) {
            throw new Error('GraphQL response missing staking urns data');
          }

          const stakingUrns = result.data.stakingUrns;
          console.log('Staking urns from subgraph:', stakingUrns.length);

          // Get unique owner addresses
          const suppliers = stakingUrns.map((urn) => urn.owner.toLowerCase());

          // Set the total number of unique suppliers (owners)
          setTotalDelegators(suppliers.length);

          console.log('Total unique suppliers:', suppliers.length);
        } catch (fetchError: any) {
          if (fetchError.name === 'AbortError') {
            throw new Error('GraphQL request timed out');
          }
          throw fetchError;
        }
      } catch (err) {
        console.error('Error fetching or processing staking urns data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStakingUrns();
  }, []);

  // Combine loading and error states from both hooks
  const combinedIsLoading = isLoading;
  return {
    totalDelegators, // active positions
    isLoading: combinedIsLoading,
    error: error
  };
};
