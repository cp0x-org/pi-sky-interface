import { ConnectButton } from '@rainbow-me/rainbowkit';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import '@rainbow-me/rainbowkit/styles.css';
// Styled wrapper for the ConnectButton
const StyledConnectButtonWrapper = styled(Box)(({ theme }) => ({
  '& button': {
    fontFamily: theme.typography.fontFamily,
    fontWeight: 500,
    borderRadius: `${theme.shape.borderRadius}px`,
    transition: 'all 0.2s ease-in-out',
  }
}));

interface ConnectButtonCustomProps {
  showBalance?: boolean;
  chainStatus?: 'full' | 'icon' | 'name' | 'none';
  accountStatus?: 'full' | 'avatar' | 'address' | 'none';
  label?: string;
}

const ConnectButtonCustom = ({ 
  showBalance = false, 
  chainStatus = 'icon',
  accountStatus = 'full',
  label = 'Connect Wallet'
}: ConnectButtonCustomProps) => {
  return (
    <StyledConnectButtonWrapper>
      <ConnectButton 
        chainStatus={chainStatus}
        showBalance={showBalance}
        label={label}
      />
    </StyledConnectButtonWrapper>
  );
};

export default ConnectButtonCustom;
