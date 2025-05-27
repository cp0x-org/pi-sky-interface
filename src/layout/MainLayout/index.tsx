import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

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
// import Sidebar from './Sidebar';
// import HorizontalBar from './HorizontalBar';
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
import MainCard from '../../ui-component/cards/MainCard';

// ==============================|| MAIN LAYOUT ||============================== //

export default function MainLayout() {
  const theme = useTheme();
  const downMD = useMediaQuery(theme.breakpoints.down('md'));

  const { borderRadius, container, miniDrawer, menuOrientation } = useConfig();
  const { menuMaster, menuMasterLoading } = useGetMenuMaster();
  const drawerOpen = menuMaster?.isDashboardDrawerOpened;

  const tabs = [
    { label: 'Rewards', path: 'rewards', iconPosition: 'top', icon: <RewardSvg width="24" height="24" /> },
    { label: 'Savings', path: 'savings', iconPosition: 'top', icon: <SavingsSvg width="24" height="24" /> },
    { label: 'Upgrade', path: 'upgrade', iconPosition: 'top', icon: <UpgradeSvg width="24" height="24" /> },
    { label: 'Stake', path: 'stake', iconPosition: 'top', icon: <StakeSvg width="24" height="24" /> }
  ];

  const navigate = useNavigate();
  const location = useLocation();
  const currentTabIndex = tabs.findIndex((tab) => location.pathname.endsWith(tab.path));

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

  // horizontal menu-list bar : drawer
  // const menu = useMemo(() => (isHorizontal ? <HorizontalBar /> : <Sidebar />), [isHorizontal]);

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
          maxWidth={container ? 'lg' : false}
          sx={{ ...(!container && { px: { xs: 0 } }), minHeight: 'calc(100vh - 128px)', display: 'flex', flexDirection: 'column' }}
        >
          {/* breadcrumb */}
          <Breadcrumbs />
          {/*<Outlet />*/}

          <MainCard>
            <Box sx={{ width: '100%' }}>
              <Tabs value={currentTabIndex} onChange={handleChange} centered>
                {tabs.map((tab) => (
                  <Tab key={tab.path} label={tab.label} icon={tab.icon} />
                ))}
              </Tabs>
              <Box sx={{ p: 3 }}>
                <Outlet />
              </Box>
              {/*<TabPanel value={mainTab} index={0}>*/}
              {/*  <RewardTab />*/}
              {/*</TabPanel>*/}
              {/*<TabPanel value={mainTab} index={1}>*/}
              {/*  <SavingsTab />*/}
              {/*</TabPanel>*/}
              {/*<TabPanel value={mainTab} index={2}>*/}
              {/*  <UpgradeTab />*/}
              {/*</TabPanel>*/}
              {/*<TabPanel value={mainTab} index={3}>*/}
              {/*  <StakeTab />*/}
              {/*</TabPanel>*/}
            </Box>
          </MainCard>

          <Footer />
        </Container>
      </MainContentStyled>
    </Box>
  );
}
