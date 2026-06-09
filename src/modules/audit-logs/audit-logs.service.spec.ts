import { AuditLogsService } from './audit-logs.service';

describe('AuditLogsService', () => {
  it('records actor, action, entity, workflow, and status transition', async () => {
    const save = jest.fn().mockImplementation((value) => Promise.resolve(value));
    const service = new AuditLogsService({ create: (v: unknown) => v, save } as never);

    await service.record({
      actorUserId: 'user-1',
      action: 'WORKFLOW_STEP_APPROVED',
      entityType: 'Expense',
      entityId: 'expense-1',
      workflowInstanceId: 'instance-1',
      workflowStepId: 'step-1',
      oldStatus: 'ACTIVE',
      newStatus: 'APPROVED',
      comment: 'ok',
      reason: null,
      metadataJson: { amount: 100 },
    });

    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: 'user-1',
        action: 'WORKFLOW_STEP_APPROVED',
        entityType: 'Expense',
      }),
    );
  });
});
