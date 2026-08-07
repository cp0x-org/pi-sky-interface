import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

// third party
import { useIntl } from 'react-intl';

// material-ui
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import AppBar from '@mui/material/AppBar';
import Container from '@mui/material/Container';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';

// project imports
import Footer from './Footer';
import Header from './Header';
import MainContentStyled from './MainContentStyled';
import Loader from 'ui-component/Loader';
import Breadcrumbs from 'ui-component/extended/Breadcrumbs';

import { MenuOrientation } from 'config';
import useConfig from 'hooks/useConfig';
import { handlerDrawerOpen, useGetMenuMaster } from 'api/menu';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { ReactComponent as RewardSvg } from 'assets/images/sky/rewardlogo.svg';
import { ReactComponent as SavingsSvg } from 'assets/images/sky/savings.svg';
import { ReactComponent as UpgradeSvg } from 'assets/images/sky/upgrade.svg';
import { ReactComponent as StakeSvg } from 'assets/images/sky/stake.svg';
import { ReactComponent as ExpertSvg } from 'assets/images/sky/expertlogo.svg';
import MainCard from '../../ui-component/cards/MainCard';

// ==============================|| MAIN LAYOUT ||============================== //

export default function MainLayout() {
  const theme = useTheme();
  const intl = useIntl();
  const downMD = useMediaQuery(theme.breakpoints.down('md'));

  const { borderRadius, container, miniDrawer, menuOrientation } = useConfig();
  const { menuMaster, menuMasterLoading } = useGetMenuMaster();
  const drawerOpen = menuMaster?.isDashboardDrawerOpened;

  const tabs = [
    {
      label: intl.formatMessage({ id: 'nav.rewards' }),
      path: 'rewards',
      iconPosition: 'top',
      icon: <RewardSvg width="24" height="24" aria-hidden />
    },
    {
      label: intl.formatMessage({ id: 'nav.savings' }),
      path: 'savings',
      iconPosition: 'top',
      icon: <SavingsSvg width="24" height="24" aria-hidden />
    },
    {
      label: intl.formatMessage({ id: 'nav.upgrade' }),
      path: 'upgrade',
      iconPosition: 'top',
      icon: <UpgradeSvg width="24" height="24" aria-hidden />
    },
    {
      label: intl.formatMessage({ id: 'nav.stake' }),
      path: 'stake',
      iconPosition: 'top',
      icon: <StakeSvg width="24" height="24" aria-hidden />
    },
    {
      label: intl.formatMessage({ id: 'nav.expert' }),
      path: 'expert',
      iconPosition: 'top',
      icon: <ExpertSvg width="24" height="24" aria-hidden />
    }
  ];

  const navigate = useNavigate();
  const location = useLocation();
  const currentTabIndex = tabs.findIndex((tab) => location.pathname.includes(tab.path));

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    navigate(`/${tabs[newValue].path}`);
  };

  // const handleMainTabChange = (event: React.SyntheticEvent, newValue: number) => {
  //   setMainTab(newValue);
  // };

  useEffect(() => {
    handlerDrawerOpen(!miniDrawer);
  }, [miniDrawer]);

  useEffect(() => {
    downMD && handlerDrawerOpen(false);
  }, [downMD]);

  const isHorizontal = menuOrientation === MenuOrientation.HORIZONTAL && !downMD;

  if (menuMasterLoading) return <Loader />;

  return (
    <Box sx={{ display: 'flex' }}>
      {/* header */}
      <AppBar enableColorOnDark position="fixed" color="inherit" elevation={0} sx={{ bgcolor: 'background.default' }}>
        <Toolbar sx={{ p: isHorizontal ? 1.25 : 2 }}>
          <Header />
        </Toolbar>
      </AppBar>

      {/* main content */}
      <MainContentStyled {...{ borderRadius, menuOrientation, open: drawerOpen, marginTop: 80 }}>
        <Container
          maxWidth={container ? 'md' : false}
          sx={{ ...(!container && { px: { xs: 0 } }), minHeight: 'calc(100vh - 228px)', display: 'flex', flexDirection: 'column' }}
        >
          {/* breadcrumb */}
          <Breadcrumbs />
          {/*<Outlet />*/}

          <MainCard>
            <Box sx={{ width: '100%' }}>
              <Tabs value={currentTabIndex} onChange={handleChange} centered aria-label={intl.formatMessage({ id: 'nav.mainSections' })}>
                {tabs.map((tab, index) => (
                  <Tab key={tab.path} label={tab.label} icon={tab.icon} aria-current={currentTabIndex === index ? 'page' : undefined} />
                ))}
              </Tabs>
              <Box id="main-content" sx={{ p: 3 }}>
                <Outlet />
              </Box>
            </Box>
          </MainCard>
        </Container>
        {/* footer */}
        <Footer />
      </MainContentStyled>
    </Box>
  );
}
