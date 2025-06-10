import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { Typography, Alert } from '@mui/material';
import { useAccount } from 'wagmi';
import HandlePosition from './stake/HandlePosition';
import Positions from './stake/Positions';
import { StakingPosition } from '../../../types/staking';

export default function StakeTab() {
  const { address } = useAccount();
  const [showNewPosition, setShowNewPosition] = useState(false);
  const [editingPosition, setEditingPosition] = useState<StakingPosition | null>(null);

  const handleOpenNewPosition = () => {
    setEditingPosition(null);
    setShowNewPosition(true);
  };

  const handleEditPosition = (position: StakingPosition) => {
    setEditingPosition(position);
    setShowNewPosition(true);
  };

  const handleBackToPositions = () => {
    setEditingPosition(null);
    setShowNewPosition(false);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h2" gutterBottom>
        Staking Engine
      </Typography>

      {!address && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Please connect your wallet to continue with staking.
        </Alert>
      )}

      {!showNewPosition ? (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h4"></Typography>
            <Button variant="contained" color="primary" onClick={handleOpenNewPosition} disabled={!address}>
              Open New Position
            </Button>
          </Box>
          <Positions onEditPosition={handleEditPosition} />
        </>
      ) : (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h4">
              {editingPosition ? 'Edit Position #' + Number(Number(editingPosition.indexPosition) + 1) : 'Create New Position'}
            </Typography>
            <Button variant="outlined" color="primary" onClick={handleBackToPositions}>
              Back to Positions
            </Button>
          </Box>
          <HandlePosition editMode={!!editingPosition} positionData={editingPosition} />
        </>
      )}
    </Box>
  );
}
