// material-ui
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Box from '@mui/material/Box';

import { ConnectButton } from '@rainbow-me/rainbowkit';
// project imports
import LogoSection from '../LogoSection';
// import SearchSection from './SearchSection';
import MobileSection from './MobileSection';
import ProfileSection from './ProfileSection';
// import LocalizationSection from './LocalizationSection';
import MegaMenuSection from './MegaMenuSection';
// import FullScreenSection from './FullScreenSection';
import NotificationSection from './NotificationSection';
import '@rainbow-me/rainbowkit/styles.css';
// ==============================|| MAIN NAVBAR / HEADER ||============================== //

export default function Header() {
  const theme = useTheme();
  const downMD = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <>
      {/* logo & toggler button */}
      <Box sx={{ width: downMD ? 'auto' : 228, display: 'flex' }}>
        <Box component="span" sx={{ display: { xs: 'none', md: 'block' }, flexGrow: 1 }}>
          <LogoSection />
        </Box>
      </Box>

      {/* header search */}
      <Box sx={{ flexGrow: 1 }} />
      <Box sx={{ flexGrow: 1 }} />

      {/* mega-menu */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        {/*<MegaMenuSection />*/}
      </Box>

      {/* notification */}
      {/*<NotificationSection />*/}

      {/* connect wallet */}
      <Box sx={{ display: { xs: 'none', lg: 'block' } }}>
        <ConnectButton />
      </Box>

      {/* profile */}
      {/*<ProfileSection />*/}

      {/* mobile header */}
      <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
        <MobileSection />
      </Box>
    </>
  );
}
