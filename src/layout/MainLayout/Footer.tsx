import { Stack, Box, Typography } from '@mui/material';
import { ReactComponent as Cp0xLogo } from 'assets/images/sky/cp0x-logo.svg';

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        width: '100%',
        borderTop: '1px solid',
        borderColor: 'divider',
        py: 2,
        mt: 'auto'
      }}
    >
      <Stack
        direction="row"
        sx={{
          width: '100%',
          maxWidth: '1280px',
          mx: 'auto',
          px: 3,
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Cp0xLogo style={{ width: 70, height: 'auto' }} />
      </Stack>
    </Box>
  );
}
