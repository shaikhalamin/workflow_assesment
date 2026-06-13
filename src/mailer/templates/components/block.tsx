import type { CSSProperties, ReactNode } from 'react';

export interface BlockProps {
  children?: ReactNode;
  padding?: CSSProperties['padding'];
}

export function Block({ children, padding = '8px 40px' }: BlockProps) {
  return (
    <tr>
      <td className="px" style={{ padding }}>
        {children}
      </td>
    </tr>
  );
}
