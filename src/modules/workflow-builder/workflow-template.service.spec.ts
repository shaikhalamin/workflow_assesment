import { BadRequestException } from '@nestjs/common';
import { WorkflowTemplateService } from './workflow-template.service';

describe('WorkflowTemplateService publish validation', () => {
  it('rejects publishing templates without active rules', async () => {
    const service = new WorkflowTemplateService(
      { findOne: jest.fn().mockResolvedValue({ id: 'tpl-1', rules: [] }) } as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );

    await expect(service.publish('tpl-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
