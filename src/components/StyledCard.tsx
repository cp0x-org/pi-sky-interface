import { Box, styled } from '@mui/material';

export const StyledCard = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4),
  minHeight: 64,
  overflow: 'hidden',
  borderRadius: 16,
  maxWidth: 400,
  width: '100%',
  margin: '0 auto',
  background: theme.palette.secondary.light,
  backgroundBlendMode: 'overlay'
}));
