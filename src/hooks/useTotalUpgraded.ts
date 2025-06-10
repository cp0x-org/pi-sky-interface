import { useState, useEffect } from 'react';

interface TotalUpgradedResponse {
  data: {
    mkrTotal: {
      total: string;
    };
    daiTotal: {
      total: string;
    };
  };
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
    extensions?: Record<string, any>;
  }>;
}

interface UseTotalUpgradedResult {
  mkrTotal: string;
  daiTotal: string;
  isLoading: boolean;
  error: string | null;
}

export const useTotalUpgraded = (): UseTotalUpgradedResult => {
  const [mkrTotal, setMkrTotal] = useState<string>('0');
  const [daiTotal, setDaiTotal] = useState<string>('0');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTotalUpgraded = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const query = `
          {
            mkrTotal: total(id: "mkrUpgraded") {
              total
            }
            daiTotal: total(id: "daiUpgraded") {
              total
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
            throw new Error(`Error fetching total upgraded data: ${response.statusText}`);
          }

          const result: TotalUpgradedResponse = await response.json();

          if (result.errors) {
            throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
          }

          if (!result.data) {
            throw new Error('GraphQL response missing data');
          }

          // Set MKR and DAI totals
          setMkrTotal(result.data.mkrTotal?.total || '0');
          setDaiTotal(result.data.daiTotal?.total || '0');

          console.log('MKR Total Upgraded:', result.data.mkrTotal?.total);
          console.log('DAI Total Upgraded:', result.data.daiTotal?.total);
        } catch (fetchError: any) {
          if (fetchError.name === 'AbortError') {
            throw new Error('GraphQL request timed out');
          }
          throw fetchError;
        }
      } catch (err) {
        console.error('Error fetching or processing total upgraded data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTotalUpgraded();
  }, []);

  return {
    mkrTotal,
    daiTotal,
    isLoading,
    error
  };
};
