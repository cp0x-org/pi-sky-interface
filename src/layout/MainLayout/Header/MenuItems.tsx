import React from 'react';
import { Link as RouterLink } from 'react-router-dom';

// material-ui
import { Box, Button, Stack, Theme, useMediaQuery, useTheme } from '@mui/material';

// third party
import { FormattedMessage } from 'react-intl';

// Menu button styling as an object for reuse
const menuButtonStyle = (theme: Theme) => ({
  color: theme.palette.text.primary,
  fontWeight: 500,
  fontSize: '15px',
  textTransform: 'none',
  padding: '6px 16px',
  borderRadius: '8px',
  '&:hover': {
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.primary.main
  }
});

const MenuItems = () => {
  const theme = useTheme();
  const matchDownMd = useMediaQuery(theme.breakpoints.down('md'));

  if (matchDownMd) return null;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
      <Stack direction="row" spacing={1}>
        {/* Internal link using RouterLink */}
        <Button component={RouterLink} to="/" sx={menuButtonStyle(theme)}>
          <FormattedMessage id="menu.home" />
        </Button>

        {/* External links using anchor tags */}
        <Button href="https://pi.cp0x.com" rel="noopener noreferrer" sx={menuButtonStyle(theme)}>
          <FormattedMessage id="menu.permissionlessInterfaces" />
        </Button>

        <Button href="https://cp0x.com" target="_blank" rel="noopener noreferrer" sx={menuButtonStyle(theme)}>
          <FormattedMessage id="menu.cp0xReferrals" />
        </Button>
      </Stack>
    </Box>
  );
};

export default MenuItems;
