import { FC } from 'react';
import Box from '@mui/material/Box';

// Visually hidden but available to assistive tech (mirrors @mui/utils visuallyHidden).
// Note: use px strings — in MUI `sx`, numeric width/height between 0 and 1 are
// treated as percentages (1 => 100%), which would make this fill the viewport.
const visuallyHidden = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0
} as const;

interface StatusLiveProps {
  /** Current status message; announced to screen readers when it changes. */
  message: string;
  /** 'polite' (default) for progress, 'assertive' for errors. */
  assertive?: boolean;
}

/**
 * Visually hidden live region. Mirror a dynamic status here (e.g. a button label
 * that changes between "Approving…", "Success!", "Failed") so screen readers are
 * notified even when focus is not on the element that changed.
 */
export const StatusLive: FC<StatusLiveProps> = ({ message, assertive = false }) => {
  return (
    <Box component="span" role="status" aria-live={assertive ? 'assertive' : 'polite'} sx={visuallyHidden}>
      {message}
    </Box>
  );
};

export default StatusLive;
