import { FC } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { useConfigChainId } from 'hooks/useConfigChainId';
import { Chip, Divider, Alert } from '@mui/material';
import { shortenAddress } from 'utils/formatters';
import ExternalLink from 'components/ExternalLink';
import { formatUSDS } from 'utils/sky';
import { useTheme } from '@mui/material/styles';
import { FormattedMessage, useIntl } from 'react-intl';

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
  originalAmount?: string | null;
}

const Confirm: FC<ConfirmProps> = ({ stakeData, isApproved, isStaked, originalAmount }) => {
  const { config: skyConfig } = useConfigChainId();
  const contractAddress = skyConfig.contracts.LockStakeEngine;
  const theme = useTheme();
  const intl = useIntl();
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
            <ExternalLink
              href={`https://etherscan.io/address/${contractAddress}`}
              label={intl.formatMessage({ id: 'stake.viewStakingContract' })}
              sx={{
                width: { xs: '100%', sm: 'auto' },
                justifyContent: { xs: 'center', sm: 'flex-start' }
              }}
            >
              {intl.formatMessage({ id: 'common.viewContract' })}
            </ExternalLink>

            <Box sx={{ textAlign: { xs: 'center', sm: 'right' } }}>
              <Typography color="text.secondary" variant="body2">
                <FormattedMessage id="stake.stakeEngine" />
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.75rem', opacity: 0.6 }}>
                {shortenAddress(contractAddress)}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography variant="h6" gutterBottom>
            <FormattedMessage id="stake.positionSummary" />
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography color="text.secondary">
              <FormattedMessage id="stake.amountToStake" />
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
              <Typography>{formatUSDS(stakeData.amount)} SKY</Typography>
            </Box>
          </Box>

          {originalAmount && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography color="text.secondary">
                <FormattedMessage id="stake.newTotalAmountLabel" />
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
                {formatUSDS(Number(stakeData.amount) + Number(originalAmount))} SKY
              </Box>
            </Box>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography color="text.secondary">
              <FormattedMessage id="stake.rewardAddress" />
            </Typography>
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
              <Typography color="text.secondary">
                <FormattedMessage id="stake.delegateAddress" />
              </Typography>
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
            <Typography color="text.secondary">
              <FormattedMessage id="stake.transactionStatus" />
            </Typography>
            <Box>
              <Box sx={{ mb: 2 }}>
                {isApproved ? (
                  <Chip label={intl.formatMessage({ id: 'stake.tokensApproved' })} color="success" size="small" sx={{ mr: 1 }} />
                ) : (
                  <Chip label={intl.formatMessage({ id: 'stake.approvalRequired' })} color="warning" size="small" sx={{ mr: 1 }} />
                )}
              </Box>
              <Box>
                {isStaked ? (
                  <Chip label={intl.formatMessage({ id: 'stake.stakingComplete' })} color="success" size="small" />
                ) : (
                  <Chip label={intl.formatMessage({ id: 'stake.pendingConfirmation' })} color="default" size="small" />
                )}
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {!isApproved && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <FormattedMessage id="stake.approveFirst" />
        </Alert>
      )}

      {isApproved && !isStaked && stakeData.amount != '' && stakeData.amount != '0' && (
        <Alert severity="info">
          <FormattedMessage id="stake.canConfirmPosition" />
        </Alert>
      )}

      {isApproved && !isStaked && (stakeData.amount == '' || stakeData.amount == '0') && (
        <Alert severity="info">
          <FormattedMessage id="stake.noAmountChanges" />
        </Alert>
      )}

      {isStaked && (
        <Alert severity="success" sx={{ color: theme.palette.success.main }}>
          <FormattedMessage id="stake.positionCreated" />
        </Alert>
      )}
    </>
  );
};

export default Confirm;
