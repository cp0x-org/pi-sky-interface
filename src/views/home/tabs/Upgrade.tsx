import { useState } from 'react';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Grid from '@mui/material/Grid';
import TabPanel, { a11yTabProps } from 'ui-component/TabPanel';
import Typography from '@mui/material/Typography';
import UpgradeAssets from './upgrade/UpgradeAssets';
import RevertAssets from './upgrade/RevertAssets';
import { useAccount, useReadContract } from 'wagmi';
import { usdsContractConfig } from 'config/abi/Usds';
import { useConfigChainId } from 'hooks/useConfigChainId';
import { daiContractConfig } from 'config/abi/Dai';
import { mkrContractConfig } from 'config/abi/Mkr';
import Info from './upgrade/Info';
import CardHeader from '@mui/material/CardHeader';
import { Alert } from '@mui/material';
import { FormattedMessage, useIntl } from 'react-intl';

export default function UpgradeTab() {
  const [operationType, setOperationType] = useState(0);
  const intl = useIntl();
  const account = useAccount();
  const address = account.address as `0x${string}` | undefined;
  const { config: skyConfig } = useConfigChainId();

  const handleOperationChange = (event: React.SyntheticEvent, newValue: number) => {
    setOperationType(newValue);
  };

  const { data: daiUserBalance } = useReadContract({
    ...daiContractConfig,
    address: skyConfig.contracts.DAI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address
    }
  });

  const { data: mkrUserBalance } = useReadContract({
    ...mkrContractConfig,
    address: skyConfig.contracts.MKR,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address
    }
  });

  const { data: usdsUserBalance } = useReadContract({
    ...usdsContractConfig,
    address: skyConfig.contracts.USDS,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address
    }
  });

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h2" component="h1" gutterBottom>
        <FormattedMessage id="upgrade.title" />
      </Typography>
      <Typography variant="h4" component="p" gutterBottom sx={{ mb: 2 }} color="text.secondary">
        <FormattedMessage id="upgrade.description" />
      </Typography>
      {!address && (
        <Alert severity="info" sx={{ mt: 2 }}>
          <FormattedMessage id="common.connectWallet" />
        </Alert>
      )}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <CardHeader title={intl.formatMessage({ id: 'upgrade.useCard' })}></CardHeader>
          <Box sx={{ width: '100%', borderRadius: '20px' }}>
            <Tabs
              value={operationType}
              onChange={handleOperationChange}
              aria-label={intl.formatMessage({ id: 'upgrade.operationsAriaLabel' })}
            >
              <Tab label={intl.formatMessage({ id: 'upgrade.tab.upgrade' })} {...a11yTabProps('upgrade', 0)} />
              <Tab label={intl.formatMessage({ id: 'upgrade.tab.revert' })} {...a11yTabProps('upgrade', 1)} />
            </Tabs>

            <TabPanel value={operationType} index={0} idPrefix="upgrade">
              <UpgradeAssets daiUserBalance={daiUserBalance} mkrUserBalance={mkrUserBalance} />
            </TabPanel>
            <TabPanel value={operationType} index={1} idPrefix="upgrade">
              <RevertAssets usdsUserBalance={usdsUserBalance} />
            </TabPanel>
          </Box>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Box sx={{ width: '100%', display: 'flex' }}>
            <Info />
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
