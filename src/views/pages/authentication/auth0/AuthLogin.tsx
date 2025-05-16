import { useState } from 'react';

// material-ui
import Button from '@mui/material/Button';
import FormHelperText from '@mui/material/FormHelperText';
import Grid from '@mui/material/Grid';

// project imports
import AnimateButton from 'ui-component/extended/AnimateButton';
import useAuth from 'hooks/useAuth';
import useScriptRef from 'hooks/useScriptRef';

// assets
import LockIcon from '@mui/icons-material/Lock';

// ==============================|| AUTH0 - LOGIN ||============================== //

export default function Auth0Login({ ...others }) {
  const { loginAuth } = useAuth();
  const [error, setError] = useState(null);
  const scriptedRef = useScriptRef();

  const loginHandler = async () => {
    try {
      if (loginAuth) await loginAuth();
    } catch (err: any) {
      if (scriptedRef.current) {
        setError(err.message);
      }
    }
  };

  return (
    <div {...others}>
      <Grid container spacing={2} sx={{ justifyContent: 'center', alignItems: 'center' }}>
        {error && (
          <Grid size={12}>
            <FormHelperText error>{error}</FormHelperText>
          </Grid>
        )}

        <Grid size={12}>
          <AnimateButton>
            <Button onClick={loginHandler} variant="contained" fullWidth color="secondary">
              <LockIcon fontSize="small" sx={{ mr: 1, fontSize: '1rem' }} /> Log in with Auth0
            </Button>
          </AnimateButton>
        </Grid>
      </Grid>
    </div>
  );
}
