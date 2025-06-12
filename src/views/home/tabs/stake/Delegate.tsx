import { FC, useEffect, useState } from 'react';
import { Card, CardActionArea, Typography, Box, CircularProgress, Alert, Pagination, Stack } from '@mui/material';
import { apiConfig, appConfig } from 'config/index';
import { formatSkyPrice } from 'utils/sky';

type DelegatesResponse = {
  delegates: Delegate[];
  paginationInfo: {
    hasNextPage: boolean;
    numPages: number | null;
    page: number;
  };
  stats: {
    aligned: number;
    shadow: number;
    total: number;
    totalDelegators: number;
    totalSkyDelegated: string;
  };
};

type Delegate = {
  name: string;
  address: string;
  voteDelegateAddress: string;
  status: string;
  skyDelegated: string;
};

interface Props {
  delegatorAddress: string;
  onChange: (v: string) => void;
}

const Delegate: FC<Props> = ({ delegatorAddress = '', onChange }) => {
  const [delegates, setDelegates] = useState<Delegate[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const delegatesPerPage = appConfig.delegatesPerPage;

  useEffect(() => {
    fetch(apiConfig.delegatesInfoMainnet)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Ошибка: ${res.status}`);
        }
        return res.json();
      })
      .then((data: DelegatesResponse) => {
        console.log(data);

        // First sort by skyDelegated amount
        const sortedDelegates = data.delegates
          // Create new objects with updated name for cp0x delegate
          .map((delegate) => {
            if (delegate.voteDelegateAddress.toLowerCase() === apiConfig.cp0xDelegate.toLowerCase()) {
              return { ...delegate, name: 'cp0x' };
            }
            return delegate;
          })
          // Then sort with cp0x at the top
          .sort((a, b) => {
            // Put cp0x delegate at the top
            if (a.voteDelegateAddress.toLowerCase() === apiConfig.cp0xDelegate.toLowerCase()) return -1;
            if (b.voteDelegateAddress.toLowerCase() === apiConfig.cp0xDelegate.toLowerCase()) return 1;
            // Sort the rest by skyDelegated amount
            return parseFloat(b.skyDelegated) - parseFloat(a.skyDelegated);
          });

        setDelegates(sortedDelegates);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Cannot load delegators');
        setLoading(false);
      });
  }, []);

  // Sync the selected state with the delegatorAddress prop
  useEffect(() => {
    const cp0xDelegate = delegates.find((d) => d.voteDelegateAddress.toLowerCase() === apiConfig.cp0xDelegate.toLowerCase());
    if (delegatorAddress) {
      const delegate = delegates.find((d) => d.voteDelegateAddress === delegatorAddress);
      if (delegate) {
        setSelected(delegate.voteDelegateAddress);
        onChange(delegate.voteDelegateAddress);
      } else if (cp0xDelegate) {
        setSelected(cp0xDelegate.voteDelegateAddress);
        onChange(cp0xDelegate.voteDelegateAddress);
      }
    } else if (cp0xDelegate) {
      setSelected(cp0xDelegate.voteDelegateAddress);
      onChange(cp0xDelegate.voteDelegateAddress);
    } else {
      setSelected(null);
      onChange('0x0');
    }
  }, [delegatorAddress, delegates]);

  const handleSelect = (address: string) => {
    const newSelected = address === selected ? null : address;
    setSelected(newSelected);
    onChange(newSelected || '0x0');
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
  };

  // Get current delegates for display
  const indexOfLastDelegate = currentPage * delegatesPerPage;
  const indexOfFirstDelegate = indexOfLastDelegate - delegatesPerPage;
  const currentDelegates = delegates.slice(indexOfFirstDelegate, indexOfLastDelegate);
  const totalPages = Math.ceil(delegates.length / delegatesPerPage);

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      {currentDelegates.map((delegate) => (
        <Card
          key={delegate.voteDelegateAddress}
          sx={{
            borderRadius: '20px',
            border: '2px solid',
            borderColor: selected === delegate.voteDelegateAddress ? 'primary.main' : 'transparent',
            backgroundColor: selected === delegate.voteDelegateAddress ? 'primary.light' : 'background.paper',
            transition: '0.3s',
            boxShadow: selected === delegate.voteDelegateAddress ? 4 : 1,
            cursor: 'pointer'
          }}
          onClick={() => handleSelect(delegate.voteDelegateAddress)}
        >
          <CardActionArea sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box>
              {delegate.name ? (
                <>
                  <Typography variant="h6">{delegate.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {delegate.voteDelegateAddress}
                  </Typography>
                </>
              ) : (
                <Typography variant="h6">{delegate.voteDelegateAddress}</Typography>
              )}
              <Typography variant="h6">Total SKY delegated: {formatSkyPrice(delegate.skyDelegated)}</Typography>
            </Box>
          </CardActionArea>
        </Card>
      ))}

      {delegates.length > 0 && (
        <Stack spacing={2} direction="row" justifyContent="center" alignItems="center" sx={{ mt: 2 }}>
          <Pagination count={totalPages} page={currentPage} onChange={handlePageChange} color="primary" siblingCount={1} size="large" />
        </Stack>
      )}
    </Box>
  );
};

export default Delegate;
