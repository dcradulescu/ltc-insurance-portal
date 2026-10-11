import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { strategies, taskCompletions } from "../drizzle/schema";

export type CompletionWrite = {
  userId: number;
  strategyId: number;
  taskId: string;
  taskTitle: string;
  stage: number;
  completed: boolean;
};

/**
 * Serializes completion writes on the owning strategy's InnoDB row, including
 * the first insert. A single missing completion row cannot be locked safely.
 *
 * The database uniqueness migration provides the second defense against
 * other writers. If legacy duplicates exist, reject rather than select a
 * potentially stale winner or delete data.
 */
export async function persistTaskCompletionAtomic(
  db: ReturnType<typeof drizzle>,
  input: CompletionWrite,
): Promise<void> {
  const { userId, strategyId, taskId, taskTitle, stage, completed } = input;
  const completedAt = completed ? new Date() : null;
  await db.transaction(async tx => {
    const owned = await tx.select({ id: strategies.id })
      .from(strategies)
      .where(and(eq(strategies.id, strategyId), eq(strategies.userId, userId)))
      .for("update");
    if (owned.length !== 1) {
      throw new Error("Task completion strategy no longer exists or is not owned by the current account");
    }
    const matches = await tx.select({ id: taskCompletions.id })
      .from(taskCompletions)
      .where(and(
        eq(taskCompletions.userId, userId),
        eq(taskCompletions.strategyId, strategyId),
        eq(taskCompletions.taskId, taskId),
      ))
      .limit(2);
    if (matches.length > 1) {
      throw new Error("Duplicate completion records require reviewed database remediation");
    }
    if (matches.length === 1) {
      await tx.update(taskCompletions)
        .set({ taskTitle, stage, completed, completedAt })
        .where(and(eq(taskCompletions.id, matches[0].id), eq(taskCompletions.userId, userId)));
    } else {
      await tx.insert(taskCompletions).values({
        userId, strategyId, taskId, taskTitle, stage, completed, completedAt,
      });
    }
  });
}
