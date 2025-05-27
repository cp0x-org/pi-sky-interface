// material-ui
import { useTheme } from '@mui/material/styles';
import { Box } from '@mui/material';

// project imports
import { ThemeMode } from 'config';

import { ReactComponent as LogoDark } from 'assets/images/logo-dark.svg';
import { ReactComponent as LogoLight } from 'assets/images/logo.svg';
import SkyLogo from 'assets/images/sky/sky-logo.png';

export default function Logo() {
  const theme = useTheme();
  const LogoComponent = theme.palette.mode === ThemeMode.DARK ? LogoDark : LogoLight;

  return (
    <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
      <img src={SkyLogo} alt="Sky" width={40} />
      {/*<LogoComponent width={100} />*/}
    </Box>
  );
}
