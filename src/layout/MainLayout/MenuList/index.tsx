import { memo } from 'react';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
// project imports
import NavItem from './NavItem';
// ==============================|| SIDEBAR MENU LIST ||============================== //

function MenuList() {
  return (
    <>
      <List key={0}>
        <NavItem item={{ link: 'http://google.com', title: 'TITLE' }} level={1} />
        <Divider sx={{ py: 0.5 }} />
      </List>
    </>
  );
}

export default memo(MenuList);
