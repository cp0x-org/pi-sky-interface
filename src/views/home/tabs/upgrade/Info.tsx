import { FC } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

export default function Info() {
  return (
    <Card sx={{ borderRadius: '20px', my: 2 }}>
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            width: '100%',
            alignItems: 'center',
            flexDirection: {
              xs: 'column',
              sm: 'row'
            },
            gap: 2
          }}
        >
          <Typography>Easily upgrade MKR to SKY, or swap DAI in both directions with USDS.</Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
