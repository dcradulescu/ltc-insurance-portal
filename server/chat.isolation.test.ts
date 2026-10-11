import { describe, expect, it, vi } from "vitest";
import { MySqlDialect } from "drizzle-orm/mysql-core";
import { chatRouter } from "./routers/chat";
import { getDb } from "./db";
vi.mock("./db", async original => ({ ...await original<typeof import("./db")>(), getDb: vi.fn() }));
it("scopes chat history by the authenticated user even when a session ID is shared", async () => {
  let where: any;
  const chain: any = {
    from: () => chain, where: (condition: any) => { where = condition; return chain; }, orderBy: () => chain,
    limit: async () => {
      const query = new MySqlDialect().sqlToQuery(where);
      expect(query.sql).toContain('`chatMessages`.`userId` = ?');
      expect(query.params).toEqual(["known-session", 7]);
      return [{ role: "user", content: "Account 7 only" }];
    },
  };
  vi.mocked(getDb).mockResolvedValue({ select: () => chain } as any);
  const caller = chatRouter.createCaller({ user: { id: 7 }, req: { headers: {} }, res: {} } as any);
  expect(await caller.getHistory({ sessionId: "known-session" })).toEqual([{ role: "user", content: "Account 7 only" }]);
});
