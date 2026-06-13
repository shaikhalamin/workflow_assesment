import { Heading, Text } from '@react-email/components';
import type { BrandConfig } from './brand';
import { Block } from './components/block';
import { EmailShell } from './components/email-shell';
import { fonts, palette } from './theme';

export interface NotificationEmailProps {
  recipientEmail: string;
  title: string;
  message: string;
  brand: BrandConfig;
}

const heading = {
  margin: '0 0 14px',
  fontFamily: fonts.sans,
  fontSize: '24px',
  lineHeight: 1.25,
  fontWeight: 700,
  color: palette.ink,
} as const;

const body = {
  margin: 0,
  fontFamily: fonts.sans,
  fontSize: '15px',
  lineHeight: 1.6,
  color: palette.body,
} as const;

export function NotificationEmail({
  recipientEmail,
  title,
  message,
  brand,
}: NotificationEmailProps) {
  return (
    <EmailShell brand={brand} preview={title} recipientEmail={recipientEmail}>
      <Block padding="10px 40px 8px">
        <Heading as="h1" style={heading}>
          {title}
        </Heading>
        <Text style={body}>{message}</Text>
      </Block>
    </EmailShell>
  );
}
