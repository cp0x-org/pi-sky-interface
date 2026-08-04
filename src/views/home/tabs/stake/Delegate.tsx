import { FC, useEffect, useState } from 'react';
import { Card, CardActionArea, Typography, Box, Alert, Pagination, Stack, TextField, Tooltip, IconButton } from '@mui/material';
import { apiConfig, appConfig, getCp0xDelegateName, isLegacyCp0xDelegate } from 'config/index';
import { formatShortUSDS } from 'utils/sky';
import { isAddress } from 'viem';
import { shortenAddress } from 'utils/formatters';
import { IconCopy } from '@tabler/icons-react';
import LoadingIndicator from 'components/LoadingIndicator';

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
  originalDelegatorAddress?: string;
  onChange: (v: string) => void;
  onReadyChange?: (ready: boolean) => void;
}

const Delegate: FC<Props> = ({ delegatorAddress = '', originalDelegatorAddress = '', onChange, onReadyChange }) => {
  const [delegates, setDelegates] = useState<Delegate[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [customAddress, setCustomAddress] = useState<string>('');
  const [addressError, setAddressError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [defaultApplied, setDefaultApplied] = useState<boolean>(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [delegatesPerPage, setDelegatesPerPage] = useState<number>(appConfig.delegatesPerPage);

  const copyToClipboard = (e: React.MouseEvent, address: string) => {
    e.stopPropagation(); // Prevent card selection when clicking copy button
    navigator.clipboard
      .writeText(address)
      .then(() => {
        setCopiedAddress(address);
        setTimeout(() => setCopiedAddress(null), 2000); // Reset copied state after 2 seconds
      })
      .catch((err) => console.error('Failed to copy address: ', err));
  };

  useEffect(() => {
    onReadyChange?.(false);

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
          // Create new objects with updated display names for all cp0x delegates
          .map((delegate) => {
            const cp0xName = getCp0xDelegateName(delegate.voteDelegateAddress);
            return cp0xName ? { ...delegate, name: cp0xName } : delegate;
          })
          // Then sort with only the aligned cp0x delegate at the top
          .sort((a, b) => {
            // Pin only cp0xDelegate (aligned) to the top
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
  }, [onReadyChange]);

  // Apply the initial selection once when delegates are loaded
  useEffect(() => {
    if (delegates.length === 0 || loading || defaultApplied) {
      return;
    }

    const cp0xDelegate = delegates.find((d) => d.voteDelegateAddress.toLowerCase() === apiConfig.cp0xDelegate.toLowerCase());
    const preferredDelegateAddress = cp0xDelegate?.voteDelegateAddress ?? apiConfig.cp0xDelegate;

    if (delegatorAddress) {
      const delegateFromProps = delegates.find((d) => d.voteDelegateAddress.toLowerCase() === delegatorAddress.toLowerCase());
      const isOriginalPositionDelegate =
        !!originalDelegatorAddress && delegatorAddress.toLowerCase() === originalDelegatorAddress.toLowerCase();
      const shouldReplacePositionDelegate = isOriginalPositionDelegate && !delegateFromProps;
      const isLegacyCp0xPositionDelegate = isOriginalPositionDelegate && isLegacyCp0xDelegate(delegatorAddress);

      if (shouldReplacePositionDelegate || isLegacyCp0xPositionDelegate) {
        // Unknown position delegates and legacy cp0x delegates are migrated to
        // the current cp0x delegate. A custom address entered by the user is not
        // an original position delegate and therefore remains untouched.
        setSelected(preferredDelegateAddress);
        setCustomAddress('');
        onChange(preferredDelegateAddress);
      } else if (delegateFromProps) {
        setSelected(delegateFromProps.voteDelegateAddress);
      } else if (isAddress(delegatorAddress)) {
        // Preserve custom addresses entered by the user, including after Back.
        setSelected(delegatorAddress);
        setCustomAddress(delegatorAddress);
      } else {
        // Default to cp0x if the address is not found and not a valid custom address
        setSelected(preferredDelegateAddress);
        onChange(preferredDelegateAddress);
      }
    } else {
      // If no delegatorAddress is provided, default to cp0x
      setSelected(preferredDelegateAddress);
      onChange(preferredDelegateAddress);
    }

    // Mark that we've applied the default selection
    setDefaultApplied(true);
    onReadyChange?.(true);
  }, [delegates, loading, delegatorAddress, originalDelegatorAddress, onChange, onReadyChange, defaultApplied]);

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

  // Reset to page 1 when changing the number of delegates per page
  useEffect(() => {
    setCurrentPage(1);
  }, [delegatesPerPage]);

  // Get current delegates for display
  const indexOfLastDelegate = currentPage * delegatesPerPage;
  const indexOfFirstDelegate = indexOfLastDelegate - delegatesPerPage;
  const currentDelegates = delegates.slice(indexOfFirstDelegate, indexOfLastDelegate);
  const totalPages = Math.ceil(delegates.length / delegatesPerPage);

  if (loading) return <LoadingIndicator label="Loading delegates..." />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      <TextField
        fullWidth
        label="Custom Delegate Address"
        value={customAddress}
        onChange={handleCustomAddressChange}
        error={!!addressError}
        helperText={addressError || undefined}
        placeholder="0x..."
      />

      <Box display="flex" flexDirection="column" gap={2} role="radiogroup" aria-label="Delegate">
        {currentDelegates.map((delegate) => {
          const isSelected = selected === delegate.voteDelegateAddress;
          return (
            <Card
              key={delegate.voteDelegateAddress}
              sx={{
                borderRadius: '20px',
                border: '1px solid',
                borderColor: isSelected ? 'primary.main' : 'transparent',
                backgroundColor: isSelected ? 'primary.light' : 'background.paper',
                transition: '0.3s',
                boxShadow: isSelected ? 4 : 1
              }}
            >
              <CardActionArea
                role="radio"
                aria-checked={isSelected}
                aria-label={delegate.name || shortenAddress(delegate.voteDelegateAddress)}
                onClick={() => handleSelect(delegate.voteDelegateAddress)}
                sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 2 }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {delegate.name ? (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="h6">
                          {delegate.name}{' '}
                          <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                            ({shortenAddress(delegate.voteDelegateAddress)})
                          </Typography>
                        </Typography>
                        <Tooltip title={copiedAddress === delegate.voteDelegateAddress ? 'Copied!' : 'Copy address'}>
                          <IconButton
                            size="small"
                            aria-label={`Copy delegate address ${shortenAddress(delegate.voteDelegateAddress)}`}
                            sx={{ ml: 0.5 }}
                            color={copiedAddress === delegate.voteDelegateAddress ? 'success' : 'default'}
                            onClick={(e) => copyToClipboard(e, delegate.voteDelegateAddress)}
                          >
                            <IconCopy size={16} aria-hidden />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="h6">{shortenAddress(delegate.voteDelegateAddress)}</Typography>
                        <Tooltip title={copiedAddress === delegate.voteDelegateAddress ? 'Copied!' : 'Copy address'}>
                          <IconButton
                            size="small"
                            aria-label={`Copy delegate address ${shortenAddress(delegate.voteDelegateAddress)}`}
                            sx={{ ml: 0.5 }}
                            onClick={(e) => copyToClipboard(e, delegate.voteDelegateAddress)}
                            color={copiedAddress === delegate.voteDelegateAddress ? 'success' : 'default'}
                          >
                            <IconCopy size={16} aria-hidden />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                    <Typography variant="h6" sx={{ whiteSpace: 'nowrap' }}>
                      {formatShortUSDS(delegate.skyDelegated)} SKY
                    </Typography>
                  </Box>
                </Box>
              </CardActionArea>
            </Card>
          );
        })}
      </Box>

      {delegates.length > 0 && (
        <Stack direction="row" justifyContent="center" alignItems="center" spacing={2}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ mr: 1 }}>
              Show:
            </Typography>
            <TextField
              select
              value={delegatesPerPage}
              onChange={(e) => setDelegatesPerPage(Number(e.target.value))}
              size="small"
              sx={{ width: '80px' }}
              SelectProps={{
                native: true,
                inputProps: { 'aria-label': 'Delegates per page' }
              }}
            >
              {[5, 10, 15, 20, 25].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </TextField>
          </Box>
          <Pagination count={totalPages} page={currentPage} onChange={handlePageChange} color="primary" siblingCount={1} size="small" />
        </Stack>
      )}
    </Box>
  );
};

export default Delegate;
