import type { ReactNode } from 'react';
import { fonts, palette } from '../theme';

export interface CtaButtonProps {
  href: string;
  children?: ReactNode;
}

const outerCell = { padding: '22px 40px 10px' } as const;
const buttonCell = {
  backgroundColor: palette.accent,
  borderRadius: '8px',
} as const;
const anchor = {
  display: 'inline-block',
  padding: '14px 24px',
  fontFamily: fonts.sans,
  fontSize: '14px',
  fontWeight: 600,
  color: '#ffffff',
  textDecoration: 'none',
} as const;

export function CtaButton({ href, children }: CtaButtonProps) {
  return (
    <tr>
      <td className="px" style={outerCell}>
        <table
          role="presentation"
          className="btn"
          cellPadding={0}
          cellSpacing={0}
          border={0}
        >
          <tbody>
            <tr>
              <td style={buttonCell}>
                <a href={href} target="_blank" rel="noreferrer" style={anchor}>
                  {children}
                </a>
              </td>
            </tr>
          </tbody>
        </table>
      </td>
    </tr>
  );
}
