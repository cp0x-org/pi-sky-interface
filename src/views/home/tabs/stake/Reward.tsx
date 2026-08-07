import { FC, useState, useEffect } from 'react';
import { Card, CardActionArea, Typography, Box } from '@mui/material';

import { getTokens, SkyContracts, Token } from 'config/index';
import { dispatchWarning } from 'utils/snackbar';
import { useIntl } from 'react-intl';

interface Props {
  rewardAddress: string;
  onChange: (v: string) => void;
}

const Reward: FC<Props> = ({ rewardAddress = '', onChange }) => {
  const intl = useIntl();
  const [selected, setSelected] = useState<string | null>(null);
  const tokens = getTokens();

  useEffect(() => {
    if (rewardAddress) {
      const token = tokens.find((t) => t.tokenAddress === rewardAddress);
      if (token) {
        setSelected(token.tokenAddress);
      }
    } else {
      setSelected(null);
    }
  }, [rewardAddress, tokens]);
  const handleSelect = (token: Token) => {
    const newSelected = token.tokenAddress === selected ? null : token.tokenAddress;

    if (newSelected == SkyContracts.USDSStakingRewards) {
      dispatchWarning(intl.formatMessage({ id: 'stake.usdsRewardsDeprecated' }));
      return;
    }
    setSelected(newSelected);
    onChange(newSelected ? token.tokenAddress : '');
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      gap={2}
      role="radiogroup"
      aria-label={intl.formatMessage({ id: 'stake.rewardTokenAriaLabel' })}
    >
      {tokens.map((token) => {
        const isSelected = selected === token.tokenAddress;
        return (
          <Card
            key={token.tokenAddress}
            sx={{
              borderRadius: '20px',
              border: '2px solid',
              borderColor: isSelected ? 'primary.main' : 'transparent',
              backgroundColor: isSelected ? 'primary.light' : 'background.paper',
              transition: '0.3s',
              boxShadow: isSelected ? 4 : 1
            }}
          >
            <CardActionArea
              role="radio"
              aria-checked={isSelected}
              aria-label={token.label}
              onClick={() => handleSelect(token)}
              sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}
            >
              <token.icon width={72} height={72} aria-hidden />
              <Box>
                <Typography variant="h6">{token.label}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {intl.formatMessage({ id: isSelected ? 'stake.selected' : 'stake.clickToSelect' })}
                </Typography>
              </Box>
            </CardActionArea>
          </Card>
        );
      })}
    </Box>
  );
};

export default Reward;
