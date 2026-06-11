export type WorkflowUserLike = {
  id: string;
  name: string;
  email: string;
  designation: string | null;
};

export type WorkflowRequestWithStatus<TStatus extends string> = {
  status: TStatus;
  workflowInstanceId: string | null;
};

export function toWorkflowUserResponse(
  user: WorkflowUserLike | null | undefined,
): WorkflowUserLike | null {
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    designation: user.designation,
  };
}

export function toIsoStringOrNull(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

export async function canResubmit<TStatus extends string>(
  request: WorkflowRequestWithStatus<TStatus>,
  rejectedStatus: TStatus,
  allowsResubmission: (workflowInstanceId: string) => Promise<boolean>,
): Promise<boolean> {
  if (
    request.status !== rejectedStatus ||
    request.workflowInstanceId === null
  ) {
    return false;
  }

  const resubmissionAllowed = await allowsResubmission(
    request.workflowInstanceId,
  );

  return resubmissionAllowed;
}
