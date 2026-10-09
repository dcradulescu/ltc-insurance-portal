import { validatePolicyStep } from "./policyFormState";

export function isStrategyPolicyComplete(policy: Record<string, unknown> | null | undefined): boolean {
  if (!policy) return false;
  const form = {
    ...policy,
    careNeeds: policy.careNeeds ?? policy.adlLimitations,
    diagnosisCheckboxes: policy.diagnosisCheckboxes ?? (policy.diagnosisOrCondition ? [policy.diagnosisOrCondition] : []),
  };
  return [0, 1, 2, 3, 4].every(step => Object.keys(validatePolicyStep(form, step)).length === 0);
}

export function applyTaskCompletions<T extends { id: string; completed: boolean }>(
  tasks: T[], completions: { taskId: string; completed: boolean }[],
): T[] {
  const saved = new Map(completions.map(completion => [completion.taskId, completion.completed]));
  return tasks.map(task => ({ ...task, completed: saved.get(task.id) ?? task.completed }));
}
