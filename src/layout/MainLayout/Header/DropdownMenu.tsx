import React, { useState, useRef } from 'react';
import { Link as RouterLink } from 'react-router-dom';

// material-ui
import { Box, Button, ClickAwayListener, Grow, Paper, Popper, MenuItem, MenuList, Typography, useTheme, Theme } from '@mui/material';
import { IconChevronDown } from '@tabler/icons-react';

// types
interface DropdownItem {
  title: string;
  path: string;
  isExternal?: boolean;
  description?: string;
}

interface DropdownMenuProps {
  title: string;
  items: DropdownItem[];
}

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

const DropdownMenu = ({ title, items }: DropdownMenuProps) => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event: Event | React.SyntheticEvent) => {
    if (anchorRef.current && anchorRef.current.contains(event.target as HTMLElement)) {
      return;
    }
    setOpen(false);
  };

  return (
    <>
      <Button
        ref={anchorRef}
        aria-controls={open ? 'menu-list-grow' : undefined}
        aria-haspopup="true"
        onClick={handleToggle}
        endIcon={<IconChevronDown size={16} />}
        sx={menuButtonStyle(theme)}
      >
        {title}
      </Button>
      <Popper
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        transition
        disablePortal
        placement="bottom-start"
        sx={{
          zIndex: 2000,
          width: 280,
          '&:before': {
            content: '""',
            display: 'block',
            position: 'absolute',
            top: 0,
            left: 14,
            width: 10,
            height: 10,
            bgcolor: 'background.paper',
            transform: 'translateY(-50%) rotate(45deg)',
            zIndex: 0
          }
        }}
      >
        {({ TransitionProps }) => (
          <Grow {...TransitionProps} style={{ transformOrigin: 'top left' }}>
            <Paper elevation={3} sx={{ borderRadius: 2, mt: 1.5 }}>
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList autoFocusItem={open} id="menu-list-grow">
                  {items.map((item, index) => (
                    <MenuItem
                      key={index}
                      component={item.isExternal ? 'a' : RouterLink}
                      {...(item.isExternal ? { href: item.path, target: '_blank', rel: 'noopener noreferrer' } : { to: item.path })}
                      onClick={handleClose}
                      sx={{
                        py: 1.5,
                        px: 2.5,
                        '&:hover': {
                          bgcolor: theme.palette.primary.light,
                          '& .MuiTypography-root': {
                            color: theme.palette.primary.main
                          }
                        }
                      }}
                    >
                      <Box>
                        <Typography variant="subtitle1" color="textPrimary">
                          {item.title}
                        </Typography>
                        {item.description && (
                          <Typography variant="caption" color="textSecondary">
                            {item.description}
                          </Typography>
                        )}
                      </Box>
                    </MenuItem>
                  ))}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </>
  );
};

export default DropdownMenu;
