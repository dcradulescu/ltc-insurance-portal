import { describe, expect, it } from "vitest";
import { persistTaskCompletionAtomic, type CompletionWrite } from "./taskCompletionAtomic";
import { strategies, taskCompletions } from "../drizzle/schema";

const normal: CompletionWrite = {
  userId: 7, strategyId: 30, taskId: "s1-1",
  taskTitle: "Collect policy documents", stage: 1, completed: true,
};
type Completion = { id: number; taskId: string; completed: boolean; taskTitle: string | null };
function fakeDatabase(options: { owns?: boolean; rows?: Completion[] } = {}) {
  const actions: string[] = [];
  const rows = options.rows ? [...options.rows] : [];
  let nextId = rows.length + 100;
  let queue: Promise<void> = Promise.resolve();
  const tx = {
    select: () => ({
      from: (table: unknown) => ({
        where: () => ({
          for: async (mode: string) => {
            actions.push("lock:" + mode);
            return options.owns === false ? [] : [{ id: 30 }];
          },
          limit: async (max: number) => {
            actions.push("read:" + max);
            return table === taskCompletions ? rows.slice(0, max).map(r => ({ id: r.id })) : [];
          },
        }),
      }),
    }),
    update: (table: unknown) => ({
      set: (fields: { completed: boolean; taskTitle: string }) => ({
        where: async () => {
          actions.push("update");
          if (table !== taskCompletions) throw new Error("Unexpected update table");
          for (const row of rows) {
            row.completed = fields.completed;
            row.taskTitle = fields.taskTitle;
          }
        },
      }),
    }),
    insert: (table: unknown) => ({
      values: async (fields: CompletionWrite) => {
        actions.push("insert");
        if (table !== taskCompletions) throw new Error("Unexpected insert table");
        rows.push({ id: nextId++, taskId: fields.taskId, completed: fields.completed, taskTitle: fields.taskTitle });
      },
    }),
  };
  const db = {
    transaction: async (callback: (tx: typeof tx) => Promise<void>) => {
      const previous = queue;
      let unlock!: () => void;
      queue = new Promise<void>(resolve => { unlock = resolve; });
      await previous;
      actions.push("begin");
      try {
        const result = await callback(tx);
        actions.push("commit");
        return result;
      } catch (error) {
        actions.push("rollback");
        throw error;
      } finally { unlock(); }
    },
  };
  return { db: db as any, actions, rows };
}
describe("Transactional completion persistence", () => {
  it("locks an owned strategy before inserting the first task completion", async () => {
    const f = fakeDatabase();
    await persistTaskCompletionAtomic(f.db, normal);
    expect(f.actions).toEqual(["begin","lock:update","read:2","insert","commit"]);
    expect(f.rows).toHaveLength(1);
    expect(f.rows[0].completed).toBe(true);
  });
  it("updates the existing completion instead of making a duplicate", async () => {
    const f = fakeDatabase({ rows: [{ id: 15, taskId: normal.taskId, completed: false, taskTitle: "Old title" }] });
    await persistTaskCompletionAtomic(f.db, normal);
    expect(f.actions).toEqual(["begin","lock:update","read:2","update","commit"]);
    expect(f.rows).toHaveLength(1);
    expect(f.rows[0].taskTitle).toBe(normal.taskTitle);
  });
  it("denies completion writes after the strategy loses ownership", async () => {
    const f = fakeDatabase({ owns: false });
    await expect(persistTaskCompletionAtomic(f.db, normal)).rejects.toThrow(/not owned/);
    expect(f.actions).toEqual(["begin","lock:update","rollback"]);
  });
  it("refuses to merge, delete, or arbitrarily choose legacy duplicates", async () => {
    const f = fakeDatabase({ rows: [
      { id: 11, taskId: normal.taskId, completed: true, taskTitle: "A" },
      { id: 12, taskId: normal.taskId, completed: false, taskTitle: "B" },
    ] });
    await expect(persistTaskCompletionAtomic(f.db, normal)).rejects.toThrow(/Duplicate completion/);
    expect(f.actions).toEqual(["begin","lock:update","read:2","rollback"]);
    expect(f.rows).toHaveLength(2);
  });
  it("serializes simultaneous first-write requests through the transaction boundary", async () => {
    const f = fakeDatabase();
    await Promise.all([persistTaskCompletionAtomic(f.db,normal),persistTaskCompletionAtomic(f.db,normal)]);
    expect(f.rows).toHaveLength(1);
    expect(f.actions.filter(a=>a==="insert")).toHaveLength(1);
    expect(f.actions.filter(a=>a==="update")).toHaveLength(1);
    expect(f.actions.filter(a=>a==="commit")).toHaveLength(2);
  });
});
