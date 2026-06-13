import { BillingRequestStatus } from '../billing/entities/billing-request.entity';
import { ExpenseStatus } from '../expenses/entities/expense.entity';
import { InvoiceStatus } from '../invoices/entities/invoice.entity';
import { LeaveRequestStatus } from '../leaves/entities/leave-request.entity';
import { PaymentRequestStatus } from '../payments/entities/payment-request.entity';
import { WorkflowInstanceStatus } from './enums/workflow-runtime.enums';
import { OutcomeHandlerService } from './outcome-handler.service';

type CreatedInvoiceInput = {
  status: InvoiceStatus;
  paidAt: Date | null;
};

describe('OutcomeHandlerService', () => {
  it('does not create a payment request when an expense workflow outcome disables it', async () => {
    const expense = {
      id: 'expense-1',
      requesterId: 'requester-1',
      amount: 2500,
      currency: 'BDT',
      status: ExpenseStatus.UNDER_REVIEW,
      approvedAt: null,
    };
    const expensesRepository = {
      findOneBy: jest.fn().mockResolvedValue(expense),
      save: jest.fn().mockResolvedValue(expense),
    };
    const paymentsRepository = {
      findOneBy: jest.fn(),
      create: jest.fn().mockReturnValue({ id: 'payment-1' }),
      save: jest.fn().mockResolvedValue({ id: 'payment-1' }),
    };
    const leavesRepository = {};
    const billingRequestsRepository = {};
    const invoicesRepository = {};
    const notificationsService = {
      createPaymentCreated: jest.fn(),
    };
    const auditLogsService = {};
    const service = new OutcomeHandlerService(
      expensesRepository as never,
      paymentsRepository as never,
      leavesRepository as never,
      billingRequestsRepository as never,
      invoicesRepository as never,
      notificationsService as never,
      auditLogsService as never,
    );

    await service.handleApproved(
      {
        id: 'workflow-1',
        entityType: 'Expense',
        entityId: 'expense-1',
        status: WorkflowInstanceStatus.APPROVED,
      } as never,
      { createPaymentRequest: false },
    );

    expect(expensesRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: ExpenseStatus.APPROVED,
      }),
    );
    expect(paymentsRepository.findOneBy).not.toHaveBeenCalled();
    expect(paymentsRepository.create).not.toHaveBeenCalled();
    expect(notificationsService.createPaymentCreated).not.toHaveBeenCalled();
  });

  it('creates a payment request when an expense workflow outcome enables it', async () => {
    const expense = {
      id: 'expense-1',
      requesterId: 'requester-1',
      amount: 2500,
      currency: 'BDT',
      status: ExpenseStatus.UNDER_REVIEW,
      approvedAt: null,
    };
    const payment = { id: 'payment-1' };
    const expensesRepository = {
      findOneBy: jest.fn().mockResolvedValue(expense),
      save: jest.fn().mockResolvedValue(expense),
    };
    const paymentsRepository = {
      findOneBy: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockReturnValue(payment),
      save: jest.fn().mockResolvedValue(payment),
    };
    const leavesRepository = {};
    const billingRequestsRepository = {};
    const invoicesRepository = {};
    const notificationsService = {
      createPaymentCreated: jest.fn(),
    };
    const auditLogsService = {};
    const service = new OutcomeHandlerService(
      expensesRepository as never,
      paymentsRepository as never,
      leavesRepository as never,
      billingRequestsRepository as never,
      invoicesRepository as never,
      notificationsService as never,
      auditLogsService as never,
    );

    await service.handleApproved(
      {
        id: 'workflow-1',
        entityType: 'Expense',
        entityId: 'expense-1',
        status: WorkflowInstanceStatus.APPROVED,
      } as never,
      { createPaymentRequest: true },
    );

    expect(expensesRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: ExpenseStatus.PAYMENT_PENDING,
      }),
    );
    expect(paymentsRepository.create).toHaveBeenCalledWith({
      expenseId: 'expense-1',
      requesterId: 'requester-1',
      amount: 2500,
      currency: 'BDT',
      status: PaymentRequestStatus.PENDING,
    });
    expect(notificationsService.createPaymentCreated).toHaveBeenCalledWith({
      entityType: 'PaymentRequest',
      entityId: 'payment-1',
      workflowInstanceId: 'workflow-1',
      recipientRoleSlug: 'accounts-officer',
      channels: { push: true, email: true },
    });
  });

  it('does not approve or create payment for a cancelled expense', async () => {
    const expense = {
      id: 'expense-1',
      requesterId: 'requester-1',
      amount: 2500,
      currency: 'BDT',
      status: ExpenseStatus.CANCELLED,
      approvedAt: null,
    };
    const expensesRepository = {
      findOneBy: jest.fn().mockResolvedValue(expense),
      save: jest.fn(),
    };
    const paymentsRepository = {
      findOneBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    const notificationsService = {
      createPaymentCreated: jest.fn(),
    };
    const service = new OutcomeHandlerService(
      expensesRepository as never,
      paymentsRepository as never,
      {} as never,
      {} as never,
      {} as never,
      notificationsService as never,
      {} as never,
    );

    await service.handleApproved(
      {
        id: 'workflow-1',
        entityType: 'Expense',
        entityId: 'expense-1',
        status: WorkflowInstanceStatus.APPROVED,
      } as never,
      { createPaymentRequest: true },
    );

    expect(expensesRepository.save).not.toHaveBeenCalled();
    expect(paymentsRepository.findOneBy).not.toHaveBeenCalled();
    expect(paymentsRepository.create).not.toHaveBeenCalled();
    expect(paymentsRepository.save).not.toHaveBeenCalled();
    expect(notificationsService.createPaymentCreated).not.toHaveBeenCalled();
  });

  it('does not approve a cancelled leave request', async () => {
    const leave = {
      id: 'leave-1',
      status: LeaveRequestStatus.CANCELLED,
      approvedAt: null,
      approvedPeriodJson: null,
    };
    const leavesRepository = {
      findOneBy: jest.fn().mockResolvedValue(leave),
      save: jest.fn(),
    };
    const service = new OutcomeHandlerService(
      {} as never,
      {} as never,
      leavesRepository as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );

    await service.handleApproved({
      id: 'workflow-1',
      entityType: 'LeaveRequest',
      entityId: 'leave-1',
      status: WorkflowInstanceStatus.APPROVED,
    } as never);

    expect(leavesRepository.save).not.toHaveBeenCalled();
  });

  it('does not reject a cancelled expense', async () => {
    const expense = {
      id: 'expense-1',
      status: ExpenseStatus.CANCELLED,
      rejectionReason: null,
      rejectedAt: null,
    };
    const expensesRepository = {
      findOneBy: jest.fn().mockResolvedValue(expense),
      save: jest.fn(),
    };
    const service = new OutcomeHandlerService(
      expensesRepository as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );

    await service.handleRejected(
      {
        id: 'workflow-1',
        entityType: 'Expense',
        entityId: 'expense-1',
        status: WorkflowInstanceStatus.REJECTED,
      } as never,
      'Missing receipt',
    );

    expect(expensesRepository.save).not.toHaveBeenCalled();
  });

  it('does not reject a cancelled leave request', async () => {
    const leave = {
      id: 'leave-1',
      status: LeaveRequestStatus.CANCELLED,
      rejectionReason: null,
      rejectedAt: null,
    };
    const leavesRepository = {
      findOneBy: jest.fn().mockResolvedValue(leave),
      save: jest.fn(),
    };
    const service = new OutcomeHandlerService(
      {} as never,
      {} as never,
      leavesRepository as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );

    await service.handleRejected(
      {
        id: 'workflow-1',
        entityType: 'LeaveRequest',
        entityId: 'leave-1',
        status: WorkflowInstanceStatus.REJECTED,
      } as never,
      'Insufficient balance',
    );

    expect(leavesRepository.save).not.toHaveBeenCalled();
  });

  it('creates one invoice for an approved billing workflow and reuses it on repeated handling', async () => {
    const billingRequest = {
      id: 'billing-1',
      requesterId: 'requester-1',
      departmentId: 'dept-1',
      customerName: 'ACME Bangladesh Ltd.',
      customerEmail: 'billing@acme.example',
      customerAddress: 'Dhaka',
      title: 'Enterprise installation',
      description: 'Install service',
      amount: '125000',
      currency: 'BDT',
      status: BillingRequestStatus.UNDER_REVIEW,
      invoiceId: null,
      approvedAt: null,
      rejectionReason: 'PO missing',
    };
    const invoice = {
      id: 'invoice-1',
      billingRequestId: 'billing-1',
      invoiceNumber: 'INV-20260612-0001',
      status: InvoiceStatus.ISSUED,
    };
    let createdInvoiceInput: CreatedInvoiceInput | null = null;
    const expensesRepository = {};
    const paymentsRepository = {};
    const leavesRepository = {};
    const billingRequestsRepository = {
      findOneBy: jest.fn().mockResolvedValue(billingRequest),
      save: jest.fn().mockImplementation((value) => Promise.resolve(value)),
    };
    const invoicesRepository = {
      findOneBy: jest
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValue(invoice),
      countBy: jest.fn().mockResolvedValue(0),
      create: jest.fn((value: CreatedInvoiceInput) => {
        createdInvoiceInput = value;
        return invoice;
      }),
      save: jest.fn().mockResolvedValue(invoice),
    };
    const notificationsService = {
      createBillingApproved: jest.fn(),
      createInvoiceCreated: jest.fn(),
    };
    const auditLogsService = {
      record: jest.fn().mockResolvedValue(undefined),
    };
    const service = new OutcomeHandlerService(
      expensesRepository as never,
      paymentsRepository as never,
      leavesRepository as never,
      billingRequestsRepository as never,
      invoicesRepository as never,
      notificationsService as never,
      auditLogsService as never,
    );
    const instance = {
      id: 'workflow-1',
      entityType: 'BillingRequest',
      entityId: 'billing-1',
      status: WorkflowInstanceStatus.APPROVED,
    } as never;
    const actions = {
      actions: [{ type: 'MARK_BILLING_APPROVED' }, { type: 'CREATE_INVOICE' }],
    };

    await service.handleApproved(instance, actions);
    await service.handleApproved(instance, actions);

    expect(invoicesRepository.create).toHaveBeenCalledTimes(1);
    expect(createdInvoiceInput?.status).toBe(InvoiceStatus.PAID);
    expect(createdInvoiceInput?.paidAt).toBeInstanceOf(Date);
    expect(invoicesRepository.save).toHaveBeenCalledTimes(1);
    expect(billingRequest.status).toBe(BillingRequestStatus.INVOICED);
    expect(billingRequest.invoiceId).toBe('invoice-1');
    expect(notificationsService.createInvoiceCreated).toHaveBeenCalledWith(
      expect.objectContaining({
        entityId: 'invoice-1',
        workflowInstanceId: 'workflow-1',
        channels: { push: true, email: true },
      }),
    );
  });

  it('creates an invoice for a billing workflow saved with the legacy createInvoice flag', async () => {
    const billingRequest = {
      id: 'billing-1',
      requesterId: 'requester-1',
      departmentId: 'dept-1',
      customerName: 'ACME Bangladesh Ltd.',
      customerEmail: 'billing@acme.example',
      customerAddress: 'Dhaka',
      title: 'Enterprise installation',
      description: 'Install service',
      amount: '125000',
      currency: 'BDT',
      status: BillingRequestStatus.UNDER_REVIEW,
      invoiceId: null,
      approvedAt: null,
      rejectionReason: 'PO missing',
    };
    const invoice = {
      id: 'invoice-1',
      billingRequestId: 'billing-1',
      invoiceNumber: 'INV-20260612-0001',
      status: InvoiceStatus.ISSUED,
    };
    let createdInvoiceInput: CreatedInvoiceInput | null = null;
    const billingRequestsRepository = {
      findOneBy: jest.fn().mockResolvedValue(billingRequest),
      save: jest.fn().mockImplementation((value) => Promise.resolve(value)),
    };
    const invoicesRepository = {
      findOneBy: jest.fn().mockResolvedValue(null),
      countBy: jest.fn().mockResolvedValue(0),
      create: jest.fn((value: CreatedInvoiceInput) => {
        createdInvoiceInput = value;
        return invoice;
      }),
      save: jest.fn().mockResolvedValue(invoice),
    };
    const notificationsService = {
      createBillingApproved: jest.fn(),
      createInvoiceCreated: jest.fn(),
    };
    const auditLogsService = {
      record: jest.fn().mockResolvedValue(undefined),
    };
    const service = new OutcomeHandlerService(
      {} as never,
      {} as never,
      {} as never,
      billingRequestsRepository as never,
      invoicesRepository as never,
      notificationsService as never,
      auditLogsService as never,
    );

    await service.handleApproved(
      {
        id: 'workflow-1',
        entityType: 'BillingRequest',
        entityId: 'billing-1',
        status: WorkflowInstanceStatus.APPROVED,
      } as never,
      {
        setStatus: 'APPROVED',
        createInvoice: true,
      },
    );

    expect(invoicesRepository.create).toHaveBeenCalledTimes(1);
    expect(createdInvoiceInput?.status).toBe(InvoiceStatus.PAID);
    expect(createdInvoiceInput?.paidAt).toBeInstanceOf(Date);
    expect(invoicesRepository.save).toHaveBeenCalledTimes(1);
    expect(billingRequest.status).toBe(BillingRequestStatus.INVOICED);
    expect(billingRequest.invoiceId).toBe('invoice-1');
    expect(notificationsService.createBillingApproved).toHaveBeenCalledWith({
      recipientUserId: 'requester-1',
      entityId: 'billing-1',
      workflowInstanceId: 'workflow-1',
      channels: { push: true, email: true },
    });
    expect(notificationsService.createInvoiceCreated).toHaveBeenCalledWith({
      recipientUserId: 'requester-1',
      entityId: 'invoice-1',
      workflowInstanceId: 'workflow-1',
      channels: { push: true, email: true },
    });
    expect(notificationsService.createInvoiceCreated).toHaveBeenCalledWith({
      recipientRoleSlug: 'accounts-officer',
      entityId: 'invoice-1',
      workflowInstanceId: 'workflow-1',
      channels: { push: true, email: true },
    });
  });

  it('does not approve or invoice a cancelled billing request', async () => {
    const billingRequest = {
      id: 'billing-1',
      requesterId: 'requester-1',
      status: BillingRequestStatus.CANCELLED,
      invoiceId: null,
      approvedAt: null,
      rejectionReason: null,
    };
    const billingRequestsRepository = {
      findOneBy: jest.fn().mockResolvedValue(billingRequest),
      save: jest.fn(),
    };
    const invoicesRepository = {
      findOneBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    const service = new OutcomeHandlerService(
      {} as never,
      {} as never,
      {} as never,
      billingRequestsRepository as never,
      invoicesRepository as never,
      {} as never,
      {} as never,
    );

    await service.handleApproved(
      {
        id: 'workflow-1',
        entityType: 'BillingRequest',
        entityId: 'billing-1',
        status: WorkflowInstanceStatus.APPROVED,
      } as never,
      {
        actions: [
          { type: 'MARK_BILLING_APPROVED' },
          { type: 'CREATE_INVOICE' },
        ],
      },
    );

    expect(billingRequestsRepository.save).not.toHaveBeenCalled();
    expect(invoicesRepository.findOneBy).not.toHaveBeenCalled();
    expect(invoicesRepository.create).not.toHaveBeenCalled();
    expect(invoicesRepository.save).not.toHaveBeenCalled();
  });
});
