import { Body, Head, Html, Preview } from '@react-email/components';
import type { ReactNode } from 'react';
import type { BrandConfig } from '../brand';
import { fonts, headStyles, palette } from '../theme';

export interface EmailShellProps {
  brand: BrandConfig;
  preview: string;
  recipientEmail: string;
  children?: ReactNode;
}

const outerTable = { background: palette.bg, width: '100%' } as const;
const outerCell = { padding: '32px 16px' } as const;
const card = {
  width: '600px',
  maxWidth: '600px',
  background: palette.card,
  border: `1px solid ${palette.border}`,
  borderRadius: '10px',
  overflow: 'hidden',
} as const;
const brandCell = {
  padding: '22px 40px 16px',
  fontFamily: fonts.sans,
  fontSize: '17px',
  fontWeight: 700,
  color: palette.ink,
} as const;
const footerCell = {
  padding: '22px 40px 28px',
  fontFamily: fonts.sans,
  fontSize: '11px',
  lineHeight: 1.6,
  color: palette.muted,
} as const;
const footerLink = {
  color: palette.accent,
  textDecoration: 'underline',
} as const;

export function EmailShell({
  brand,
  preview,
  recipientEmail,
  children,
}: EmailShellProps) {
  return (
    <Html lang="en">
      <Head>
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="x-apple-disable-message-reformatting" />
        <style>{headStyles}</style>
      </Head>
      <Preview>{preview}</Preview>
      <Body style={{ margin: 0, padding: 0, background: palette.bg }}>
        <table
          role="presentation"
          width="100%"
          cellPadding={0}
          cellSpacing={0}
          border={0}
          style={outerTable}
        >
          <tbody>
            <tr>
              <td align="center" style={outerCell}>
                <table
                  role="presentation"
                  className="container"
                  width="600"
                  cellPadding={0}
                  cellSpacing={0}
                  border={0}
                  style={card}
                >
                  <tbody>
                    <tr>
                      <td
                        style={{
                          height: '4px',
                          background: palette.accent,
                          fontSize: 0,
                          lineHeight: 0,
                        }}
                      />
                    </tr>
                    <tr>
                      <td className="px" style={brandCell}>
                        Fiber@Home Workflow
                      </td>
                    </tr>
                    {children}
                    <tr>
                      <td className="px" style={footerCell}>
                        Sent to {recipientEmail}.
                        <br />
                        {brand.companyAddress}
                        <br />
                        <a
                          href={`mailto:${brand.supportEmail}`}
                          style={footerLink}
                        >
                          Support
                        </a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </Body>
    </Html>
  );
}
