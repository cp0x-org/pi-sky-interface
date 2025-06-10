// material-ui
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Box from '@mui/material/Box';

// project imports
import LogoSection from '../LogoSection';
import ConnectButtonCustom from 'components/ConnectButtonCustom';
import HeaderMenu from './HeaderMenu';

// ==============================|| MAIN NAVBAR / HEADER ||============================== //

export default function Header() {
  const theme = useTheme();
  const downMD = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <>
      {/* logo & toggler button */}
      <Box sx={{ width: downMD ? 'auto' : 228, display: 'flex' }}>
        <Box component="span" sx={{ display: { xs: 'block', md: 'block' }, flexGrow: 1 }}>
          <LogoSection />
        </Box>
      </Box>

      {/*menu */}
      <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'flex-start' }}>
        <HeaderMenu />
      </Box>
      {/* connect wallet */}
      <Box sx={{ display: { lg: 'block' } }}>
        <ConnectButtonCustom chainStatus="icon" showBalance={false} />
      </Box>
    </>
  );
}
