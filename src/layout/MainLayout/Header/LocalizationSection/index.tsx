import { useEffect, useRef, useState } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Avatar from '@mui/material/Avatar';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Grid from '@mui/material/Grid';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// third party
import { useIntl } from 'react-intl';

// project imports
import { ThemeMode } from 'config';

import Transitions from 'ui-component/extended/Transitions';

// assets
import TranslateTwoToneIcon from '@mui/icons-material/TranslateTwoTone';
import useConfig from 'hooks/useConfig';

// types
import { I18n } from 'types/config';

// available languages: the label stays in its own language, the caption is translated
const languages: { value: I18n; label: string; captionId: string }[] = [
  { value: 'en', label: 'English', captionId: 'language.english' },
  { value: 'zh', label: '中文', captionId: 'language.chinese' }
];

// ==============================|| LOCALIZATION ||============================== //

export default function LocalizationSection() {
  const { mode, borderRadius, i18n, onChangeLocale } = useConfig();
  const intl = useIntl();

  const theme = useTheme();
  const downMD = useMediaQuery(theme.breakpoints.down('md'));

  const [open, setOpen] = useState(false);
  const anchorRef = useRef<any>(null);

  const handleListItemClick = (lng: I18n) => {
    onChangeLocale(lng);
    setOpen(false);
  };

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event: MouseEvent | TouchEvent) => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) {
      return;
    }
    setOpen(false);
  };

  const prevOpen = useRef(open);

  useEffect(() => {
    if (prevOpen.current === true && open === false) {
      anchorRef.current.focus();
    }
    prevOpen.current = open;
  }, [open]);

  return (
    <>
      <Box sx={{ ml: { xs: 0, sm: 2 } }}>
        <Avatar
          component="button"
          variant="rounded"
          sx={{
            ...theme.typography.commonAvatar,
            ...theme.typography.mediumAvatar,
            border: '1px solid',
            borderColor: mode === ThemeMode.DARK ? 'dark.main' : 'primary.light',
            bgcolor: mode === ThemeMode.DARK ? 'dark.main' : 'primary.light',
            color: 'primary.dark',
            cursor: 'pointer',
            p: 0,
            transition: 'all .2s ease-in-out',
            '&[aria-expanded="true"],&:hover': {
              borderColor: 'primary.main',
              bgcolor: 'primary.main',
              color: 'primary.light'
            }
          }}
          ref={anchorRef}
          aria-haspopup="true"
          aria-expanded={open}
          aria-label={intl.formatMessage({ id: 'language.change' })}
          onClick={handleToggle}
          color="inherit"
        >
          {i18n !== 'en' && (
            <Typography variant="h5" sx={{ textTransform: 'uppercase' }} color="inherit" aria-hidden>
              {i18n}
            </Typography>
          )}
          {i18n === 'en' && <TranslateTwoToneIcon sx={{ fontSize: '1.3rem' }} aria-hidden />}
        </Avatar>
      </Box>

      <Popper
        placement={downMD ? 'bottom-start' : 'bottom'}
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        transition
        disablePortal
        modifiers={[
          {
            name: 'offset',
            options: {
              offset: [downMD ? 0 : 0, 20]
            }
          }
        ]}
      >
        {({ TransitionProps }) => (
          <ClickAwayListener onClickAway={handleClose}>
            <Transitions position={downMD ? 'top-left' : 'top'} in={open} {...TransitionProps}>
              <Paper elevation={16}>
                {open && (
                  <List
                    aria-label={intl.formatMessage({ id: 'language.change' })}
                    sx={{
                      width: '100%',
                      minWidth: 200,
                      maxWidth: { xs: 250, sm: 280 },
                      borderRadius: `${borderRadius}px`
                    }}
                  >
                    {languages.map((language) => (
                      <ListItemButton
                        key={language.value}
                        selected={i18n === language.value}
                        aria-current={i18n === language.value ? 'true' : undefined}
                        onClick={() => handleListItemClick(language.value)}
                      >
                        <ListItemText
                          primary={
                            <Grid container>
                              <Typography color="textPrimary">{language.label}</Typography>
                              <Typography variant="caption" color="textSecondary" sx={{ ml: '8px' }}>
                                ({intl.formatMessage({ id: language.captionId })})
                              </Typography>
                            </Grid>
                          }
                        />
                      </ListItemButton>
                    ))}
                  </List>
                )}
              </Paper>
            </Transitions>
          </ClickAwayListener>
        )}
      </Popper>
    </>
  );
}
