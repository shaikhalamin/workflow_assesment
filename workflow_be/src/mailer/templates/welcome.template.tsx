import { Heading, Text } from '@react-email/components';
import type { BrandConfig } from './brand';
import { Block } from './components/block';
import { CtaButton } from './components/cta-button';
import { EmailShell } from './components/email-shell';
import { fonts, palette } from './theme';

export interface WelcomeProps {
  name: string;
  recipientEmail: string;
  brand: BrandConfig;
}

const h1 = {
  margin: '0 0 14px',
  fontFamily: fonts.sans,
  fontSize: '29px',
  lineHeight: 1.18,
  fontWeight: 700,
  color: palette.ink,
} as const;
const lead = {
  margin: 0,
  fontFamily: fonts.sans,
  fontSize: '15px',
  lineHeight: 1.6,
  color: palette.body,
} as const;

export function Welcome({ name, recipientEmail, brand }: WelcomeProps) {
  return (
    <EmailShell
      brand={brand}
      preview="Welcome to Fiber@Home Workflow"
      recipientEmail={recipientEmail}
    >
      <Block padding="10px 40px 8px">
        <Heading as="h1" className="h1" style={h1}>
          Welcome to Fiber@Home Workflow
        </Heading>
        <Text style={lead}>
          Hi {name}, your account is ready. You can now sign in and start using
          the workflow system.
        </Text>
      </Block>
      <CtaButton href={brand.appUrl}>Open Workflow</CtaButton>
    </EmailShell>
  );
}
