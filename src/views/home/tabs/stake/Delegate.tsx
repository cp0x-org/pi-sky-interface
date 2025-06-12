import { FC, useEffect, useState } from 'react';
import { Card, CardActionArea, Typography, Box, CircularProgress, Alert, Pagination, Stack, TextField } from '@mui/material';
import { apiConfig, appConfig } from 'config/index';
import { formatSkyPrice } from 'utils/sky';
import { isAddress } from 'viem';

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
  const [customAddress, setCustomAddress] = useState<string>('');
  const [addressError, setAddressError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [defaultApplied, setDefaultApplied] = useState<boolean>(false);
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

  // Apply the initial selection once when delegates are loaded
  useEffect(() => {
    if (delegates.length === 0 || loading || defaultApplied) {
      return;
    }

    const cp0xDelegate = delegates.find((d) => d.voteDelegateAddress.toLowerCase() === apiConfig.cp0xDelegate.toLowerCase());

    if (delegatorAddress) {
      // If we have a delegatorAddress from props, use it
      const delegateFromProps = delegates.find((d) => d.voteDelegateAddress.toLowerCase() === delegatorAddress.toLowerCase());

      if (delegateFromProps) {
        setSelected(delegateFromProps.voteDelegateAddress);
      } else if (isAddress(delegatorAddress)) {
        // If it's a valid custom address but not in our list
        setSelected(delegatorAddress);
        setCustomAddress(delegatorAddress);
      } else if (cp0xDelegate) {
        // Default to cp0x if the address is not found and not a valid custom address
        setSelected(cp0xDelegate.voteDelegateAddress);
        onChange(cp0xDelegate.voteDelegateAddress);
      }
    } else if (cp0xDelegate) {
      // If no delegatorAddress is provided, default to cp0x
      setSelected(cp0xDelegate.voteDelegateAddress);
      onChange(cp0xDelegate.voteDelegateAddress);
    }

    // Mark that we've applied the default selection
    setDefaultApplied(true);
  }, [delegates, loading, delegatorAddress, onChange, defaultApplied]);

  // This effect syncs the selected state when delegatorAddress changes externally
  useEffect(() => {
    if (delegates.length === 0 || loading || !defaultApplied || customAddress) {
      return;
    }

    // Only update if delegatorAddress changes and it's different from the current selection
    if (delegatorAddress && delegatorAddress !== selected && delegatorAddress !== '0x0') {
      const delegateFromProps = delegates.find((d) => d.voteDelegateAddress.toLowerCase() === delegatorAddress.toLowerCase());

      if (delegateFromProps) {
        setSelected(delegateFromProps.voteDelegateAddress);
      } else if (isAddress(delegatorAddress)) {
        setSelected(delegatorAddress);
      }
    }
  }, [delegatorAddress, delegates, loading, selected, defaultApplied, customAddress]);

  const handleSelect = (address: string) => {
    // Clear custom address when selecting from list
    setCustomAddress('');

    // Toggle selection if clicking the same address
    const newSelected = address === selected ? null : address;

    // Update local state first
    setSelected(newSelected);

    // Then notify parent component with the new value or 0x0 if nothing selected
    onChange(newSelected || '0x0');
  };

  const handleCustomAddressChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const address = event.target.value;
    setCustomAddress(address);

    if (!address) {
      setAddressError('');
      // Only update once
      setSelected(null);
      onChange('0x0');
      return;
    }

    if (!isAddress(address)) {
      setAddressError('Invalid Ethereum address');
      // Don't update selected or call onChange for invalid addresses
    } else {
      setAddressError('');
      setSelected(address);
      onChange(address);
    }
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
      <TextField
        fullWidth
        label="Custom Delegate Address"
        value={customAddress}
        onChange={handleCustomAddressChange}
        error={!!addressError}
        helperText={addressError || 'Enter any Ethereum address or select from the list below (click again to deselect)'}
        placeholder="0x..."
        sx={{ mb: 2 }}
      />

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
