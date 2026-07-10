import { FC } from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import { SxProps, Theme } from '@mui/material/styles';

interface LoadingIndicatorProps {
  /** Accessible label / visible caption for the loading state. */
  label: string;
  /** Hide the visible caption but keep it available to screen readers. */
  hideLabel?: boolean;
  size?: number;
  /** Layout direction of spinner + caption (default 'column'). */
  direction?: 'row' | 'column';
  sx?: SxProps<Theme>;
}

/**
 * Accessible loading indicator: exposes a status role + label so screen readers
 * and AI agents can perceive the busy state instead of an unlabelled spinner.
 */
export const LoadingIndicator: FC<LoadingIndicatorProps> = ({ label, hideLabel = false, size, direction = 'column', sx }) => {
  return (
    <Box role="status" aria-live="polite" sx={{ display: 'flex', flexDirection: direction, alignItems: 'center', gap: 1, ...sx }}>
      <CircularProgress size={size} aria-label={hideLabel ? label : undefined} />
      {!hideLabel && (
        <Typography variant="body2" sx={{ mt: direction === 'column' ? 1 : 0 }}>
          {label}
        </Typography>
      )}
    </Box>
  );
};

export default LoadingIndicator;
