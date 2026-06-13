import { Link,useParams } from '@tanstack/react-router'
import {
ArrowLeft,
Pencil
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { hasPermission } from '@/features/auth/auth-routing'
import type {
ExpenseResponseDto,
WorkflowInstanceResponseDto
} from '@/lib/api/gen'
import { useExpensesControllerFindOne,useWorkflowRuntimeControllerFindOne } from '@/lib/api/gen'
import {
formatDate,
formatValue,
unwrapData
} from '@/lib/format'
import {
EmptyState,
ErrorNotice,
PageHeader,
SectionHeading,
SummaryValue,
WorkflowProgressSection
} from '@/pages/utils/page-components'
import {
describeUserReference,
formatOptionalDate,
readableValue,
workflowIdFromExpense
} from '@/pages/utils/page-helpers'
import { useAuthStore } from '@/stores/auth-store'

export function ExpenseDetailPage() {
  const user = useAuthStore((state) => state.user)
  const { expenseId } = useParams({ strict: false }) as { expenseId: string }
  const query = useExpensesControllerFindOne({ id: expenseId })
  const expense = unwrapData(query.data) as ExpenseResponseDto | undefined
  const workflowId = expense ? workflowIdFromExpense(expense) : undefined
  const workflowQuery = useWorkflowRuntimeControllerFindOne({ id: workflowId })
  const workflow = workflowId
    ? (unwrapData(workflowQuery.data) as WorkflowInstanceResponseDto | undefined)
    : undefined
  const isRequester = expense?.requesterId === user?.id
  const canWriteExpenses = hasPermission(
    user?.roles ?? [],
    user?.permissions ?? [],
    'expenses.write',
  )
  const canEditDraft = canWriteExpenses && isRequester && expense?.status === 'DRAFT'
  const canEditAndResubmit =
    canWriteExpenses && isRequester && expense?.status === 'REJECTED' && expense.canResubmit === true
  const canEdit = canEditDraft || canEditAndResubmit

  return (
    <>
      <PageHeader
        title={expense?.title ?? `Expense ${expenseId}`}
        kicker="Expense detail"
        navigation={
          <Link
            className="inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-sky-200 bg-sky-50 px-3 text-xs font-medium text-sky-700 shadow-sm transition hover:border-sky-300 hover:bg-sky-100"
            to="/expenses"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to expenses
          </Link>
        }
        action={
          canEdit || workflowId ? (
            <div className="flex flex-wrap items-center gap-2">
              {canEdit ? (
                <Button
                  className="border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700"
                  type="button"
                >
                  <Link
                    className="inline-flex items-center gap-2"
                    to="/expenses/$expenseId/edit"
                    params={{ expenseId }}
                  >
                    <Pencil className="h-4 w-4" />
                    {canEditDraft ? 'Edit' : 'Edit and resubmit'}
                  </Link>
                </Button>
              ) : null}
              {workflowId ? (
                <Button
                  className="border-sky-700 bg-sky-600 text-white shadow-sm hover:bg-sky-700"
                  type="button"
                >
                  <Link
                    to="/workflow-instances/$instanceId"
                    params={{ instanceId: workflowId }}
                  >
                    Full workflow detail
                  </Link>
                </Button>
              ) : null}
            </div>
          ) : undefined
        }
      />
      <ErrorNotice error={query.error ?? workflowQuery.error} />
      {expense ? (
        <div className="space-y-5">
          <ExpenseSummary expense={expense} />
          {workflowId ? (
            workflow ? (
              <WorkflowProgressSection instance={workflow} showActions />
            ) : (
              <EmptyState message="Workflow detail is not available yet." />
            )
          ) : (
            <EmptyState message="No workflow has been started for this expense." />
          )}
          <ExpenseTechnicalReference expense={expense} />
        </div>
      ) : null}
    </>
  )
}

function ExpenseSummary({ expense }: { expense: ExpenseResponseDto }) {
  const requester = describeUserReference([], expense.requester ?? expense.requesterId)
  const createdBy = describeUserReference([], expense.createdBy ?? expense.createdById)

  return (
    <section className="rounded-lg border border-[var(--border)] bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Badge>{expense.status}</Badge>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryValue label="Requester" value={formatValue(requester)} />
        <SummaryValue label="Category" value={expense.category} />
        <SummaryValue label="Amount" value={`${expense.amount} ${expense.currency}`} />
        <SummaryValue label="Vendor" value={formatValue(readableValue(expense.vendor))} />
        <SummaryValue label="Submitted" value={formatOptionalDate(expense.submittedAt)} />
        <SummaryValue label="Approved" value={formatOptionalDate(expense.approvedAt)} />
        <SummaryValue label="Rejected" value={formatOptionalDate(expense.rejectedAt)} />
        <SummaryValue label="Paid" value={formatOptionalDate(expense.paidAt)} />
        <SummaryValue label="Created" value={formatDate(expense.createdAt)} />
        <SummaryValue label="Updated" value={formatDate(expense.updatedAt)} />
      </div>
      {readableValue(expense.description) ? (
        <div className="mt-4 rounded-md border border-[var(--border)] bg-white p-3 text-sm leading-6 text-black">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-3)]">
            Description
          </p>
          <p className="mt-1 text-black">{readableValue(expense.description)}</p>
        </div>
      ) : null}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryValue label="Request created by" value={formatValue(createdBy)} />
      </div>
      {readableValue(expense.rejectionReason) ? (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-800">
          Rejection reason: {readableValue(expense.rejectionReason)}
        </div>
      ) : null}
    </section>
  )
}

function ExpenseTechnicalReference({
  expense,
}: {
  expense: ExpenseResponseDto
}) {
  return (
    <section className="rounded-lg border border-[var(--border)] bg-white p-4 shadow-sm">
      <SectionHeading label="Technical metadata" title="Reference" />
      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryValue label="Expense ID" value={expense.id} />
        <SummaryValue label="Department" value={formatValue(readableValue(expense.departmentId))} />
        <SummaryValue label="Workflow ID" value={formatValue(workflowIdFromExpense(expense))} />
      </div>
    </section>
  )
}
