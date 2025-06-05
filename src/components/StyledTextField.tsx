import { styled } from '@mui/material/styles';
import TextField from '@mui/material/TextField';

export const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-notchedOutline': {
    borderRadius: 8,
    border: 'none',
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.text.primary
  }
}));
