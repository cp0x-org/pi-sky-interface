import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';

// material-ui
import { Box, IconButton, Drawer, List, ListItemButton, ListItemText, Typography, useTheme } from '@mui/material';
import { IconMenu2, IconX } from '@tabler/icons-react';

// third party
import { useIntl } from 'react-intl';

// types
interface MobileMenuItemProps {
  titleId: string;
  path?: string;
  isExternal?: boolean;
}

const MobileMenu = () => {
  const theme = useTheme();
  const intl = useIntl();
  const [open, setOpen] = useState(false);

  const handleToggleDrawer = () => {
    setOpen(!open);
  };

  const menuItems: MobileMenuItemProps[] = [
    {
      titleId: 'menu.home',
      path: '/',
      isExternal: false
    },
    {
      titleId: 'menu.permissionlessInterfaces',
      path: 'https://pi.cp0x.com',
      isExternal: false
    },
    {
      titleId: 'menu.cp0xReferrals',
      path: 'https://cp0x.com',
      isExternal: true
    }
  ];

  return (
    <Box sx={{ display: { xs: 'block', md: 'none' } }}>
      <IconButton
        color="inherit"
        onClick={handleToggleDrawer}
        edge="start"
        size="large"
        aria-label={intl.formatMessage({ id: 'menu.open' })}
      >
        <IconMenu2 aria-hidden />
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
          <Typography variant="h6">{intl.formatMessage({ id: 'menu.title' })}</Typography>
          <IconButton
            color="inherit"
            onClick={handleToggleDrawer}
            edge="end"
            size="small"
            aria-label={intl.formatMessage({ id: 'menu.close' })}
          >
            <IconX aria-hidden />
          </IconButton>
        </Box>

        <List component="nav" sx={{ px: 2, pt: 1 }}>
          {menuItems.map((item) => (
            <React.Fragment key={item.titleId}>
              {item.isExternal ? (
                <ListItemButton component="a" href={item.path} target="_blank" rel="noopener noreferrer" onClick={handleToggleDrawer}>
                  <ListItemText primary={intl.formatMessage({ id: item.titleId })} />
                </ListItemButton>
              ) : (
                <ListItemButton component={RouterLink} to={item.path || '#'} onClick={handleToggleDrawer}>
                  <ListItemText primary={intl.formatMessage({ id: item.titleId })} />
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
