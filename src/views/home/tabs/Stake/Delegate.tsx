import { FC, useEffect, useState } from 'react';
import { Card, CardActionArea, Typography, Box, CircularProgress, Alert } from '@mui/material';
import { apiConfig } from 'config/index';

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

  useEffect(() => {
    fetch(apiConfig.delegatesInfoMainnet)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Ошибка: ${res.status}`);
        }
        return res.json();
      })
      .then((data: DelegatesResponse) => {
        // const aligned = data.filter((d) => d.status === 'aligned');
        console.log(data);
        setDelegates(data.delegates);
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
    if (delegatorAddress) {
      const delegate = delegates.find((d) => d.voteDelegateAddress === delegatorAddress);
      if (delegate) {
        setSelected(delegate.voteDelegateAddress);
      }
    } else {
      setSelected(null);
    }
  }, [delegatorAddress, delegates]);

  const handleSelect = (address: string) => {
    const newSelected = address === selected ? null : address;
    setSelected(newSelected);
    onChange(newSelected || '');
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      {delegates.map((delegate) => (
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
              <Typography variant="h6">Total SKY delegated: {delegate.skyDelegated}</Typography>
            </Box>
          </CardActionArea>
        </Card>
      ))}
    </Box>
  );
};

export default Delegate;
