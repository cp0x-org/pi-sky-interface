import Stack from '@mui/material/Stack';
import { ReactComponent as Cp0xLogo } from 'assets/images/sky/cp0x-logo.svg';
import Typography from '@mui/material/Typography';

export default function Footer() {
  return (
    <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', pt: 3, mt: 'auto' }}>
      <Cp0xLogo style={{ width: 70, height: 'auto' }} />
      {/*<Stack direction="row" sx={{ gap: 1.5, alignItems: 'center', justifyContent: 'space-between' }}>*/}
      {/*  <Typography variant="body2" color="textSecondary">*/}
      {/*    [work in progress]*/}
      {/*  </Typography>*/}
      {/*</Stack>*/}
    </Stack>
  );
}
