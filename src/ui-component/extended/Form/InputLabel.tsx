// material-ui
import { styled } from '@mui/material/styles';
import MuiInputLabel, { InputLabelProps } from '@mui/material/InputLabel';

const BInputLabel = styled((props: MUIInputLabelProps) => <MuiInputLabel {...props} />, {
  shouldForwardProp: (prop) => prop !== 'horizontal'
})<{ horizontal: boolean }>(({ theme, horizontal }) => ({
  color: theme.palette.text.primary,
  fontWeight: 500,
  marginBottom: horizontal ? 0 : 8
}));

interface MUIInputLabelProps extends InputLabelProps {
  horizontal?: boolean;
}

export default function InputLabel({ children, horizontal = false, ...others }: MUIInputLabelProps) {
  return (
    <BInputLabel horizontal={horizontal} {...others}>
      {children}
    </BInputLabel>
  );
}
