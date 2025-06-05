import { styled } from '@mui/material/styles';
import Select from '@mui/material/Select';

export const StyledSelect = styled(Select)(({ theme }) => ({
  '& .MuiOutlinedInput-notchedOutline': {
    borderRadius: 8,
    border: 'none',
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.text.primary
  },
  '& .MuiSelect-select': {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    padding: theme.spacing(1.2, 1.5)
  }
}));
