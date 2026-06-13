import { renderEmail } from './index';

describe('notification email template', () => {
  it('renders the notification title and message', async () => {
    const result = await renderEmail(
      {
        template: 'notification',
        props: {
          recipientEmail: 'manager@example.com',
          title: 'Workflow task assigned',
          message: 'Expense needs approval',
        },
      },
      {
        appUrl: 'https://workflow.example.com',
        companyAddress: 'Fiber@Home Ltd.',
        supportEmail: 'support@fiberathome.net',
      },
    );

    expect(result.html).toContain('Workflow task assigned');
    expect(result.html).toContain('Expense needs approval');
    expect(result.text).toContain('Workflow task assigned');
    expect(result.text).toContain('Expense needs approval');
  });
});
