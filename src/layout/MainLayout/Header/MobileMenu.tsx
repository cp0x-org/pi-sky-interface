import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';

// material-ui
import { Box, IconButton, Drawer, List, ListItemButton, ListItemText, Typography, useTheme } from '@mui/material';
import { IconMenu2, IconX } from '@tabler/icons-react';

// types
interface MobileMenuItemProps {
  title: string;
  path?: string;
  isExternal?: boolean;
}

const MobileMenu = () => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  const handleToggleDrawer = () => {
    setOpen(!open);
  };

  const menuItems: MobileMenuItemProps[] = [
    {
      title: 'Home',
      path: '/',
      isExternal: false
    },
    {
      title: 'Permissionless Interfaces',
      path: 'https://pi.cp0x.com',
      isExternal: false
    },
    {
      title: 'cp0x Referrals',
      path: 'https://cp0x.com',
      isExternal: true
    }
  ];

  return (
    <Box sx={{ display: { xs: 'block', md: 'none' } }}>
      <IconButton color="inherit" onClick={handleToggleDrawer} edge="start" size="large">
        <IconMenu2 />
      </IconButton>

      <Drawer
        anchor="right"
        open={open}
        onClose={handleToggleDrawer}
        PaperProps={{
          sx: {
            width: '280px',
            background: theme.palette.background.default
          }
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Menu</Typography>
          <IconButton color="inherit" onClick={handleToggleDrawer} edge="end" size="small">
            <IconX />
          </IconButton>
        </Box>

        <List component="nav" sx={{ px: 2, pt: 1 }}>
          {menuItems.map((item) => (
            <React.Fragment key={item.title}>
              {item.isExternal ? (
                <ListItemButton component="a" href={item.path} target="_blank" rel="noopener noreferrer" onClick={handleToggleDrawer}>
                  <ListItemText primary={item.title} />
                </ListItemButton>
              ) : (
                <ListItemButton component={RouterLink} to={item.path || '#'} onClick={handleToggleDrawer}>
                  <ListItemText primary={item.title} />
                </ListItemButton>
              )}
            </React.Fragment>
          ))}
        </List>
      </Drawer>
    </Box>
  );
};

export default MobileMenu;
