import React from 'react';

// material-ui
import { Box } from '@mui/material';

// project imports
import MenuItems from './MenuItems';
import MobileMenu from './MobileMenu';

const HeaderMenu = () => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <MenuItems />
      <MobileMenu />
    </Box>
  );
};

export default HeaderMenu;
