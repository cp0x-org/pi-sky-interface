import { FC } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { IconExternalLink } from '@tabler/icons-react';
import { useConfigChainId } from '../../../../hooks/useConfigChainId';
import { ReactComponent as SkyLogo } from 'assets/images/sky/ethereum/sky.svg';
import { Chip, Divider, Alert } from '@mui/material';
import { shortenAddress } from '../../../../utils/formatters';

interface ConfirmProps {
  stakeData: {
    amount: string;
    rewardAddress: string;
    delegatorAddress: string;
  };
  isApproved: boolean;
  isStaked: boolean;
  allowanceData?: bigint;
  allowance?: bigint;
  editMode?: boolean;
  positionId?: string | null;
}

const Confirm: FC<ConfirmProps> = ({ stakeData, isApproved, isStaked, allowanceData }) => {
  const { config: skyConfig } = useConfigChainId();
  const contractAddress = skyConfig.contracts.LockStakeEngine;

  return (
    <>
      <Card sx={{ borderRadius: '20px', my: 2 }}>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              width: '100%',
              alignItems: 'center',
              flexDirection: {
                xs: 'column',
                sm: 'row'
              },
              gap: 2,
              mb: 2
            }}
          >
            <Box
              component="a"
              href={`https://etherscan.io/address/${contractAddress}`}
              target="_blank"
              rel="noreferrer"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                textDecoration: 'none',
                color: 'inherit',
                width: { xs: '100%', sm: 'auto' },
                justifyContent: { xs: 'center', sm: 'flex-start' }
              }}
            >
              View contract
              <IconExternalLink size={14} />
            </Box>

            <Box sx={{ textAlign: { xs: 'center', sm: 'right' } }}>
              <Typography color="text.secondary" variant="body2">
                Stake Engine
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.75rem', opacity: 0.6 }}>
                {shortenAddress(contractAddress)}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography variant="h6" gutterBottom>
            Staking Position Summary
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography color="text.secondary">Amount to Stake:</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <SkyLogo width="20" height="20" style={{ marginRight: '8px' }} />
              <Typography>{stakeData.amount} SKY</Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography color="text.secondary">Reward Address:</Typography>
            <Typography
              variant="body2"
              sx={{
                maxWidth: '250px',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {shortenAddress(stakeData.rewardAddress)}
            </Typography>
          </Box>

          {stakeData.delegatorAddress && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography color="text.secondary">Delegate Address:</Typography>
              <Typography
                variant="body2"
                sx={{
                  maxWidth: '250px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {shortenAddress(stakeData.delegatorAddress)}
              </Typography>
            </Box>
          )}

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography color="text.secondary">Transaction Status:</Typography>
            <Box>
              <Box sx={{ mb: 2 }}>
                {isApproved ? (
                  <Chip label="Tokens Approved" color="success" size="small" sx={{ mr: 1 }} />
                ) : (
                  <Chip label="Approval Required" color="warning" size="small" sx={{ mr: 1 }} />
                )}
              </Box>
              <Box>
                {isStaked ? (
                  <Chip label="Staking Complete" color="success" size="small" />
                ) : (
                  <Chip label="Pending Confirmation" color="default" size="small" />
                )}
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {!isApproved && (
        <Alert severity="info" sx={{ mb: 2 }}>
          First, you need to approve SKY tokens to be used by the staking contract.
        </Alert>
      )}

      {isApproved && !isStaked && <Alert severity="info">Now you can confirm your staking position.</Alert>}

      {isStaked && <Alert severity="success">Congratulations! Your staking position has been successfully created.</Alert>}
    </>
  );
};

export default Confirm;
