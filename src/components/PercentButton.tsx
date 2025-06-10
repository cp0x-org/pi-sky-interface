import { Button, darken, styled } from '@mui/material';

export const PercentButton = styled(Button)(({ theme }) => ({
  height: 24,
  padding: '5px 8px 3px',
  borderRadius: 32,
  fontSize: 13,
  fontWeight: 'normal',
  backgroundColor: theme.palette.primary.light,
  color: theme.palette.text.primary,
  '&:hover': {
    backgroundColor: darken(theme.palette.primary.light, 0.7)
  }
}));
