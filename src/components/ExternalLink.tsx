import { FC, ReactNode } from 'react';
import Link from '@mui/material/Link';
import { IconExternalLink } from '@tabler/icons-react';
import { SxProps, Theme } from '@mui/material/styles';

interface ExternalLinkProps {
  href: string;
  /** Visible text. Omit together with `iconOnly` for an icon-only link. */
  children?: ReactNode;
  /** Accessible name. Required when the link is icon-only. */
  label?: string;
  iconOnly?: boolean;
  iconSize?: number;
  sx?: SxProps<Theme>;
}

/**
 * Accessible external link: always opens in a new tab with a screen-reader hint,
 * guarantees an accessible name (even for icon-only links) and safe rel.
 */
export const ExternalLink: FC<ExternalLinkProps> = ({ href, children, label, iconOnly = false, iconSize = 14, sx }) => {
  const accessibleName = label ?? (typeof children === 'string' ? children : undefined);

  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={accessibleName ? `${accessibleName} (opens in a new tab)` : undefined}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        textDecoration: 'none',
        color: 'inherit',
        ...sx
      }}
    >
      {!iconOnly && children}
      <IconExternalLink size={iconSize} aria-hidden />
    </Link>
  );
};

export default ExternalLink;
