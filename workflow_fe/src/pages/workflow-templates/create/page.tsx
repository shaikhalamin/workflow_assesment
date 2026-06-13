import { useQueryClient } from '@tanstack/react-query'
import { useForm } from '@tanstack/react-form'
import { useNavigate,useParams } from '@tanstack/react-router'
import {
ChevronDown,
ChevronRight,
Plus,
Trash2
} from 'lucide-react'
import { useEffect,useRef,useState } from 'react'

import {
FormCheckbox,
FormField,
FormInput,
FormSection,
FormSelect,
FormShell,
FormTextarea,
} from '@/components/form'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
createDefaultWorkflowDraft,
describeWorkflowAssignee,
formatRoleLabel,
getConditionFieldExample,
getDefaultConditionOperator,
  getWorkflowBuilderStepState,
  getWorkflowModule,
  parseConditionValue,
  roleOptions,
  saveWorkflowDraftEdit,
  toWorkflowWizardPayload,
  useWorkflowBuilderStore,
  workflowTemplateToDraft,
  workflowBuilderSteps,
  workflowModules,
  type WorkflowDraft,
  type WorkflowRuleDraft,
  type WorkflowStepDraft,
} from '@/features/workflows/workflow-builder-store'
import type {
UserResponseDto,
WorkflowTemplateResponseDto
} from '@/lib/api/gen'
import { useUsersControllerGetUsers,useWorkflowTemplateControllerCreateWizard,useWorkflowTemplateControllerFindOne } from '@/lib/api/gen'
import {
formatValue,
rowsFrom,
unwrapData
} from '@/lib/format'
import {
EmptyState,
ErrorNotice,
PageHeader
} from '@/pages/utils/page-components'
import {
fieldError,
workflowBuilderSaveSchema
} from '@/pages/utils/form-validation'

type WorkflowNameFieldProps = {
  value: string
  error: string
  onBlur: () => void
  onChange: (value: string) => void
}

type WorkflowBuilderPageProps = {
  mode?: 'create' | 'edit'
  templateId?: string
}

export function WorkflowBuilderPage({
  mode = 'create',
  templateId,
}: WorkflowBuilderPageProps) {
  const isEditMode = mode === 'edit'
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { step, setStep, draft, setDraft, reset } = useWorkflowBuilderStore()
  const loadedTemplateIdRef = useRef<string | null>(null)
  const [saveError, setSaveError] = useState<unknown>(null)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const usersQuery = useUsersControllerGetUsers({ params: { page: 1, limit: 100 } })
  const templateQuery = useWorkflowTemplateControllerFindOne({
    id: isEditMode ? templateId : undefined,
  })
  const template = unwrapData(templateQuery.data) as
    | WorkflowTemplateResponseDto
    | undefined
  const users = rowsFrom(usersQuery.data)
  const currentStep = workflowBuilderSteps.find((item) => item.id === step)
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
  const form = useForm({
    defaultValues: {
      templateName: draft.template.name,
    },
    validators: {
      onSubmit: workflowBuilderSaveSchema,
    },
    onSubmit: async ({ value }) => {
      const nextDraft = {
        ...draft,
        template: {
          ...draft.template,
          name: value.templateName.trim(),
        },
      }

      if (!isEditMode) {
        createWizard.mutate({
          data: toWorkflowWizardPayload(nextDraft),
        })
        return
      }

      if (!templateId || !template || template.status !== 'DRAFT') return

      setSaveError(null)
      setIsSavingEdit(true)
      try {
        await saveWorkflowDraftEdit({
          templateId,
          draft: nextDraft,
          existingRules: template.rules,
        })
        await queryClient.invalidateQueries()
        await navigate({
          to: '/workflow-templates/$templateId',
          params: { templateId },
        })
      } catch (error) {
        setSaveError(error)
      } finally {
        setIsSavingEdit(false)
      }
    },
  })

  useEffect(() => {
    if (!isEditMode || !template || loadedTemplateIdRef.current === template.id) return

    const nextDraft = workflowTemplateToDraft(template)
    setDraft(nextDraft)
    setStep(1)
    form.setFieldValue('templateName', nextDraft.template.name)
    loadedTemplateIdRef.current = template.id
  }, [form, isEditMode, setDraft, setStep, template])

  if (isEditMode && !template) {
    return (
      <>
        <PageHeader
          title="Edit workflow template"
          kicker="Workflow templates"
          description="Loading the selected workflow draft."
        />
        <ErrorNotice error={templateQuery.error} />
        <EmptyState message="Loading workflow template..." />
      </>
    )
  }

  if (isEditMode && template && template.status !== 'DRAFT') {
    return (
      <>
        <PageHeader
          title={`Edit ${template.name}`}
          kicker="Workflow templates"
          description="Only draft workflow templates can be edited."
        />
        <EmptyState message="This workflow template is not a draft and cannot be edited." />
      </>
    )
  }

  return (
    <FormShell
      kicker="Workflow templates"
      title={isEditMode ? 'Edit workflow template' : 'Create workflow template'}
      description={
        currentStep
          ? currentStep.description
          : 'Configure the business event, approval chain, and final outcomes.'
      }
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1 font-mono text-[11px] text-[var(--ink-3)]">
            {currentStep?.name ?? 'Workflow'} - {step} of {workflowBuilderSteps.length}
          </span>
        </div>
      }
      aside={
        <WorkflowPreview draft={draft} users={users} />
      }
    >
      <ErrorNotice error={templateQuery.error ?? createWizard.error ?? saveError} />
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-5">
        {workflowBuilderSteps.map((item) => {
          const state = getWorkflowBuilderStepState(step, item.id)
          const stateLabel =
            state === 'complete'
              ? 'Complete'
              : state === 'current'
                ? 'Current'
                : 'Upcoming'
          return (
          <button
            key={item.id}
            type="button"
            className={`min-h-16 rounded-md border px-3 py-2 text-left transition ${
              state === 'current'
                ? 'border-[var(--foreground)] bg-[var(--foreground)] text-white'
                : state === 'complete'
                  ? 'border-[var(--primary)] bg-[var(--brand-soft)] text-[var(--brand-emphasis)]'
                  : 'border-[var(--border)] bg-white text-[var(--ink-3)] hover:bg-[var(--surface-2)]'
            }`}
            onClick={() => setStep(item.id)}
          >
            <span className="flex items-center gap-2">
              <span
                className={`grid h-6 w-6 place-items-center rounded-full font-mono text-[10px] ${
                  state === 'current'
                    ? 'bg-white/15 text-white'
                    : 'bg-[var(--surface-2)] text-[var(--ink-3)]'
                }`}
              >
                {String(item.id).padStart(2, '0')}
              </span>
              <span className="block text-sm font-semibold">{item.name}</span>
            </span>
            <span
              className={`mt-1 block font-mono text-[10px] uppercase tracking-[0.08em] ${
                state === 'current' ? 'text-white/80' : 'text-[var(--muted-foreground)]'
              }`}
            >
              {stateLabel}
            </span>
          </button>
          )
        })}
      </div>
      <div className="rounded-md border border-[var(--border)] bg-white p-4">
        {step === 1 ? (
          <form.Field name="templateName">
            {(field) => (
              <WorkflowSetup
                draft={draft}
                setDraft={setDraft}
                workflowNameField={{
                  value: field.state.value,
                  error: fieldError(field.state.meta.errors),
                  onBlur: field.handleBlur,
                  onChange: (value) => {
                    field.handleChange(value)
                    setDraft({
                      ...draft,
                      template: {
                        ...draft.template,
                        name: value,
                      },
                    })
                  },
                }}
              />
            )}
          </form.Field>
        ) : null}
        {step === 2 ? <ApprovalRules draft={draft} setDraft={setDraft} /> : null}
        {step === 3 ? (
          <ApprovalSteps
            draft={draft}
            setDraft={setDraft}
            users={users}
            usersLoading={usersQuery.isLoading}
          />
        ) : null}
        {step === 4 ? <Outcomes draft={draft} setDraft={setDraft} /> : null}
        {step === 5 ? <ReviewWorkflow draft={draft} /> : null}
        <div className="mt-6 flex justify-between border-t border-[var(--border)] pt-4">
          <Button type="button" variant="secondary" disabled={step === 1} onClick={() => setStep(step - 1)}>
            Back
          </Button>
          {step < workflowBuilderSteps.length ? (
            <Button type="button" onClick={() => setStep(step + 1)}>
              Next
            </Button>
          ) : (
            <Button
              type="button"
              disabled={createWizard.isPending || isSavingEdit}
              onClick={() => void form.handleSubmit()}
            >
              {isSavingEdit ? 'Saving workflow...' : 'Save workflow'}
            </Button>
          )}
        </div>
      </div>
    </FormShell>
  )
}

export function WorkflowTemplateEditPage() {
  const { templateId } = useParams({ strict: false }) as { templateId: string }

  return <WorkflowBuilderPage mode="edit" templateId={templateId} />
}

function BasicInfo({
  draft,
  setDraft,
  workflowNameField,
}: {
  draft: WorkflowDraft
  setDraft: (draft: WorkflowDraft) => void
  workflowNameField: WorkflowNameFieldProps
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <FormField label="Workflow Name" htmlFor="workflow-name" error={workflowNameField.error}>
        <FormInput
          id="workflow-name"
          value={workflowNameField.value}
          onBlur={workflowNameField.onBlur}
          onChange={(event) => workflowNameField.onChange(event.target.value)}
        />
      </FormField>
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

function WorkflowSetup({
  draft,
  setDraft,
  workflowNameField,
}: {
  draft: WorkflowDraft
  setDraft: (draft: WorkflowDraft) => void
  workflowNameField: WorkflowNameFieldProps
}) {
  return (
    <div className="space-y-5">
      <FormSection
        index="01"
        title="Basics"
        hint="Name, status, priority, dates, and resubmission policy."
      >
        <BasicInfo draft={draft} setDraft={setDraft} workflowNameField={workflowNameField} />
      </FormSection>
      <FormSection
        index="02"
        title="Event"
        hint="The business module event that starts this workflow."
      >
        <ModuleEvent draft={draft} setDraft={setDraft} />
      </FormSection>
      <FormSection
        index="03"
        title="Trigger"
        hint="Choose whether every event runs this workflow or only matching events do."
      >
        <TriggerConditions draft={draft} setDraft={setDraft} />
      </FormSection>
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
      {draft.triggerMode === 'always' ? (
        <div className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-4 text-sm leading-6 text-[var(--ink-2)]">
          This workflow starts for every {draft.template.eventName} event in the selected module.
        </div>
      ) : (
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
                        value: parseConditionValue(
                          event.target.value,
                          condition.field,
                          condition.operator,
                        ),
                      },
                    ],
                  },
                })
              }
            />
            <p className="text-xs text-[var(--muted-foreground)]">{fieldExample.label}</p>
          </Field>
        </div>
      )}
    </div>
  )
}

function ApprovalRules({ draft, setDraft }: { draft: WorkflowDraft; setDraft: (draft: WorkflowDraft) => void }) {
  const fields = getWorkflowModule(draft.template.moduleName)?.fields ?? []
  const defaultField = fields[0]?.key ?? 'amount'
  const defaultExample = getConditionFieldExample(defaultField)
  const defaultRule = draft.rules.find((rule) => rule.isFallback) ?? draft.rules[0]
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
          <div className="grid gap-4 md:grid-cols-5">
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
            <Field label="Condition Operator">
              <FormSelect
                value={condition.operator}
                onChange={(event) => {
                  const operator = event.target.value as typeof condition.operator
                  updateRule(index, {
                    ...rule,
                    isFallback: false,
                    conditionJson: {
                      mode: 'all',
                      conditions: [
                        {
                          ...condition,
                          operator,
                          value: parseConditionValue(
                            String(condition.value ?? ''),
                            condition.field,
                            operator,
                          ),
                        },
                      ],
                    },
                  })
                }}
              >
                {['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'between', 'in', 'not_in', 'contains', 'is_empty', 'is_not_empty'].map((operator) => (
                  <option key={operator} value={operator}>{operator}</option>
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
                          value: parseConditionValue(
                            event.target.value,
                            condition.field,
                            condition.operator,
                          ),
                        },
                      ],
                    },
                  })
                }
              />
              <p className="text-xs text-[var(--muted-foreground)]">
                {fieldExample.label}. Use commas for between or list values.
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
                steps:
                  defaultRule?.steps.map((step, stepIndex) => ({
                    ...step,
                    stepOrder: stepIndex + 1,
                  })) ?? [],
                copiedFromDefaultPath: true,
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

const stepTypeOptions: Array<{
  value: WorkflowStepDraft['stepType']
  label: string
  description: string
}> = [
  {
    value: 'REVIEW',
    label: 'Review',
    description: 'Checks the request before an approval decision.',
  },
  {
    value: 'APPROVAL',
    label: 'Approval',
    description: 'Approves or rejects the business request.',
  },
]

const assigneeTypeOptions: Array<{
  value: WorkflowStepDraft['assigneeType']
  label: string
  description: string
}> = [
  {
    value: 'ROLE',
    label: 'Role queue',
    description: 'Any active user with the selected role can act on this step.',
  },
  {
    value: 'USER',
    label: 'Specific user',
    description: 'Only the selected user can act on this step.',
  },
  {
    value: 'REQUESTER_MANAGER',
    label: 'Requester manager',
    description: 'Resolved at runtime from the requester profile.',
  },
]

function optionDescription<TValue extends string>(
  options: Array<{ value: TValue; description: string }>,
  value: TValue,
) {
  return options.find((option) => option.value === value)?.description
}

function ApprovalSteps({
  draft,
  setDraft,
  users,
  usersLoading,
}: {
  draft: WorkflowDraft
  setDraft: (draft: WorkflowDraft) => void
  users: UserResponseDto[]
  usersLoading: boolean
}) {
  const userFields =
    getWorkflowModule(draft.template.moduleName)?.fields.filter(
      (field) => field.type === 'user',
    ) ?? []
  const updateRule = (index: number, rule: WorkflowRuleDraft) => {
    const rules = [...draft.rules]
    rules[index] = rule
    setDraft({ ...draft, rules })
  }
  const updateStep = (
    ruleIndex: number,
    stepIndex: number,
    step: WorkflowStepDraft,
  ) => {
    const rule = draft.rules[ruleIndex]
    const steps = [...rule.steps]
    steps[stepIndex] = step
    updateRule(ruleIndex, { ...rule, steps })
  }

  return (
    <div className="space-y-5">
      {draft.rules.map((rule, ruleIndex) => {
        const conditionText = rule.isFallback
          ? 'Fallback path when no earlier rule matches.'
          : rule.conditionJson?.conditions.length
            ? rule.conditionJson.conditions
                .map(
                  (condition) =>
                    `${condition.field} ${condition.operator} ${formatValue(
                      condition.value,
                    )}`,
                )
                .join(', ')
            : 'Needs rule condition.'

        return (
          <section
            key={ruleIndex}
            aria-label={`Rule ${ruleIndex + 1} ${rule.name || `Rule ${ruleIndex + 1}`}`}
            className="overflow-hidden rounded-md border border-[var(--border)] bg-[var(--surface-2)]"
            role="group"
          >
            <div className="border-b border-[var(--border)] bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                    Rule {ruleIndex + 1}
                  </p>
                  <h2 className="mt-1 text-base font-semibold text-[var(--foreground)]">
                    {rule.name || `Rule ${ruleIndex + 1}`}
                  </h2>
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                    This chain runs when this rule matches.
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">
                    {conditionText}
                  </p>
                  {rule.copiedFromDefaultPath ? (
                    <p className="mt-1 text-xs font-medium text-[var(--brand-emphasis)]">
                      Started from the default approval path. Customize if this rule needs different approvers.
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--ink-3)]">
                    Priority {rule.priority}
                  </span>
                  <span className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--ink-3)]">
                    {rule.steps.length} steps
                  </span>
                  {rule.isFallback ? (
                    <span className="rounded-full border border-[var(--warning)] bg-[var(--warning-soft)] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--warning)]">
                      Fallback
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="space-y-4 p-4">
              {rule.steps.map((step, stepIndex) => (
                <div
                  key={stepIndex}
                  className="rounded-md border border-[var(--border)] bg-white p-4"
                >
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                        Approval chain item {stepIndex + 1}
                      </p>
                      <h3 className="text-base font-semibold text-[var(--foreground)]">
                        {step.stepName || 'Unnamed workflow step'}
                      </h3>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        {describeWorkflowAssignee(step, users)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        className={
                          step.canReject
                            ? 'bg-[var(--warning-soft)] text-[var(--warning)]'
                            : 'bg-[var(--success-soft)] text-[var(--success)]'
                        }
                      >
                        {step.canReject ? 'Can reject' : 'Approve only'}
                      </Badge>
                      <Button
                        aria-label={`Remove approval step ${stepIndex + 1}`}
                        size="sm"
                        type="button"
                        variant="destructive"
                        onClick={() =>
                          updateRule(ruleIndex, {
                            ...rule,
                            steps: rule.steps
                              .filter((_, index) => index !== stepIndex)
                              .map((item, index) => ({
                                ...item,
                                stepOrder: index + 1,
                              })),
                          })
                        }
                      >
                        <Trash2 className="h-4 w-4" /> Remove
                      </Button>
                    </div>
                  </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Step name" description="Use a business name users will recognize in their task list.">
                    <FormInput
                      value={step.stepName}
                      onChange={(event) =>
                        updateStep(ruleIndex, stepIndex, {
                          ...step,
                          stepName: event.target.value,
                        })
                      }
                    />
                  </Field>
                  <Field
                    label="Action type"
                    description={optionDescription(stepTypeOptions, step.stepType)}
                  >
                    <FormSelect
                      value={step.stepType}
                      onChange={(event) =>
                        updateStep(ruleIndex, stepIndex, {
                          ...step,
                          stepType: event.target.value as WorkflowStepDraft['stepType'],
                        })
                      }
                    >
                      {stepTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </FormSelect>
                  </Field>
                  <Field
                    label="Who handles this step"
                    description={optionDescription(
                      assigneeTypeOptions,
                      step.assigneeType,
                    )}
                  >
                    <FormSelect
                      value={step.assigneeType}
                      onChange={(event) => {
                        const assigneeType = event.target
                          .value as WorkflowStepDraft['assigneeType']
                        updateStep(ruleIndex, stepIndex, {
                          ...step,
                          assigneeType,
                          assigneeRoleSlug:
                            assigneeType === 'ROLE' ? roleOptions[0] : undefined,
                          assigneeUserId: undefined,
                          assigneeFieldPath:
                            assigneeType === 'CUSTOM_FIELD_USER'
                              ? userFields[0]?.key
                              : undefined,
                        })
                      }}
                    >
                      {assigneeTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </FormSelect>
                  </Field>
                  {step.assigneeType === 'ROLE' ? (
                    <Field label="Role queue" description="The task appears for users who have this role.">
                      <FormSelect
                        value={step.assigneeRoleSlug ?? ''}
                        onChange={(event) =>
                          updateStep(ruleIndex, stepIndex, {
                            ...step,
                            assigneeRoleSlug: event.target.value || undefined,
                            assigneeUserId: undefined,
                            assigneeFieldPath: undefined,
                          })
                        }
                      >
                        <option value="">Select role</option>
                        {roleOptions.map((role) => (
                          <option key={role} value={role}>
                            {formatRoleLabel(role)}
                          </option>
                        ))}
                      </FormSelect>
                    </Field>
                  ) : null}
                  {step.assigneeType === 'USER' ? (
                    <Field label="Specific user" description="The task appears only for this person.">
                      <FormSelect
                        value={step.assigneeUserId ?? ''}
                        disabled={usersLoading}
                        onChange={(event) =>
                          updateStep(ruleIndex, stepIndex, {
                            ...step,
                            assigneeRoleSlug: undefined,
                            assigneeUserId: event.target.value || undefined,
                            assigneeFieldPath: undefined,
                          })
                        }
                      >
                        <option value="">
                          {usersLoading ? 'Loading users...' : 'Select user'}
                        </option>
                        {step.assigneeUserId &&
                        !users.some((user) => user.id === step.assigneeUserId) ? (
                          <option value={step.assigneeUserId}>
                            Selected user ID: {step.assigneeUserId}
                          </option>
                        ) : null}
                        {users.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name} &lt;{user.email}&gt;
                          </option>
                        ))}
                      </FormSelect>
                    </Field>
                  ) : null}
                  {step.assigneeType === 'CUSTOM_FIELD_USER' ? (
                    <Field
                      label="Event user field"
                      description="The event payload must contain a user ID at this field path."
                    >
                      <FormSelect
                        value={step.assigneeFieldPath ?? ''}
                        onChange={(event) =>
                          updateStep(ruleIndex, stepIndex, {
                            ...step,
                            assigneeRoleSlug: undefined,
                            assigneeUserId: undefined,
                            assigneeFieldPath: event.target.value || undefined,
                          })
                        }
                      >
                        <option value="">Select event user field</option>
                        {userFields.map((field) => (
                          <option key={field.key} value={field.key}>
                            {field.key}
                          </option>
                        ))}
                      </FormSelect>
                      {userFields.length === 0 ? (
                        <p className="mt-1 text-xs text-[var(--destructive)]">
                          This event has no user field configured for assignment.
                        </p>
                      ) : null}
                    </Field>
                  ) : null}
                  <Field label="SLA hours" description="How long this step should remain open before it is late.">
                    <FormInput
                      type="number"
                      min={1}
                      value={step.slaHours ?? ''}
                      onChange={(event) =>
                        updateStep(ruleIndex, stepIndex, {
                          ...step,
                          slaHours: Number(event.target.value) || undefined,
                        })
                      }
                    />
                  </Field>
                </div>
                <div className="mt-4 grid gap-3 border-t border-[var(--border)] pt-4 sm:grid-cols-2 lg:grid-cols-3">
                  <FormCheckbox
                    label="Required step"
                    description="The workflow cannot finish without this step."
                    checked={step.isRequired}
                    onChange={(event) =>
                      updateStep(ruleIndex, stepIndex, {
                        ...step,
                        isRequired: event.target.checked,
                      })
                    }
                  />
                  <FormCheckbox
                    label="Requires comment"
                    description="Actor must write a note before action."
                    checked={step.requiresComment}
                    onChange={(event) =>
                      updateStep(ruleIndex, stepIndex, {
                        ...step,
                        requiresComment: event.target.checked,
                      })
                    }
                  />
                  <FormCheckbox
                    label="Can reject"
                    description="Actor may reject the whole workflow."
                    checked={step.canReject}
                    onChange={(event) =>
                      updateStep(ruleIndex, stepIndex, {
                        ...step,
                        canReject: event.target.checked,
                      })
                    }
                  />
                </div>
                </div>
              ))}
            </div>
            <Button
              type="button"
              size="sm"
              className="mx-4 mb-4"
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
                      canReject: true,
                      canReassign: false,
                      slaHours: 24,
                    },
                  ],
                })
              }
            >
              <Plus className="h-4 w-4" /> Add approval step
            </Button>
          </section>
        )
      })}
    </div>
  )
}

function WorkflowPreview({
  draft,
  users,
}: {
  draft: WorkflowDraft
  users: UserResponseDto[]
}) {
  const [expandedRules, setExpandedRules] = useState<Record<number, boolean>>({
    0: true,
  })
  const triggerSummary =
    draft.triggerMode === 'always'
      ? 'Runs for every matching event.'
      : draft.triggerConditions.conditions.length > 0
        ? draft.triggerConditions.conditions
            .map(
              (condition) =>
                `${condition.field} ${condition.operator} ${formatValue(condition.value)}`,
            )
            .join(', ')
        : 'Needs trigger condition.'

  return (
    <div className="rounded-md border border-[var(--border)] bg-white p-4">
      <div className="border-b border-[var(--border)] pb-3">
        <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
          Live workflow preview
        </p>
        <h2 className="mt-1 text-base font-semibold text-[var(--foreground)]">
          {draft.template.name || 'Untitled workflow'}
        </h2>
        <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">
          {draft.template.moduleName} / {draft.template.eventName}
        </p>
      </div>
      <div className="space-y-4 pt-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-3)]">
            Trigger
          </p>
          <p className="mt-1 text-sm leading-5 text-[var(--ink-2)]">
            {triggerSummary}
          </p>
        </div>
        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-3)]">
            Approval paths
          </p>
          {draft.rules.map((rule, ruleIndex) => {
            const ruleName = rule.name || `Rule ${ruleIndex + 1}`
            const isExpanded = expandedRules[ruleIndex] ?? ruleIndex === 0
            const conditionText = rule.isFallback
              ? 'Fallback path when no earlier rule matches.'
              : rule.conditionJson?.conditions.length
                ? rule.conditionJson.conditions
                    .map(
                      (condition) =>
                        `${condition.field} ${condition.operator} ${formatValue(
                          condition.value,
                        )}`,
                    )
                    .join(', ')
                : 'Needs rule condition.'

            return (
              <div
                key={ruleIndex}
                className="overflow-hidden rounded-md border border-[var(--border)] bg-[var(--surface-2)]"
              >
                <button
                  aria-expanded={isExpanded}
                  aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${ruleName} approval path preview`}
                  className="flex w-full items-start justify-between gap-3 p-3 text-left transition hover:bg-white/70"
                  type="button"
                  onClick={() =>
                    setExpandedRules((current) => ({
                      ...current,
                      [ruleIndex]: !isExpanded,
                    }))
                  }
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-[var(--foreground)]">
                        {ruleName}
                      </span>
                      <span className="rounded-full bg-white px-2 py-1 font-mono text-[10px] text-[var(--ink-3)]">
                        Priority {rule.priority}
                      </span>
                      {rule.isFallback ? (
                        <span className="rounded-full border border-[var(--warning)] bg-[var(--warning-soft)] px-2 py-1 font-mono text-[10px] text-[var(--warning)]">
                          Fallback
                        </span>
                      ) : null}
                    </div>
                    <span className="mt-1 block text-xs leading-5 text-[var(--muted-foreground)]">
                      {conditionText}
                    </span>
                  </div>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="rounded-full bg-white px-2 py-1 font-mono text-[10px] text-[var(--ink-3)]">
                      {rule.steps.length} steps
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-[var(--ink-3)]" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-[var(--ink-3)]" />
                    )}
                  </span>
                </button>
                {isExpanded ? (
                  <div className="border-t border-[var(--border)] bg-white p-3">
                    <ol className="space-y-0">
                      {rule.steps.length > 0 ? (
                        rule.steps.map((item, stepIndex) => {
                          const assigneeText = describeWorkflowAssignee(item, users)
                          const needsAssignment = assigneeText === 'Needs assignment'
                          const stepTypeLabel =
                            stepTypeOptions.find(
                              (option) => option.value === item.stepType,
                            )?.label ?? item.stepType
                          const isLastStep = stepIndex === rule.steps.length - 1

                          return (
                            <li
                              key={stepIndex}
                              className="grid grid-cols-[32px_1fr] gap-3"
                            >
                              <div className="flex flex-col items-center">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--primary)] bg-[var(--primary)] font-mono text-[10px] font-semibold text-white">
                                  {stepIndex + 1}
                                </span>
                                {!isLastStep ? (
                                  <span className="h-full min-h-8 w-px bg-[var(--border)]" />
                                ) : null}
                              </div>
                              <div className={isLastStep ? '' : 'pb-4'}>
                                <div className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-3">
                                  <div className="flex flex-wrap items-start justify-between gap-2">
                                    <div className="min-w-0">
                                      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-3)]">
                                        Step {stepIndex + 1}
                                      </p>
                                      <h4 className="mt-1 text-sm font-semibold text-[var(--foreground)]">
                                        {item.stepName || 'Unnamed step'}
                                      </h4>
                                      <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">
                                        {stepTypeLabel} -{' '}
                                        <span
                                          className={
                                            needsAssignment
                                              ? 'font-semibold text-[var(--destructive)]'
                                              : ''
                                          }
                                        >
                                          {assigneeText}
                                        </span>
                                      </p>
                                    </div>
                                    <Badge
                                      className={
                                        item.canReject
                                          ? 'bg-[var(--warning-soft)] text-[var(--warning)]'
                                          : 'bg-[var(--success-soft)] text-[var(--success)]'
                                      }
                                    >
                                      {item.canReject ? 'Can reject' : 'Approve only'}
                                    </Badge>
                                  </div>
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    {item.slaHours ? (
                                      <span className="rounded-full border border-[var(--border)] bg-white px-2 py-1 font-mono text-[10px] text-[var(--ink-3)]">
                                        SLA {item.slaHours}h
                                      </span>
                                    ) : null}
                                    {item.requiresComment ? (
                                      <span className="rounded-full border border-[var(--border)] bg-white px-2 py-1 font-mono text-[10px] text-[var(--ink-3)]">
                                        Comment required
                                      </span>
                                    ) : null}
                                    {item.canReassign ? (
                                      <span className="rounded-full border border-[var(--border)] bg-white px-2 py-1 font-mono text-[10px] text-[var(--ink-3)]">
                                        Reassign allowed
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                              </div>
                            </li>
                          )
                        })
                      ) : (
                        <li className="text-sm text-[var(--destructive)]">
                          Add at least one approval-chain item for this rule.
                        </li>
                      )}
                    </ol>
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function Outcomes({
  draft,
  setDraft,
}: {
  draft: WorkflowDraft
  setDraft: (draft: WorkflowDraft) => void
}) {
  const isExpenseWorkflow = draft.template.moduleName === 'expenses'
  const isBillingWorkflow = draft.template.moduleName === 'billing'

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field label="Approved status">
        <FormInput value={String(draft.approvedActionsJson.setStatus ?? '')} onChange={(event) => setDraft({ ...draft, approvedActionsJson: { ...draft.approvedActionsJson, setStatus: event.target.value } })} />
      </Field>
      <Field label="Rejected status">
        <FormInput value={String(draft.rejectedActionsJson.setStatus ?? '')} onChange={(event) => setDraft({ ...draft, rejectedActionsJson: { ...draft.rejectedActionsJson, setStatus: event.target.value } })} />
      </Field>
      {isExpenseWorkflow ? (
        <FormCheckbox
          label="Create payment request after expense approval"
          checked={Boolean(draft.approvedActionsJson.createPaymentRequest)}
          onChange={(event) => setDraft({ ...draft, approvedActionsJson: { ...draft.approvedActionsJson, createPaymentRequest: event.target.checked } })}
        />
      ) : null}
      {isBillingWorkflow ? (
        <FormCheckbox
          label="Create invoice after billing approval"
          checked={Boolean(draft.approvedActionsJson.createInvoice)}
          onChange={(event) => setDraft({ ...draft, approvedActionsJson: { ...draft.approvedActionsJson, createInvoice: event.target.checked } })}
        />
      ) : null}
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

export function ResetBuilderStatePage() {
  useWorkflowBuilderStore.getState().setDraft(createDefaultWorkflowDraft())
  return <WorkflowBuilderPage />
}
