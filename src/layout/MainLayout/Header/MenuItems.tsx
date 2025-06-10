import React from 'react';

// material-ui
import { Box, Button, Stack, useMediaQuery, useTheme } from '@mui/material';
import { styled } from '@mui/material/styles';

// Custom styled components
const MenuButton = styled(Button)(({ theme }) => ({
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
}));

const MenuItems = () => {
  const theme = useTheme();
  const matchDownMd = useMediaQuery(theme.breakpoints.down('md'));

  if (matchDownMd) return null;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
      <Stack direction="row" spacing={1}>
        <MenuButton to="/">Home</MenuButton>
        <MenuButton to="https://pi.cp0x.com">Permissionless Interfaces</MenuButton>
        <MenuButton to="https://cp0x.com">Referalls Project</MenuButton>
      </Stack>
    </Box>
  );
};

export default MenuItems;
