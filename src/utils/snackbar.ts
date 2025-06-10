import { dispatch } from '../store';
import { openSnackbar } from '../store/slices/snackbar';

/**
 * Dispatch a success snackbar notification
 * @param message The message to display in the snackbar
 */
export const dispatchSuccess = (message: string) => {
  dispatch(
    openSnackbar({
      open: true,
      message,
      variant: 'alert',
      alert: { color: 'success' },
      anchorOrigin: { vertical: 'top', horizontal: 'center' },
      severity: 'success'
    })
  );
};

/**
 * Dispatch an error snackbar notification
 * @param message The message to display in the snackbar
 */
export const dispatchError = (message: string) => {
  dispatch(
    openSnackbar({
      open: true,
      message,
      variant: 'alert',
      alert: { color: 'error' },
      anchorOrigin: { vertical: 'top', horizontal: 'center' },
      severity: 'error'
    })
  );
};

/**
 * Dispatch an info snackbar notification
 * @param message The message to display in the snackbar
 */
export const dispatchInfo = (message: string) => {
  dispatch(
    openSnackbar({
      open: true,
      message,
      variant: 'alert',
      alert: { color: 'info' },
      anchorOrigin: { vertical: 'top', horizontal: 'center' },
      severity: 'info'
    })
  );
};

/**
 * Dispatch a warning snackbar notification
 * @param message The message to display in the snackbar
 */
export const dispatchWarning = (message: string) => {
  dispatch(
    openSnackbar({
      open: true,
      message,
      variant: 'alert',
      alert: { color: 'warning' },
      anchorOrigin: { vertical: 'top', horizontal: 'center' },
      severity: 'warning'
    })
  );
};
