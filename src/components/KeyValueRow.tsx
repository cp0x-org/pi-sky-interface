import { FC, ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { SxProps, Theme } from '@mui/material/styles';

interface KeyValueRowProps {
  label: ReactNode;
  children: ReactNode;
  /** Show a bottom divider (default true). */
  divider?: boolean;
  sx?: SxProps<Theme>;
}

/**
 * A label/value pair rendered as a description-list entry so screen readers and
 * AI agents can programmatically associate the term with its value.
 */
export const KeyValueRow: FC<KeyValueRowProps> = ({ label, children, divider = true, sx }) => {
  return (
    <Box
      component="dl"
      sx={{
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 2,
        m: 0,
        ...(divider && {
          borderBottom: '1px solid',
          borderColor: 'divider',
          pb: 1
        }),
        ...sx
      }}
    >
      <Typography component="dt" color="text.secondary" variant="body2" sx={{ m: 0 }}>
        {label}
      </Typography>
      <Typography component="dd" variant="h6" sx={{ m: 0 }}>
        {children}
      </Typography>
    </Box>
  );
};

export default KeyValueRow;
