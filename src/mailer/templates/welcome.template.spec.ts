import { renderEmail } from './index';

describe('welcome email template', () => {
  it('renders html and text for the welcome email', async () => {
    const result = await renderEmail(
      {
        template: 'welcome',
        props: {
          name: 'Demo Employee',
          recipientEmail: 'employee@example.com',
        },
      },
      {
        appUrl: 'https://workflow.example.com',
        companyAddress: 'Fiber@Home Ltd.',
        supportEmail: 'support@fiberathome.net',
      },
    );

    expect(result.html).toContain('Welcome to Fiber@Home Workflow');
    expect(result.html).toContain('Demo Employee');
    expect(result.text).toContain('Welcome to Fiber@Home Workflow');
    expect(result.text).toContain('https://workflow.example.com');
  });
});
