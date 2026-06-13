import { BadRequestException } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { Invoice, InvoiceStatus } from './entities/invoice.entity';

describe('InvoicesService', () => {
  const issuedInvoice = (): Invoice =>
    ({
      id: 'invoice-1',
      billingRequestId: 'billing-1',
      invoiceNumber: 'INV-20260610-0001',
      requesterId: 'requester-1',
      requester: null,
      departmentId: 'dept-1',
      customerName: 'ACME Bangladesh Ltd.',
      customerEmail: 'billing@acme.example',
      customerAddress: 'Dhaka',
      title: 'Enterprise installation',
      description: null,
      amount: '125000',
      currency: 'BDT',
      dueDate: '2026-07-10',
      status: InvoiceStatus.ISSUED,
      issuedAt: new Date('2026-06-10T10:15:00.000Z'),
      cancelledAt: null,
      paidAt: null,
      createdAt: new Date('2026-06-10T10:15:00.000Z'),
      updatedAt: new Date('2026-06-10T10:15:00.000Z'),
    }) as Invoice;

  it('cancels an issued invoice', async () => {
    const invoice = issuedInvoice();
    const invoicesRepository = {
      findOneBy: jest.fn().mockResolvedValue(invoice),
      findOne: jest.fn().mockResolvedValue(invoice),
      save: jest.fn().mockImplementation((value: Invoice) =>
        Promise.resolve({
          ...value,
          updatedAt: new Date('2026-06-11T10:15:00.000Z'),
        }),
      ),
    };
    const auditLogs = {
      record: jest.fn().mockResolvedValue(undefined),
    };
    const service = new InvoicesService(
      invoicesRepository as never,
      auditLogs as never,
    );

    const response = await service.cancel('invoice-1', {
      userId: 'finance-1',
      roles: ['finance-admin'],
      permissions: [],
    } as never);

    expect(invoice.status).toBe(InvoiceStatus.CANCELLED);
    expect(invoice.cancelledAt).toBeInstanceOf(Date);
    expect(response.status).toBe(InvoiceStatus.CANCELLED);
    expect(auditLogs.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'INVOICE_CANCELLED',
        oldStatus: InvoiceStatus.ISSUED,
        newStatus: InvoiceStatus.CANCELLED,
      }),
    );
  });

  it('marks an issued invoice paid', async () => {
    const invoice = issuedInvoice();
    const invoicesRepository = {
      findOneBy: jest.fn().mockResolvedValue(invoice),
      findOne: jest.fn().mockResolvedValue(invoice),
      save: jest
        .fn()
        .mockImplementation((value: Invoice) => Promise.resolve(value)),
    };
    const service = new InvoicesService(
      invoicesRepository as never,
      { record: jest.fn().mockResolvedValue(undefined) } as never,
    );

    const response = await service.markPaid('invoice-1', {
      userId: 'finance-1',
      roles: ['finance-admin'],
      permissions: [],
    } as never);

    expect(invoice.status).toBe(InvoiceStatus.PAID);
    expect(invoice.paidAt).toBeInstanceOf(Date);
    expect(response.status).toBe(InvoiceStatus.PAID);
  });

  it('rejects cancelling a paid invoice', async () => {
    const invoice = issuedInvoice();
    invoice.status = InvoiceStatus.PAID;
    const service = new InvoicesService(
      { findOneBy: jest.fn().mockResolvedValue(invoice) } as never,
      {} as never,
    );

    await expect(
      service.cancel('invoice-1', {
        userId: 'finance-1',
        roles: ['finance-admin'],
      } as never),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('allows managers to read invoices without department matching', async () => {
    const invoice = issuedInvoice();
    const service = new InvoicesService(
      {
        findOne: jest.fn().mockResolvedValue(invoice),
      } as never,
      {} as never,
    );

    await expect(
      service.findOne('invoice-1', {
        userId: 'manager-1',
        departmentId: 'dept-2',
        roles: ['manager'],
      } as never),
    ).resolves.toEqual(expect.objectContaining({ id: 'invoice-1' }));
  });
});
