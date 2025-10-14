import { lazy } from 'react';

// project imports
import MainLayout from 'layout/MainLayout';
import Loadable from 'ui-component/Loadable';
import { Navigate } from 'react-router';
import RewardTab from '../views/home/tabs/Reward';
import SavingsTab from '../views/home/tabs/Savings';
import UpgradeTab from '../views/home/tabs/Upgrade';
import StakeTab from '../views/home/tabs/Stake';
import USDSSkyTab from '../views/home/tabs/rewards/USDSSky';
import ChronicleTab from '../views/home/tabs/rewards/Chronicle';
import Error from '../views/pages/maintenance/Error';
import USDSSpkTab from '../views/home/tabs/rewards/USDSSpk';
import ExpertTab from '../views/home/tabs/Expert';

// ==============================|| MAIN ROUTING ||============================== //

const MainRoutes = {
  path: '/',
  element: <MainLayout />,
  children: [
    {
      index: true,
      element: <Navigate to="rewards" replace />
    },
    {
      path: '/rewards',
      element: <RewardTab />
    },
    {
      path: '/rewards/usdsgetsky',
      element: <USDSSkyTab />
    },
    {
      path: '/rewards/usdsgetspk',
      element: <USDSSpkTab />
    },
    {
      path: '/rewards/chronicle',
      element: <ChronicleTab />
    },
    {
      path: '/savings',
      element: <SavingsTab />
    },
    {
      path: '/upgrade',
      element: <UpgradeTab />
    },
    {
      path: '/stake',
      element: <StakeTab />
    },
    {
      path: '/expert',
      element: <ExpertTab />
    },
    {
      path: '*',
      element: <Error />
    }
  ]
};

export default MainRoutes;
