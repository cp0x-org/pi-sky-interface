// material-ui
import { Theme } from '@mui/material/styles';

// third party
import { merge } from 'lodash-es';

// project imports
import Chip from './Chip';

// ===============================||  OVERRIDES - MAIN  ||=============================== //

export default function ComponentsOverrides(theme: Theme) {
  return merge(Chip(theme));
}
