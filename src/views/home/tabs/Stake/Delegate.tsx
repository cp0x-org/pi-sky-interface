import { FC, useEffect, useState } from 'react';
import { Card, CardActionArea, Typography, Box, CircularProgress, Alert } from '@mui/material';
import { apiConfig } from 'config/index';

type Delegate = {
  name: string;
  picture: string;
  address: string;
  voteDelegateAddress: string;
  status: string;
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
      .then((data: Delegate[]) => {
        // const aligned = data.filter((d) => d.status === 'aligned');
        setDelegates(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Не удалось загрузить делегатов');
        setLoading(false);
      });
  }, []);

  const handleSelect = (address: string) => {
    setSelected(address);
    onChange(address);
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
            {delegate.picture && (
              <Box component="img" src={delegate.picture} alt={delegate.name} sx={{ width: 40, height: 40, borderRadius: '50%' }} />
            )}
            <Box>
              <Typography variant="h6">{delegate.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {delegate.voteDelegateAddress}
              </Typography>
            </Box>
          </CardActionArea>
        </Card>
      ))}
    </Box>
  );
};

export default Delegate;
