import Box from '@mui/material/Box';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
  /**
   * Unique prefix so that ids don't collide when several tab sets are rendered
   * on the same page. Must match the prefix used for the corresponding <Tab>
   * elements (id={`${idPrefix}-tab-${index}`}).
   */
  idPrefix?: string;
}

export default function TabPanel(props: TabPanelProps) {
  const { children, value, index, idPrefix = 'simple', ...other } = props;
  const isActive = value === index;

  return (
    <div
      role="tabpanel"
      hidden={!isActive}
      id={`${idPrefix}-tabpanel-${index}`}
      aria-labelledby={`${idPrefix}-tab-${index}`}
      tabIndex={isActive ? 0 : undefined}
      {...other}
    >
      {isActive && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

/**
 * Helper to spread onto a <Tab> so it is programmatically associated with its
 * TabPanel. Usage: <Tab label="Supply" {...a11yTabProps('savings', 0)} />
 */
export function a11yTabProps(idPrefix: string, index: number) {
  return {
    id: `${idPrefix}-tab-${index}`,
    'aria-controls': `${idPrefix}-tabpanel-${index}`
  };
}
