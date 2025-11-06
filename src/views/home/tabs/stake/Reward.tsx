import { FC, useState, useEffect } from 'react';
import { Card, CardActionArea, Typography, Box } from '@mui/material';

import { getTokens, Token } from 'config/index';

interface Props {
  rewardAddress: string;
  onChange: (v: string) => void;
}

const Reward: FC<Props> = ({ rewardAddress = '', onChange }) => {
  const [selected, setSelected] = useState<string | null>(null);
  const tokens = getTokens();

  useEffect(() => {
    if (rewardAddress) {
      const token = tokens.find((t) => t.tokenAddress === rewardAddress);
      if (token) {
        setSelected(token.label);
      }
    } else {
      setSelected(null);
    }
  }, [rewardAddress, tokens]);
  const handleSelect = (token: Token) => {
    const newSelected = token.label === selected ? null : token.label;
    setSelected(newSelected);
    onChange(newSelected ? token.tokenAddress : '');
  };

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      {tokens.map((token) => (
        <Card
          key={token.label}
          sx={{
            borderRadius: '20px',
            border: '2px solid',
            borderColor: selected === token.label ? 'primary.main' : 'transparent',
            backgroundColor: selected === token.label ? 'primary.light' : 'background.paper',
            transition: '0.3s',
            boxShadow: selected === token.label ? 4 : 1,
            cursor: 'pointer'
          }}
          onClick={() => handleSelect(token)}
        >
          <CardActionArea sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <token.icon width={72} height={72} />
            <Box>
              <Typography variant="h6">{token.label}</Typography>
              <Typography variant="body2" color="text.secondary">
                Click to select
              </Typography>
            </Box>
          </CardActionArea>
        </Card>
      ))}
    </Box>
  );
};

export default Reward;
