import { FC } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { useTotalUpgraded } from '../../../../hooks/useTotalUpgraded';
import { formatTokenAmount } from '../../../../utils/formatters';
import { useReadContract } from 'wagmi';
import { mkrSkyConverterConfig } from '../../../../config/abi/MkrSkyConverter';
import { useConfigChainId } from '../../../../hooks/useConfigChainId';
import CardHeader from '@mui/material/CardHeader';

export default function Info() {
  const { mkrTotal, daiTotal } = useTotalUpgraded();

  const { config: skyConfig } = useConfigChainId();

  const { data: mkrToSkyRate, isLoading: isRateLoading } = useReadContract({
    ...mkrSkyConverterConfig,
    address: skyConfig.contracts.MKRSKYConverter,
    functionName: 'rate'
  });

  return (
    <Card
      sx={{
        borderRadius: '20px',
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <CardHeader title={'Summary'}></CardHeader>
      <CardContent
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: 3
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            gap: 4
          }}
        >
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid',
              borderColor: 'divider',
              pb: 1
            }}
          >
            <Typography color="text.secondary" variant="body2">
              MKR Total Upgraded
            </Typography>
            <Typography variant="h6">{formatTokenAmount(mkrTotal, 4) || 'MKR'}</Typography>
          </Box>
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid',
              borderColor: 'divider',
              pb: 1
            }}
          >
            <Typography color="text.secondary" variant="body2">
              SKY Total Upgraded:
            </Typography>
            <Typography variant="h6">
              {!isRateLoading && <>{formatTokenAmount(BigInt(mkrTotal) * BigInt(mkrToSkyRate), 2) || 'SKY'}</>}
            </Typography>
          </Box>
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid',
              borderColor: 'divider',
              pb: 1
            }}
          >
            <Typography color="text.secondary" variant="body2">
              DAI Total Upgraded:
            </Typography>
            <Typography variant="h6">{formatTokenAmount(daiTotal, 2) || '0 DAI'}</Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
