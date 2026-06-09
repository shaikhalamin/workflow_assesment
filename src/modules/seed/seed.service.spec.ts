import { SeedService } from './seed.service';

describe('SeedService', () => {
  it('uses stable role slugs required by the assessment', () => {
    expect(SeedService.roleSeeds.map((role) => role.slug)).toEqual([
      'employee',
      'department-reviewer',
      'manager',
      'accounts-officer',
      'finance-admin',
      'hr-officer',
      'hr-manager',
      'cfo',
      'payroll-officer',
      'admin',
    ]);
  });

  it('uses the shared development password marker', () => {
    expect(SeedService.developmentPassword).toBe('Password123!');
  });

  it('defines seeded workflow templates for expense, leave, and attendance', () => {
    expect(SeedService.workflowTemplateSeeds.map((workflow) => workflow.name)).toEqual([
      'Expense Approval Workflow',
      'Leave Approval Workflow',
      'Attendance Adjustment Workflow',
    ]);
  });
});
