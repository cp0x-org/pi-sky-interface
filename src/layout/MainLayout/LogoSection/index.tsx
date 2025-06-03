import { Link as RouterLink } from 'react-router-dom';
import { ReactComponent as Cp0xLogo } from 'assets/images/sky/cp0x-logo.svg';
// material-ui
import Link from '@mui/material/Link';
import SkyLogo from 'assets/images/sky/sky-logo.png';

// project imports
import { DASHBOARD_PATH } from 'config';

// ==============================|| MAIN LOGO ||============================== //

export default function LogoSection() {
  return (
    <Link
      component={RouterLink}
      to={DASHBOARD_PATH}
      aria-label="theme-logo"
      sx={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 1.5,
        textDecoration: 'none'
      }}
    >
      <Cp0xLogo style={{ width: 50, height: 'auto' }} />
      <img
        src={SkyLogo}
        alt="Sky"
        style={{
          width: 32,
          height: 'auto',
          marginBottom: '1px'
        }}
      />
    </Link>
  );
}
