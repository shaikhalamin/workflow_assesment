import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import {
  CheckCircle2,
  Copy,
  Eye,
  FilePlus2,
  PlayCircle,
  Plus,
  Send,
  XCircle,
} from 'lucide-react'
import { useMemo, useState } from 'react'

import { useAuditLogsControllerList } from '@/lib/api/gen'
import { useAuditLogsControllerListForWorkflow } from '@/lib/api/gen'
import { useDashboardControllerAccounts } from '@/lib/api/gen'
import { useDashboardControllerAdmin } from '@/lib/api/gen'
import { useDashboardControllerApprover } from '@/lib/api/gen'
import { useDashboardControllerEmployee } from '@/lib/api/gen'
import { useDashboardControllerHr } from '@/lib/api/gen'
import { useExpensesControllerCreate } from '@/lib/api/gen'
import { useExpensesControllerFindOne } from '@/lib/api/gen'
import { useExpensesControllerList } from '@/lib/api/gen'
import { useExpensesControllerSubmit } from '@/lib/api/gen'
import { useLeavesControllerCreate } from '@/lib/api/gen'
import { useLeavesControllerFindOne } from '@/lib/api/gen'
import { useLeavesControllerList } from '@/lib/api/gen'
import { useLeavesControllerSubmit } from '@/lib/api/gen'
import { usePaymentsControllerList } from '@/lib/api/gen'
import { usePaymentsControllerMarkPaid } from '@/lib/api/gen'
import { useWorkflowEventSchemaControllerCreate } from '@/lib/api/gen'
import { useWorkflowEventSchemaControllerList } from '@/lib/api/gen'
import { useWorkflowRuntimeControllerApprove } from '@/lib/api/gen'
import { useWorkflowRuntimeControllerFindOne } from '@/lib/api/gen'
import { useWorkflowRuntimeControllerList } from '@/lib/api/gen'
import { useWorkflowRuntimeControllerMyPending } from '@/lib/api/gen'
import { useWorkflowRuntimeControllerReject } from '@/lib/api/gen'
import { useWorkflowTemplateControllerCreateWizard } from '@/lib/api/gen'
import { useWorkflowTemplateControllerDeactivate } from '@/lib/api/gen'
import { useWorkflowTemplateControllerDuplicate } from '@/lib/api/gen'
import { useWorkflowTemplateControllerFindOne } from '@/lib/api/gen'
import { useWorkflowTemplateControllerList } from '@/lib/api/gen'
import { useWorkflowTemplateControllerPublish } from '@/lib/api/gen'
import { DataTable } from '@/components/data-table'
import {
  FormCheckbox,
  FormField,
  FormInput,
  FormSelect,
  FormShell,
  FormTextarea,
} from '@/components/form'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/form-controls'
import {
  createDefaultWorkflowDraft,
  getConditionFieldExample,
  getDefaultConditionOperator,
  getWorkflowModule,
  parseConditionValue,
  roleOptions,
  toWorkflowWizardPayload,
  useWorkflowBuilderStore,
  workflowModules,
  type WorkflowDraft,
  type WorkflowRuleDraft,
} from '@/features/workflows/workflow-builder-store'
import {
  apiErrorMessage,
  formatDate,
  formatValue,
  unwrapData,
} from '@/lib/format'

type Row = Record<string, unknown>

function PageHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-3xl text-sm text-[var(--muted-foreground)]">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  )
}

function ErrorNotice({ error }: { error: unknown }) {
  if (!error) return null
  return (
    <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
      {apiErrorMessage(error)}
    </div>
  )
}

function Metric({
  label,
  value,
}: {
  label: string
  value: string | number | undefined
}) {
  return (
    <div className="rounded-md border border-[var(--border)] bg-white p-4">
      <p className="text-sm text-[var(--muted-foreground)]">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value ?? '-'}</p>
    </div>
  )
}

export function DashboardPage() {
  const admin = useDashboardControllerAdmin()
  const employee = useDashboardControllerEmployee()
  const approver = useDashboardControllerApprover()
  const accounts = useDashboardControllerAccounts()
  const hr = useDashboardControllerHr()
  const pending = useWorkflowRuntimeControllerMyPending()
  const adminData = unwrapData(admin.data)
  const employeeData = unwrapData(employee.data)
  const approverData = unwrapData(approver.data)
  const accountsData = unwrapData(accounts.data)
  const hrData = unwrapData(hr.data)

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Role-aware operational summary across workflow configuration, runtime approvals, employee requests, HR, and accounts."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Published workflows" value={adminData?.workflows?.active} />
        <Metric label="Pending approvals" value={approverData?.pendingTasks} />
        <Metric label="Expense drafts" value={employeeData?.expenses?.draft} />
        <Metric label="Pending payments" value={accountsData?.pendingPayments} />
        <Metric label="HR leave tasks" value={hrData?.leaveTasks} />
        <Metric label="Failed triggers" value={adminData?.failedTriggers} />
        <Metric label="Acted tasks" value={approverData?.actedTasks} />
        <Metric label="Leave under review" value={employeeData?.leaves?.underReview} />
      </div>
      <section className="mt-8">
        <PageHeader title="My pending approval tasks" />
        <TaskTable rows={(unwrapData(pending.data) as Row[] | undefined) ?? []} />
      </section>
    </>
  )
}

export function WorkflowTemplatesPage() {
  const query = useWorkflowTemplateControllerList({ params: { page: 1, limit: 50 } })
  const duplicate = useWorkflowTemplateControllerDuplicate({
    mutation: { onSuccess: () => void query.refetch() },
  })
  const publish = useWorkflowTemplateControllerPublish({
    mutation: { onSuccess: () => void query.refetch() },
  })
  const deactivate = useWorkflowTemplateControllerDeactivate({
    mutation: { onSuccess: () => void query.refetch() },
  })
  const rows = (unwrapData(query.data) as Row[] | undefined) ?? []
  const columns = useMemo<ColumnDef<Row>[]>(
    () => [
      { header: 'Name', accessorKey: 'name' },
      { header: 'Module', accessorKey: 'moduleName' },
      { header: 'Event', accessorKey: 'eventName' },
      {
        header: 'Status',
        cell: ({ row }) => <Badge>{String(row.original.status)}</Badge>,
      },
      { header: 'Priority', accessorKey: 'priority' },
      {
        header: 'Actions',
        cell: ({ row }) => {
          const id = String(row.original.id)
          return (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" type="button">
                <Link to="/workflow-templates/$templateId" params={{ templateId: id }}>
                  <Eye className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="sm" variant="secondary" type="button" onClick={() => duplicate.mutate({ id })}>
                <Copy className="h-4 w-4" /> Duplicate
              </Button>
              <Button size="sm" type="button" onClick={() => publish.mutate({ id })}>
                <PlayCircle className="h-4 w-4" /> Publish
              </Button>
              <Button size="sm" variant="ghost" type="button" onClick={() => deactivate.mutate({ id })}>
                Deactivate
              </Button>
            </div>
          )
        },
      },
    ],
    [deactivate, duplicate, publish],
  )

  return (
    <>
      <PageHeader
        title="Workflow Builder"
        description="Create, publish, duplicate, and deactivate configurable workflow templates."
        action={
          <Button type="button">
            <Link to="/workflow-templates/new" className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4" /> New workflow
            </Link>
          </Button>
        }
      />
      <ErrorNotice error={query.error} />
      <DataTable columns={columns} data={rows} />
    </>
  )
}

export function WorkflowBuilderPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { step, setStep, draft, setDraft, reset } = useWorkflowBuilderStore()
  const createWizard = useWorkflowTemplateControllerCreateWizard({
    mutation: {
      onSuccess: async (response) => {
        reset()
        await queryClient.invalidateQueries()
        const id = unwrapData(response)?.id
        await navigate({
          to: id ? '/workflow-templates/$templateId' : '/workflow-templates',
          params: id ? { templateId: id } : undefined,
        })
      },
    },
  })

  return (
    <FormShell
      kicker="Workflow templates"
      title="Create workflow"
      description="Seven-step workflow configuration from module event to final outcomes."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1 font-mono text-[11px] text-[var(--ink-3)]">
            Step {step} of 7
          </span>
        </div>
      }
      aside={
        <SummaryCard
          title="Template preview"
          rows={[
            { label: 'Name', value: draft.template.name || 'Untitled' },
            { label: 'Module', value: draft.template.moduleName },
            { label: 'Event', value: draft.template.eventName },
            { label: 'Rules', value: draft.rules.length },
            { label: 'Status', value: draft.template.status },
          ]}
        />
      }
    >
      <ErrorNotice error={createWizard.error} />
      <div className="flex flex-wrap gap-1.5">
        {[1, 2, 3, 4, 5, 6, 7].map((item) => (
          <button
            key={item}
            type="button"
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-medium transition ${
              step === item
                ? 'border-[var(--foreground)] bg-[var(--foreground)] text-white'
                : 'border-[var(--border)] bg-white text-[var(--ink-3)] hover:bg-[var(--surface-2)]'
            }`}
            onClick={() => setStep(item)}
          >
            <span className="font-mono text-[10.5px]">{String(item).padStart(2, '0')}</span>
            Step
          </button>
        ))}
      </div>
      <div className="rounded-md border border-[var(--border)] bg-white p-4">
        {step === 1 ? <BasicInfo draft={draft} setDraft={setDraft} /> : null}
        {step === 2 ? <ModuleEvent draft={draft} setDraft={setDraft} /> : null}
        {step === 3 ? <TriggerConditions draft={draft} setDraft={setDraft} /> : null}
        {step === 4 ? <ApprovalRules draft={draft} setDraft={setDraft} /> : null}
        {step === 5 ? <ApprovalSteps draft={draft} setDraft={setDraft} /> : null}
        {step === 6 ? <Outcomes draft={draft} setDraft={setDraft} /> : null}
        {step === 7 ? <ReviewWorkflow draft={draft} /> : null}
        <div className="mt-6 flex justify-between border-t border-[var(--border)] pt-4">
          <Button type="button" variant="secondary" disabled={step === 1} onClick={() => setStep(step - 1)}>
            Back
          </Button>
          {step < 7 ? (
            <Button type="button" onClick={() => setStep(step + 1)}>
              Next
            </Button>
          ) : (
            <Button
              type="button"
              disabled={!draft.template.name || createWizard.isPending}
              onClick={() =>
                createWizard.mutate({ data: toWorkflowWizardPayload(draft) })
              }
            >
              Save workflow
            </Button>
          )}
        </div>
      </div>
    </FormShell>
  )
}

function BasicInfo({
  draft,
  setDraft,
}: {
  draft: WorkflowDraft
  setDraft: (draft: WorkflowDraft) => void
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field label="Workflow Name">
        <FormInput value={draft.template.name} onChange={(event) => setDraft({ ...draft, template: { ...draft.template, name: event.target.value } })} />
      </Field>
      <Field label="Status">
        <FormSelect value={draft.template.status} onChange={(event) => setDraft({ ...draft, template: { ...draft.template, status: event.target.value as 'DRAFT' | 'PUBLISHED' } })}>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
        </FormSelect>
      </Field>
      <Field label="Description">
        <FormTextarea value={draft.template.description} onChange={(event) => setDraft({ ...draft, template: { ...draft.template, description: event.target.value } })} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Priority">
          <FormInput type="number" value={draft.template.priority} onChange={(event) => setDraft({ ...draft, template: { ...draft.template, priority: Number(event.target.value) } })} />
        </Field>
        <Field label="Effective From">
          <FormInput type="date" value={draft.template.effectiveFrom ?? ''} onChange={(event) => setDraft({ ...draft, template: { ...draft.template, effectiveFrom: event.target.value } })} />
        </Field>
        <Field label="Effective To">
          <FormInput type="date" value={draft.template.effectiveTo ?? ''} onChange={(event) => setDraft({ ...draft, template: { ...draft.template, effectiveTo: event.target.value } })} />
        </Field>
      </div>
      <FormCheckbox
        label="Allow resubmission after rejection"
        checked={draft.template.allowResubmission}
        onChange={(event) => setDraft({ ...draft, template: { ...draft.template, allowResubmission: event.target.checked } })}
      />
    </div>
  )
}

function ModuleEvent({ draft, setDraft }: { draft: WorkflowDraft; setDraft: (draft: WorkflowDraft) => void }) {
  const selected = getWorkflowModule(draft.template.moduleName) ?? workflowModules[0]
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field label="Module">
        <FormSelect
          value={selected.moduleName}
          onChange={(event) => {
            const module = getWorkflowModule(event.target.value) ?? workflowModules[0]
            setDraft({
              ...draft,
              template: {
                ...draft.template,
                moduleName: module.moduleName,
                eventName: module.eventName,
                entityType: module.entityType,
              },
            })
          }}
        >
          {workflowModules.map((item) => (
            <option key={item.moduleName} value={item.moduleName}>
              {item.label}
            </option>
          ))}
        </FormSelect>
      </Field>
      <Field label="Module Event">
        <FormInput value={selected.eventName} readOnly />
      </Field>
      <Field label="Entity Type">
        <FormInput value={selected.entityType} readOnly />
      </Field>
      <div className="rounded-md bg-[var(--muted)] p-4 text-sm text-[var(--muted-foreground)]">
        {selected.description}
      </div>
    </div>
  )
}

function TriggerConditions({ draft, setDraft }: { draft: WorkflowDraft; setDraft: (draft: WorkflowDraft) => void }) {
  const fields = getWorkflowModule(draft.template.moduleName)?.fields ?? []
  const defaultField = fields[0]?.key ?? 'amount'
  const condition = draft.triggerConditions.conditions[0] ?? {
    field: defaultField,
    operator: getDefaultConditionOperator(defaultField),
    value: '',
  }
  const fieldExample = getConditionFieldExample(condition.field)
  return (
    <div className="space-y-4">
      <Field label="Condition Mode">
        <FormSelect value={draft.triggerMode} onChange={(event) => setDraft({ ...draft, triggerMode: event.target.value as 'always' | 'conditions' })}>
          <option value="always">Run Always</option>
          <option value="conditions">Run When Conditions Match</option>
        </FormSelect>
      </Field>
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Field">
          <FormSelect value={condition.field} onChange={(event) => {
            const field = event.target.value
            setDraft({
              ...draft,
              triggerConditions: {
                mode: 'all',
                conditions: [{ ...condition, field, operator: getDefaultConditionOperator(field) }],
              },
            })
          }}>
            {fields.map((field) => (
              <option key={field.key} value={field.key}>{field.key}</option>
            ))}
          </FormSelect>
        </Field>
        <Field label="Operator">
          <FormSelect value={condition.operator} onChange={(event) => setDraft({ ...draft, triggerConditions: { mode: 'all', conditions: [{ ...condition, operator: event.target.value as typeof condition.operator }] } })}>
            {['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'between', 'in', 'not_in', 'contains', 'is_empty', 'is_not_empty'].map((operator) => (
              <option key={operator} value={operator}>{operator}</option>
            ))}
          </FormSelect>
        </Field>
        <Field label="Value">
          <FormInput
            placeholder={String(fieldExample.value)}
            value={String(condition.value ?? '')}
            onChange={(event) =>
              setDraft({
                ...draft,
                triggerConditions: {
                  mode: 'all',
                  conditions: [
                    {
                      ...condition,
                      value: parseConditionValue(event.target.value, condition.field),
                    },
                  ],
                },
              })
            }
          />
          <p className="text-xs text-[var(--muted-foreground)]">{fieldExample.label}</p>
        </Field>
      </div>
    </div>
  )
}

function ApprovalRules({ draft, setDraft }: { draft: WorkflowDraft; setDraft: (draft: WorkflowDraft) => void }) {
  const fields = getWorkflowModule(draft.template.moduleName)?.fields ?? []
  const defaultField = fields[0]?.key ?? 'amount'
  const defaultExample = getConditionFieldExample(defaultField)
  const updateRule = (index: number, rule: WorkflowRuleDraft) => {
    const rules = [...draft.rules]
    rules[index] = rule
    setDraft({ ...draft, rules })
  }
  return (
    <div className="space-y-4">
      {draft.rules.map((rule, index) => (
        <div key={index} className="rounded-md border border-[var(--border)] p-4">
          {(() => {
            const condition = rule.conditionJson?.conditions[0] ?? {
              field: defaultField,
              operator: getDefaultConditionOperator(defaultField),
              value: defaultExample.value,
            }
            const fieldExample = getConditionFieldExample(condition.field)

            return (
          <div className="grid gap-4 md:grid-cols-4">
            <Field label="Rule Name">
              <FormInput value={rule.name} onChange={(event) => updateRule(index, { ...rule, name: event.target.value })} />
            </Field>
            <Field label="Priority">
              <FormInput type="number" value={rule.priority} onChange={(event) => updateRule(index, { ...rule, priority: Number(event.target.value) })} />
            </Field>
            <Field label="Condition Field">
              <FormSelect
                value={condition.field}
                onChange={(event) => {
                  const field = event.target.value
                  const example = getConditionFieldExample(field)
                  updateRule(index, {
                    ...rule,
                    isFallback: false,
                    conditionJson: {
                      mode: 'all',
                      conditions: [
                        {
                          field,
                          operator: getDefaultConditionOperator(field),
                          value: example.value,
                        },
                      ],
                    },
                  })
                }}
              >
                {fields.map((field) => (
                  <option key={field.key} value={field.key}>{field.key}</option>
                ))}
              </FormSelect>
            </Field>
            <Field label="Condition Value">
              <FormInput
                placeholder={String(fieldExample.value)}
                value={String(condition.value ?? '')}
                onChange={(event) =>
                  updateRule(index, {
                    ...rule,
                    isFallback: false,
                    conditionJson: {
                      mode: 'all',
                      conditions: [
                        {
                          ...condition,
                          value: parseConditionValue(event.target.value, condition.field),
                        },
                      ],
                    },
                  })
                }
              />
              <p className="text-xs text-[var(--muted-foreground)]">
                {fieldExample.label}. Operator: {condition.operator}.
              </p>
            </Field>
          </div>
            )
          })()}
          <div className="mt-3">
            <FormCheckbox
              label="Fallback rule"
              checked={rule.isFallback}
              onChange={(event) => updateRule(index, { ...rule, isFallback: event.target.checked })}
            />
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="secondary"
        onClick={() =>
          setDraft({
            ...draft,
            rules: [
              ...draft.rules,
              {
                name: 'New approval rule',
                priority: draft.rules.length + 1,
                isFallback: false,
                isActive: true,
                conditionJson: {
                  mode: 'all',
                  conditions: [
                    {
                      field: defaultField,
                      operator: getDefaultConditionOperator(defaultField),
                      value: defaultExample.value,
                    },
                  ],
                },
                steps: [],
              },
            ],
          })
        }
      >
        <Plus className="h-4 w-4" /> Add rule
      </Button>
    </div>
  )
}

function ApprovalSteps({ draft, setDraft }: { draft: WorkflowDraft; setDraft: (draft: WorkflowDraft) => void }) {
  const updateRule = (index: number, rule: WorkflowRuleDraft) => {
    const rules = [...draft.rules]
    rules[index] = rule
    setDraft({ ...draft, rules })
  }
  return (
    <div className="space-y-5">
      {draft.rules.map((rule, ruleIndex) => (
        <div key={ruleIndex} className="rounded-md border border-[var(--border)] p-4">
          <h2 className="mb-3 font-semibold">{rule.name}</h2>
          <div className="space-y-3">
            {rule.steps.map((step, stepIndex) => (
              <div key={stepIndex} className="grid gap-3 rounded-md bg-[var(--muted)] p-3 md:grid-cols-5">
                <FormInput value={step.stepName} onChange={(event) => {
                  const steps = [...rule.steps]
                  steps[stepIndex] = { ...step, stepName: event.target.value }
                  updateRule(ruleIndex, { ...rule, steps })
                }} />
                <FormSelect value={step.stepType} onChange={(event) => {
                  const steps = [...rule.steps]
                  steps[stepIndex] = { ...step, stepType: event.target.value as typeof step.stepType }
                  updateRule(ruleIndex, { ...rule, steps })
                }}>
                  {['REVIEW', 'APPROVAL', 'FINANCE_CHECK', 'HR_CHECK', 'MANAGEMENT_APPROVAL', 'FINAL_VERIFICATION'].map((type) => <option key={type} value={type}>{type}</option>)}
                </FormSelect>
                <FormSelect value={step.assigneeType} onChange={(event) => {
                  const steps = [...rule.steps]
                  steps[stepIndex] = { ...step, assigneeType: event.target.value as typeof step.assigneeType }
                  updateRule(ruleIndex, { ...rule, steps })
                }}>
                  {['ROLE', 'USER', 'REQUESTER_MANAGER', 'DEPARTMENT_HEAD', 'CUSTOM_FIELD_USER'].map((type) => <option key={type} value={type}>{type}</option>)}
                </FormSelect>
                <FormSelect value={step.assigneeRoleSlug ?? ''} onChange={(event) => {
                  const steps = [...rule.steps]
                  steps[stepIndex] = { ...step, assigneeRoleSlug: event.target.value }
                  updateRule(ruleIndex, { ...rule, steps })
                }}>
                  <option value="">Resolver/default</option>
                  {roleOptions.map((role) => <option key={role} value={role}>{role}</option>)}
                </FormSelect>
                <FormInput type="number" value={step.slaHours ?? ''} onChange={(event) => {
                  const steps = [...rule.steps]
                  steps[stepIndex] = { ...step, slaHours: Number(event.target.value) || undefined }
                  updateRule(ruleIndex, { ...rule, steps })
                }} />
              </div>
            ))}
          </div>
          <Button
            type="button"
            size="sm"
            className="mt-3"
            variant="secondary"
            onClick={() =>
              updateRule(ruleIndex, {
                ...rule,
                steps: [
                  ...rule.steps,
                  {
                    stepOrder: rule.steps.length + 1,
                    stepName: 'Approval step',
                    stepType: 'APPROVAL',
                    assigneeType: 'ROLE',
                    assigneeRoleSlug: 'manager',
                    isRequired: true,
                    requiresComment: false,
                    requiresAttachment: false,
                    canReject: true,
                    canReassign: false,
                    slaHours: 24,
                  },
                ],
              })
            }
          >
            <Plus className="h-4 w-4" /> Add step
          </Button>
        </div>
      ))}
    </div>
  )
}

function Outcomes({ draft, setDraft }: { draft: WorkflowDraft; setDraft: (draft: WorkflowDraft) => void }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field label="Approved status">
        <FormInput value={String(draft.approvedActionsJson.setStatus ?? '')} onChange={(event) => setDraft({ ...draft, approvedActionsJson: { ...draft.approvedActionsJson, setStatus: event.target.value } })} />
      </Field>
      <Field label="Rejected status">
        <FormInput value={String(draft.rejectedActionsJson.setStatus ?? '')} onChange={(event) => setDraft({ ...draft, rejectedActionsJson: { ...draft.rejectedActionsJson, setStatus: event.target.value } })} />
      </Field>
      <FormCheckbox
        label="Create payment request after expense approval"
        checked={Boolean(draft.approvedActionsJson.createPaymentRequest)}
        onChange={(event) => setDraft({ ...draft, approvedActionsJson: { ...draft.approvedActionsJson, createPaymentRequest: event.target.checked } })}
      />
      <FormCheckbox
        label="Allow resubmission after rejection"
        checked={Boolean(draft.rejectedActionsJson.allowResubmission)}
        onChange={(event) => setDraft({ ...draft, rejectedActionsJson: { ...draft.rejectedActionsJson, allowResubmission: event.target.checked } })}
      />
    </div>
  )
}

function ReviewWorkflow({ draft }: { draft: WorkflowDraft }) {
  return (
    <pre className="max-h-[520px] overflow-auto rounded-md bg-[#17201c] p-4 text-xs leading-6 text-white">
      {JSON.stringify(toWorkflowWizardPayload(draft), null, 2)}
    </pre>
  )
}

function Field({
  label,
  children,
  description,
}: {
  label: string
  children: React.ReactNode
  description?: string
}) {
  return (
    <FormField label={label} description={description}>
      {children}
    </FormField>
  )
}

export function WorkflowTemplateDetailPage() {
  const { templateId } = useParams({ strict: false }) as { templateId: string }
  const query = useWorkflowTemplateControllerFindOne({ id: templateId })
  const template = unwrapData(query.data) as Row | undefined

  return (
    <>
      <PageHeader title={String(template?.name ?? 'Workflow detail')} />
      <ErrorNotice error={query.error} />
      {template ? <ObjectPanel value={template} /> : null}
    </>
  )
}

export function WorkflowInstancesPage() {
  const query = useWorkflowRuntimeControllerList({ params: { page: 1, limit: 50 } })
  const rows = (unwrapData(query.data) as Row[] | undefined) ?? []
  return (
    <>
      <PageHeader title="Workflow Runtime" description="Runtime workflow instances created by module events." />
      <DataTable
        data={rows}
        columns={[
          { header: 'Entity', accessorKey: 'entityId' },
          { header: 'Module', accessorKey: 'moduleName' },
          { header: 'Event', accessorKey: 'eventName' },
          { header: 'Status', cell: ({ row }) => <Badge>{String(row.original.status)}</Badge> },
          { header: 'Started', cell: ({ row }) => formatDate(row.original.startedAt) },
          { header: 'Actions', cell: ({ row }) => <Link className="font-medium text-[var(--primary)]" to="/workflow-instances/$instanceId" params={{ instanceId: String(row.original.id) }}>Open</Link> },
        ]}
      />
    </>
  )
}

export function WorkflowInstanceDetailPage() {
  const { instanceId } = useParams({ strict: false }) as { instanceId: string }
  const query = useWorkflowRuntimeControllerFindOne({ id: instanceId })
  const logs = useAuditLogsControllerListForWorkflow({ workflowInstanceId: instanceId, params: { page: 1, limit: 50 } })
  const instance = unwrapData(query.data) as Row | undefined
  const steps = ((instance?.steps as Row[] | undefined) ?? []).sort((a, b) => Number(a.stepOrder) - Number(b.stepOrder))
  return (
    <>
      <PageHeader title={`Workflow ${instanceId}`} />
      <ErrorNotice error={query.error} />
      {instance ? <ObjectPanel value={instance} /> : null}
      <section className="mt-6">
        <PageHeader title="Approval timeline" />
        <TaskTable rows={steps} />
      </section>
      <section className="mt-6">
        <PageHeader title="Audit history" />
        <AuditTable rows={(unwrapData(logs.data) as Row[] | undefined) ?? []} />
      </section>
    </>
  )
}

export function TasksPage() {
  const query = useWorkflowRuntimeControllerMyPending()
  const rows = (unwrapData(query.data) as Row[] | undefined) ?? []
  return (
    <>
      <PageHeader title="Pending approvals" description="Approve or reject active workflow steps assigned to your user or role." />
      <TaskTable rows={rows} withActions />
    </>
  )
}

function TaskTable({ rows, withActions = false }: { rows: Row[]; withActions?: boolean }) {
  const queryClient = useQueryClient()
  const [comment, setComment] = useState('')
  const approve = useWorkflowRuntimeControllerApprove({ mutation: { onSuccess: () => void queryClient.invalidateQueries() } })
  const reject = useWorkflowRuntimeControllerReject({ mutation: { onSuccess: () => void queryClient.invalidateQueries() } })
  const columns: ColumnDef<Row>[] = [
    { header: 'Step', accessorKey: 'stepName' },
    { header: 'Type', accessorKey: 'stepType' },
    { header: 'Assignee', cell: ({ row }) => formatValue(row.original.assignedRoleSlug ?? row.original.assignedUserId ?? row.original.assigneeType) },
    { header: 'Status', cell: ({ row }) => <Badge>{String(row.original.status)}</Badge> },
    { header: 'Activated', cell: ({ row }) => formatDate(row.original.activatedAt) },
  ]
  if (withActions) {
    columns.push({
      header: 'Decision',
      cell: ({ row }) => (
        <div className="flex min-w-72 flex-col gap-2">
          <Input placeholder="Comment or rejection reason" value={comment} onChange={(event) => setComment(event.target.value)} />
          <div className="flex gap-2">
            <Button size="sm" type="button" onClick={() => approve.mutate({ id: String(row.original.id), data: { comment } })}>
              <CheckCircle2 className="h-4 w-4" /> Approve
            </Button>
            <Button size="sm" variant="destructive" type="button" onClick={() => reject.mutate({ id: String(row.original.id), data: { reason: comment } })}>
              <XCircle className="h-4 w-4" /> Reject
            </Button>
          </div>
        </div>
      ),
    })
  }
  return <DataTable columns={columns} data={rows} />
}

export function ExpensesPage() {
  const query = useExpensesControllerList({ params: { page: 1, limit: 50 } })
  const submit = useExpensesControllerSubmit({ mutation: { onSuccess: () => void query.refetch() } })
  const rows = (unwrapData(query.data) as Row[] | undefined) ?? []
  return (
    <>
      <PageHeader title="Expenses" action={<Button type="button"><Link to="/expenses/new" className="inline-flex items-center gap-2"><FilePlus2 className="h-4 w-4" /> New expense</Link></Button>} />
      <DataTable
        data={rows}
        columns={[
          { header: 'Title', accessorKey: 'title' },
          { header: 'Amount', cell: ({ row }) => `${formatValue(row.original.amount)} ${formatValue(row.original.currency)}` },
          { header: 'Category', accessorKey: 'category' },
          { header: 'Status', cell: ({ row }) => <Badge>{String(row.original.status)}</Badge> },
          { header: 'Actions', cell: ({ row }) => <div className="flex gap-2"><Link className="font-medium text-[var(--primary)]" to="/expenses/$expenseId" params={{ expenseId: String(row.original.id) }}>Open</Link><Button size="sm" variant="secondary" type="button" onClick={() => submit.mutate({ id: String(row.original.id) })}><Send className="h-4 w-4" /> Submit</Button></div> },
        ]}
      />
    </>
  )
}

export function ExpenseCreatePage() {
  const navigate = useNavigate()
  const createExpense = useExpensesControllerCreate({ mutation: { onSuccess: async () => navigate({ to: '/expenses' }) } })
  const [form, setForm] = useState({ title: '', amount: 0, category: '', description: '', currency: 'BDT', vendor: '' })
  return (
    <CreatePanel
      title="New expense"
      kicker="Expense request"
      description="Capture request details before submitting for approval."
      error={createExpense.error}
      onSubmit={() => createExpense.mutate({ data: { ...form, vendor: form.vendor || undefined } as never })}
    >
      <Input placeholder="Title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
      <Input type="number" placeholder="Amount" value={form.amount} onChange={(event) => setForm({ ...form, amount: Number(event.target.value) })} />
      <Input placeholder="Category" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} />
      <Input placeholder="Vendor" value={form.vendor} onChange={(event) => setForm({ ...form, vendor: event.target.value })} />
      <Textarea placeholder="Description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
    </CreatePanel>
  )
}

export function ExpenseDetailPage() {
  const { expenseId } = useParams({ strict: false }) as { expenseId: string }
  const query = useExpensesControllerFindOne({ id: expenseId })
  const expense = unwrapData(query.data) as Row | undefined
  return <DetailPage title={`Expense ${expenseId}`} error={query.error} value={expense} workflowId={String(expense?.workflowInstanceId ?? '')} />
}

export function LeavesPage() {
  const query = useLeavesControllerList({ params: { page: 1, limit: 50 } })
  const submit = useLeavesControllerSubmit({ mutation: { onSuccess: () => void query.refetch() } })
  const rows = (unwrapData(query.data) as Row[] | undefined) ?? []
  return (
    <>
      <PageHeader title="Leaves" action={<Button type="button"><Link to="/leaves/new" className="inline-flex items-center gap-2"><FilePlus2 className="h-4 w-4" /> New leave</Link></Button>} />
      <DataTable
        data={rows}
        columns={[
          { header: 'Type', accessorKey: 'leaveType' },
          { header: 'Days', accessorKey: 'leaveDays' },
          { header: 'Period', cell: ({ row }) => `${formatValue(row.original.startDate)} - ${formatValue(row.original.endDate)}` },
          { header: 'Status', cell: ({ row }) => <Badge>{String(row.original.status)}</Badge> },
          { header: 'Actions', cell: ({ row }) => <div className="flex gap-2"><Link className="font-medium text-[var(--primary)]" to="/leaves/$leaveId" params={{ leaveId: String(row.original.id) }}>Open</Link><Button size="sm" variant="secondary" type="button" onClick={() => submit.mutate({ id: String(row.original.id) })}><Send className="h-4 w-4" /> Submit</Button></div> },
        ]}
      />
    </>
  )
}

export function LeaveCreatePage() {
  const navigate = useNavigate()
  const createLeave = useLeavesControllerCreate({ mutation: { onSuccess: async () => navigate({ to: '/leaves' }) } })
  const [form, setForm] = useState({ leaveType: 'ANNUAL', leaveDays: 1, startDate: '', endDate: '', reason: '' })
  return (
    <CreatePanel
      title="New leave"
      kicker="Leave request"
      description="Capture leave details before sending through workflow."
      error={createLeave.error}
      onSubmit={() => createLeave.mutate({ data: form as never })}
    >
      <Input placeholder="Leave type" value={form.leaveType} onChange={(event) => setForm({ ...form, leaveType: event.target.value })} />
      <Input type="number" placeholder="Leave days" value={form.leaveDays} onChange={(event) => setForm({ ...form, leaveDays: Number(event.target.value) })} />
      <Input type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} />
      <Input type="date" value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} />
      <Textarea placeholder="Reason" value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} />
    </CreatePanel>
  )
}

export function LeaveDetailPage() {
  const { leaveId } = useParams({ strict: false }) as { leaveId: string }
  const query = useLeavesControllerFindOne({ id: leaveId })
  const leave = unwrapData(query.data) as Row | undefined
  return <DetailPage title={`Leave ${leaveId}`} error={query.error} value={leave} workflowId={String(leave?.workflowInstanceId ?? '')} />
}

export function PaymentsPage() {
  const query = usePaymentsControllerList({ params: { page: 1, limit: 50 } })
  const markPaid = usePaymentsControllerMarkPaid({ mutation: { onSuccess: () => void query.refetch() } })
  const rows = (unwrapData(query.data) as Row[] | undefined) ?? []
  return (
    <>
      <PageHeader title="Payment requests" />
      <DataTable
        data={rows}
        columns={[
          { header: 'Payment', accessorKey: 'id' },
          { header: 'Expense', accessorKey: 'expenseId' },
          { header: 'Amount', cell: ({ row }) => `${formatValue(row.original.amount)} ${formatValue(row.original.currency)}` },
          { header: 'Status', cell: ({ row }) => <Badge>{String(row.original.status)}</Badge> },
          { header: 'Action', cell: ({ row }) => <Button size="sm" type="button" onClick={() => markPaid.mutate({ id: String(row.original.id), data: { paymentReference: `MANUAL-${Date.now()}` } })}>Mark paid</Button> },
        ]}
      />
    </>
  )
}

export function AuditLogsPage() {
  const query = useAuditLogsControllerList({ params: { page: 1, limit: 50 } })
  return (
    <>
      <PageHeader title="Audit logs" />
      <AuditTable rows={(unwrapData(query.data) as Row[] | undefined) ?? []} />
    </>
  )
}

function AuditTable({ rows }: { rows: Row[] }) {
  return (
    <DataTable
      data={rows}
      columns={[
        { header: 'Action', accessorKey: 'action' },
        { header: 'Entity', cell: ({ row }) => `${formatValue(row.original.entityType)} ${formatValue(row.original.entityId)}` },
        { header: 'Status', cell: ({ row }) => `${formatValue(row.original.oldStatus)} -> ${formatValue(row.original.newStatus)}` },
        { header: 'Comment', accessorKey: 'comment' },
        { header: 'Created', cell: ({ row }) => formatDate(row.original.createdAt) },
      ]}
    />
  )
}

export function EventSchemasPage() {
  const query = useWorkflowEventSchemaControllerList({ params: { page: 1, limit: 50 } })
  const createSchema = useWorkflowEventSchemaControllerCreate({ mutation: { onSuccess: () => void query.refetch() } })
  const [moduleName, setModuleName] = useState('expenses')
  const [eventName, setEventName] = useState('expense.submitted')
  const rows = (unwrapData(query.data) as Row[] | undefined) ?? []
  return (
    <>
      <PageHeader title="Workflow event schemas" description="Field schemas drive condition fields, assignee resolvers, and outcome choices in the builder." />
      <div className="mb-5 grid gap-3 rounded-md border border-[var(--border)] bg-white p-4 md:grid-cols-[1fr_1fr_auto]">
        <Input value={moduleName} onChange={(event) => setModuleName(event.target.value)} />
        <Input value={eventName} onChange={(event) => setEventName(event.target.value)} />
        <Button type="button" onClick={() => createSchema.mutate({ data: { moduleName, eventName, entityType: moduleName === 'leaves' ? 'Leave' : 'Expense', fieldSchemaJson: { fields: [] } } })}>
          Create schema
        </Button>
      </div>
      <DataTable
        data={rows}
        columns={[
          { header: 'Module', accessorKey: 'moduleName' },
          { header: 'Event', accessorKey: 'eventName' },
          { header: 'Entity', accessorKey: 'entityType' },
          { header: 'Active', cell: ({ row }) => formatValue(row.original.isActive) },
        ]}
      />
    </>
  )
}

function DetailPage({ title, error, value, workflowId }: { title: string; error: unknown; value?: Row; workflowId?: string }) {
  return (
    <>
      <PageHeader title={title} action={workflowId ? <Button type="button" variant="secondary"><Link to="/workflow-instances/$instanceId" params={{ instanceId: workflowId }}>Workflow history</Link></Button> : null} />
      <ErrorNotice error={error} />
      {value ? <ObjectPanel value={value} /> : null}
    </>
  )
}

function ObjectPanel({ value }: { value: Row }) {
  return (
    <div className="grid gap-3 rounded-md border border-[var(--border)] bg-white p-4 md:grid-cols-2">
      {Object.entries(value).map(([key, item]) => (
        <div key={key} className="min-w-0 border-b border-[var(--border)] pb-2">
          <p className="text-xs font-medium uppercase text-[var(--muted-foreground)]">{key}</p>
          <p className="mt-1 break-words text-sm">{formatValue(item)}</p>
        </div>
      ))}
    </div>
  )
}

export function SummaryCard({
  title,
  rows,
}: {
  title: string
  rows: Array<{ label: string; value: React.ReactNode }>
}) {
  return (
    <div className="rounded-md border border-[var(--border)] bg-white p-4">
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-3)]">
        {title}
      </p>
      <div className="mt-3 space-y-2">
        {rows.map((row) => (
          <div key={row.label} className="flex items-start justify-between gap-3 text-sm">
            <span className="text-[var(--muted-foreground)]">{row.label}</span>
            <span className="text-right font-medium text-[var(--foreground)]">
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function CreatePanel({
  title,
  kicker,
  description,
  children,
  aside,
  error,
  onSubmit,
  submitLabel = 'Save',
}: {
  title: string
  kicker: string
  description: string
  children: React.ReactNode
  aside?: React.ReactNode
  error: unknown
  onSubmit: () => void
  submitLabel?: string
}) {
  return (
    <FormShell
      kicker={kicker}
      title={title}
      description={description}
      aside={aside}
    >
      <ErrorNotice error={error} />
      <form
        className="space-y-6"
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit()
        }}
      >
        {children}
        <div className="flex flex-col gap-3 border-t border-[var(--border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[11px] text-[var(--ink-3)]">
            API payload and navigation stay unchanged.
          </p>
          <Button type="submit">{submitLabel}</Button>
        </div>
      </form>
    </FormShell>
  )
}

export function ResetBuilderStatePage() {
  useWorkflowBuilderStore.getState().setDraft(createDefaultWorkflowDraft())
  return <WorkflowBuilderPage />
}
