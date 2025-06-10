import { Stack, Box, Typography, Link } from '@mui/material';
import { ReactComponent as Cp0xLogo } from 'assets/images/sky/cp0x-logo.svg';

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        width: '100%',
        borderTop: '1px solid',
        borderColor: 'divider',
        py: 2,
        mt: 'auto',
        flexDirection: { xs: 'column', md: 'row' }
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        sx={{
          width: '100%',
          maxWidth: '1280px',
          mx: 'auto',
          px: 3,
          alignItems: { xs: 'center', md: 'center' },
          justifyContent: 'space-between',
          gap: { xs: 2, md: 0 }
        }}
      >
        <Link href="/" className="logo-wrapper" sx={{ textDecoration: 'none', mb: { xs: 1, md: 0 } }}>
          <Cp0xLogo style={{ width: 70, height: 'auto' }} />
        </Link>
        <Box
          className="wallet"
          sx={{
            display: 'flex',
            gap: 1,
            width: { xs: '100%', md: 'auto' },
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'center', md: 'center' }
          }}
        >
          <Typography
            component="span"
            className="label"
            sx={{
              fontWeight: 500,
              color: 'text.secondary'
            }}
          >
            ETH:
          </Typography>
          <Typography
            component="span"
            className="address"
            sx={{
              fontWeight: 400,
              fontSize: '0.875rem'
            }}
          >
            0x4c82cfF7398f3D43b36e41B10fF6F42b14DD9385
          </Typography>
        </Box>

        <Box
          className="wallet"
          sx={{
            display: 'flex',
            gap: 1,
            width: { xs: '100%', md: 'auto' },
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'center', md: 'center' }
          }}
        >
          <Typography
            component="span"
            className="label"
            sx={{
              fontWeight: 500,
              color: 'text.secondary'
            }}
          >
            BTC:
          </Typography>
          <Typography
            component="span"
            className="address"
            sx={{
              fontWeight: 400,
              fontSize: '0.875rem'
            }}
          >
            3G38fhKSPVfEWQ3GdrfAYjz8VgPfd5LHBm
          </Typography>
        </Box>
        <Box
          className="actions"
          sx={{
            display: 'flex',
            gap: 2,
            alignItems: 'center',
            justifyContent: { xs: 'center', md: 'center' },
            width: { xs: '100%', md: 'auto' },
            mt: { xs: 1, md: 0 }
          }}
        >
          <Link
            href="https://t.me/cp0xdotcom"
            target="_blank"
            className="social-icon"
            sx={{
              color: 'text.secondary',
              '&:hover': { color: 'primary.main' }
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M9.633 14.8632L9.227 19.8558C9.767 19.8558 10.003 19.6218 10.288 19.3378L12.793 16.9498L17.729 20.5378C18.705 21.0858 19.397 20.7978 19.662 19.8838L22.944 5.0838L22.945 5.0818C23.255 3.9318 22.426 3.3458 21.475 3.7098L2.36599 11.0578C1.24299 11.6058 1.26699 12.3938 2.17499 12.7578L7.20799 14.2628L18.392 7.1318C18.973 6.7478 19.505 6.9598 19.068 7.3438L9.633 14.8632Z"
                fill="currentColor"
              />
            </svg>
          </Link>

          <Link
            href="https://twitter.com/cp0xdotcom"
            target="_blank"
            className="social-icon"
            sx={{
              color: 'text.secondary',
              '&:hover': { color: 'primary.main' }
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M18.244 2.25H21.552L14.325 10.51L22.827 21.75H16.17L10.956 14.933L4.99 21.75H1.68L9.41 12.915L1.254 2.25H8.08L12.793 8.481L18.244 2.25ZM17.083 19.77H18.916L7.084 4.126H5.117L17.083 19.77Z"
                fill="currentColor"
              />
            </svg>
          </Link>

          <Link
            href="https://github.com/cp0x-org"
            target="_blank"
            className="social-icon"
            sx={{
              color: 'text.secondary',
              '&:hover': { color: 'primary.main' }
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 100 100"
              fill="none"
              preserveAspectRatio="xMidYMid meet"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"
                fill="currentColor"
              />
            </svg>
          </Link>
        </Box>
      </Stack>
    </Box>
  );
}
