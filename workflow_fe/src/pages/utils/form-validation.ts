import { z } from 'zod/v4'

import {
  type CreateBillingRequestDto,
  type CreateExpenseDto,
  type CreateLeaveDto,
  type ResubmitBillingRequestDto,
  type ResubmitExpenseDto,
  type ResubmitLeaveDto,
} from '@/lib/api/gen'
import { createBillingRequestDtoSchema } from '@/lib/api/gen/zod/createBillingRequestDtoSchema'
import { createExpenseDtoSchema } from '@/lib/api/gen/zod/createExpenseDtoSchema'
import { createLeaveDtoSchema } from '@/lib/api/gen/zod/createLeaveDtoSchema'
import { resubmitBillingRequestDtoSchema } from '@/lib/api/gen/zod/resubmitBillingRequestDtoSchema'
import { resubmitExpenseDtoSchema } from '@/lib/api/gen/zod/resubmitExpenseDtoSchema'
import { resubmitLeaveDtoSchema } from '@/lib/api/gen/zod/resubmitLeaveDtoSchema'

const requiredText = (label: string) => z.string().trim().min(1, `${label} is required`)

const nonNegativeNumberText = (label: string) =>
  requiredText(label).refine((value) => {
    const numberValue = Number(value)
    return Number.isFinite(numberValue) && numberValue >= 0
  }, `${label} must be 0 or greater`)

const positiveNumberText = (label: string) =>
  requiredText(label).refine((value) => {
    const numberValue = Number(value)
    return Number.isFinite(numberValue) && numberValue >= 1
  }, `${label} must be at least 1`)

const optionalEmail = z
  .string()
  .trim()
  .refine((value) => value === '' || z.email().safeParse(value).success, {
    message: 'Customer email must be valid',
  })

export const expenseFormSchema = z.object({
  title: requiredText('Title'),
  amount: nonNegativeNumberText('Amount'),
  category: requiredText('Category'),
  currency: requiredText('Currency'),
  description: z.string().trim(),
  vendor: z.string().trim(),
})

export const leaveFormSchema = z.object({
  leaveType: requiredText('Leave type'),
  leaveDays: positiveNumberText('Leave days'),
  startDate: requiredText('Start date'),
  endDate: requiredText('End date'),
  reason: z.string().trim(),
})

export const billingFormSchema = z.object({
  title: requiredText('Title'),
  customerName: requiredText('Customer name'),
  customerEmail: optionalEmail,
  customerAddress: z.string().trim(),
  amount: nonNegativeNumberText('Amount'),
  currency: requiredText('Currency'),
  billingCategory: requiredText('Category'),
  description: z.string().trim(),
})

export const workflowBuilderSaveSchema = z.object({
  templateName: requiredText('Workflow name'),
})

export type ExpenseFormValues = z.input<typeof expenseFormSchema>
export type LeaveFormValues = z.input<typeof leaveFormSchema>
export type BillingFormValues = z.input<typeof billingFormSchema>

export function fieldError(errors: unknown[]) {
  return errors
    .map((error) =>
      error && typeof error === 'object' && 'message' in error
        ? String(error.message)
        : String(error),
    )
    .join(', ')
}

export function toCreateExpensePayload(value: ExpenseFormValues): CreateExpenseDto {
  const parsed = expenseFormSchema.parse(value)

  return createExpenseDtoSchema.parse({
    title: parsed.title,
    amount: Number(parsed.amount),
    category: parsed.category,
    currency: parsed.currency,
    description: parsed.description || undefined,
    vendor: parsed.vendor || undefined,
  })
}

export function toResubmitExpensePayload(value: ExpenseFormValues): ResubmitExpenseDto {
  const parsed = expenseFormSchema.parse(value)

  return resubmitExpenseDtoSchema.parse({
    title: parsed.title,
    amount: Number(parsed.amount),
    category: parsed.category,
    currency: parsed.currency,
    description: parsed.description || undefined,
    vendor: parsed.vendor || undefined,
  })
}

export function toCreateLeavePayload(value: LeaveFormValues): CreateLeaveDto {
  const parsed = leaveFormSchema.parse(value)

  return createLeaveDtoSchema.parse({
    leaveType: parsed.leaveType,
    leaveDays: Number(parsed.leaveDays),
    startDate: parsed.startDate,
    endDate: parsed.endDate,
    reason: parsed.reason || undefined,
  })
}

export function toResubmitLeavePayload(value: LeaveFormValues): ResubmitLeaveDto {
  const parsed = leaveFormSchema.parse(value)

  return resubmitLeaveDtoSchema.parse({
    leaveType: parsed.leaveType,
    leaveDays: Number(parsed.leaveDays),
    startDate: parsed.startDate,
    endDate: parsed.endDate,
    reason: parsed.reason || undefined,
  })
}

export function toCreateBillingPayload(value: BillingFormValues): CreateBillingRequestDto {
  const parsed = billingFormSchema.parse(value)

  return createBillingRequestDtoSchema.parse({
    title: parsed.title,
    customerName: parsed.customerName,
    amount: Number(parsed.amount),
    currency: parsed.currency,
    billingCategory: parsed.billingCategory,
    customerEmail: parsed.customerEmail || undefined,
    customerAddress: parsed.customerAddress || undefined,
    description: parsed.description || undefined,
  })
}

export function toResubmitBillingPayload(
  value: BillingFormValues,
): ResubmitBillingRequestDto {
  const parsed = billingFormSchema.parse(value)

  return resubmitBillingRequestDtoSchema.parse({
    title: parsed.title,
    customerName: parsed.customerName,
    amount: Number(parsed.amount),
    currency: parsed.currency,
    billingCategory: parsed.billingCategory,
    customerEmail: parsed.customerEmail || undefined,
    customerAddress: parsed.customerAddress || undefined,
    description: parsed.description || undefined,
  })
}
