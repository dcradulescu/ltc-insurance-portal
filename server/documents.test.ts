import { beforeEach, describe, it, expect, vi } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";
import { storagePut } from "./storage";
import * as claimMilestones from "./claimMilestones";
vi.mock("./claimMilestones", () => ({
  recordClaimMilestone: vi.fn(),
  listClaimMilestones: vi.fn().mockResolvedValue([]),
  hasDocumentedCarrierApproval: vi.fn().mockResolvedValue(false),
  isDocumentClaimEvidence: vi.fn().mockResolvedValue(false),
}));
vi.mock("./db", async original => ({ ...await original<typeof import("./db")>(),
  getDocumentsByUserId: vi.fn(), getDocumentsByTaskId: vi.fn(), createDocumentUpload: vi.fn(), deleteDocument: vi.fn(),
  updateDocumentTaskLink: vi.fn(), getPolicyById: vi.fn(), getStrategyById: vi.fn(),
}));
vi.mock("./storage", () => ({ storagePut: vi.fn(), getSignedStorageUrl: vi.fn() }));
const caller = appRouter.createCaller({ user: { id: 7, email: "account@example.com" }, req: { headers: {} }, res: {} } as any);
const input = { fileName: "Policy.pdf", fileData: Buffer.from("%PDF-1.4\nExample").toString("base64"), mimeType: "application/pdf", category: "Insurance Policy" };
const stored = { id: 17, userId: 7, policyId: null, strategyId: null, taskId: null, category: "Insurance Policy", fileName: "Policy 2026.pdf", fileUrl: "https://old-public.example/document", fileKey: "users/7/documents/abc", mimeType: "application/pdf", fileSize: 1200, createdAt: new Date("2026-10-08T12:00:00Z") };
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(db.updateDocumentTaskLink).mockResolvedValue(true);
  vi.mocked(claimMilestones.isDocumentClaimEvidence).mockResolvedValue(false);
  vi.mocked(db.getPolicyById).mockResolvedValue({ id: 10, userId: 7 } as any);
  vi.mocked(db.getStrategyById).mockResolvedValue({ id: 20, userId: 7, policyId: 10, stage1Tasks: [{ id: "s1-1", label: "Gather policy" }] } as any);
  vi.mocked(db.getDocumentsByUserId).mockResolvedValue([stored]);
  vi.mocked(db.getDocumentsByTaskId).mockResolvedValue([stored]);
  vi.mocked(db.createDocumentUpload).mockResolvedValue(17);
  vi.mocked(storagePut).mockResolvedValue({ key: "users/7/documents/new", url: "/storage/users/7/documents/new" });
});
describe("document workflow", () => {
  it("registers a valid upload under the authenticated account", async () => {
    expect(await caller.documents.upload(input)).toMatchObject({ id: 17, status: "uploaded", fileSize: 16 });
    expect(storagePut).toHaveBeenCalledWith(expect.stringMatching(/^users\/7\/documents\//), expect.any(Buffer), "application/pdf", 7);
    expect(db.createDocumentUpload).toHaveBeenCalledWith(expect.objectContaining({ userId: 7, fileName: "Policy.pdf", policyId: null }));
  });
  it.each([
    { fileData: "" }, { fileData: "%%%" }, { mimeType: "text/html" },
    { category: "Unknown category" }, { category: "Identification" }, { policyId: 0 },
  ])("rejects invalid input before storage: %j", async patch => {
    await expect(caller.documents.upload({ ...input, ...patch })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(storagePut).not.toHaveBeenCalled(); expect(db.createDocumentUpload).not.toHaveBeenCalled();
  });
  it("rejects oversized encoded content before writing", async () => {
    await expect(caller.documents.upload({ ...input, fileData: "A".repeat(Math.ceil(52428800 / 3) * 4 + 4) })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(storagePut).not.toHaveBeenCalled();
  });
  it("replaces legacy public file URLs with account-authorized download links in every read", async () => {
    for (const docs of [await caller.documents.list(), await caller.documents.listByCategory({ category: "Insurance Policy" }), await caller.documents.listByTask({ strategyId: 20, taskId: "s1-1" }), [await caller.documents.get({ id: 17 })]]) {
      expect(docs[0].fileUrl).toBe("/storage/users/7/documents/abc?filename=Policy%202026.pdf");
    }
    expect(db.getDocumentsByTaskId).toHaveBeenCalledWith("s1-1", 7, 20);
  });
  it("does not manufacture an empty list when the database fails", async () => {
    vi.mocked(db.getDocumentsByUserId).mockRejectedValueOnce(new Error("DB unavailable"));
    await expect(caller.documents.list()).rejects.toThrow("DB unavailable");
  });
  it("does not create document metadata after object upload failure", async () => {
    vi.mocked(storagePut).mockRejectedValueOnce(new Error("Storage unavailable"));
    await expect(caller.documents.upload(input)).rejects.toThrow("Storage unavailable");
    expect(db.createDocumentUpload).not.toHaveBeenCalled();
  });
  it("removes only an owned document and awaits the database result", async () => {
    expect(await caller.documents.delete({ id: 17 })).toEqual({ success: true });
    expect(db.deleteDocument).toHaveBeenCalledWith(17, 7);
    vi.mocked(db.deleteDocument).mockRejectedValueOnce(new Error("Removal failed"));
    await expect(caller.documents.delete({ id: 17 })).rejects.toThrow("Removal failed");
  });
  it("protects documents referenced by immutable claim milestones", async () => {
    vi.mocked(claimMilestones.isDocumentClaimEvidence).mockResolvedValueOnce(true);
    await expect(caller.documents.delete({id:17})).rejects.toMatchObject({code:"CONFLICT"});
    expect(db.deleteDocument).not.toHaveBeenCalled();
  });
  it("denies lookup and removal of documents outside the account", async () => {
    await expect(caller.documents.get({ id: 99 })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(caller.documents.delete({ id: 99 })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(db.deleteDocument).not.toHaveBeenCalled();
  });
  it("preflight rejects empty files and a category/type mismatch", async () => {
    const result = await caller.documents.validateFile({ fileName: "record.pdf", fileSize: 0, mimeType: "application/pdf", category: "Identification" });
    expect(result.valid).toBe(false); expect(result.errors).toHaveLength(2);
  });
});

describe("task document associations", () => {
  it("derives the policy from the owned strategy", async () => {
    await caller.documents.upload({ ...input, strategyId: 20, taskId: "s1-1" });
    expect(db.createDocumentUpload).toHaveBeenCalledWith(expect.objectContaining({ policyId: 10, strategyId: 20, taskId: "s1-1" }));
  });
  it("returns a verified label and scopes repeated task IDs by strategy", async () => {
    expect(await caller.documents.taskDocuments({ strategyId: 20, taskId: "s1-1" })).toMatchObject({ taskLabel: "Gather policy", policyId: 10 });
    expect(db.getDocumentsByTaskId).toHaveBeenCalledWith("s1-1", 7, 20);
  });
  it.each([{ taskId: "s1-1" }, { strategyId: 20, taskId: "unknown" }, { strategyId: 20, taskId: "" }, { strategyId: 20, policyId: 11, taskId: "s1-1" }])("rejects invalid association before storage: %j", async patch => {
    vi.mocked(db.getPolicyById).mockImplementation(async id => ({ id, userId: 7 }) as any);
    await expect(caller.documents.upload({ ...input, ...patch })).rejects.toThrow();
    expect(storagePut).not.toHaveBeenCalled();
  });
  it("denies another account's strategy for both reads and uploads", async () => {
    vi.mocked(db.getStrategyById).mockResolvedValue({ id: 20, userId: 8, policyId: 10 } as any);
    await expect(caller.documents.taskDocuments({ strategyId: 20, taskId: "s1-1" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(caller.documents.upload({ ...input, strategyId: 20, taskId: "s1-1" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(db.getDocumentsByTaskId).not.toHaveBeenCalled(); expect(storagePut).not.toHaveBeenCalled();
  });
  it("does not query documents for a removed task", async () => {
    await expect(caller.documents.taskDocuments({ strategyId: 20, taskId: "removed" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(db.getDocumentsByTaskId).not.toHaveBeenCalled();
  });
});

describe("attach existing documents and detach without deletion", () => {
  const target = { strategyId: 20, taskId: "s1-1", documentId: 17 };
  const attached = { ...stored, policyId: 10, strategyId: 20, taskId: "s1-1" };
  it("lists only available documents with a compatible policy and strategy", async () => {
    vi.mocked(db.getDocumentsByUserId).mockResolvedValue([
      stored, { ...stored, id: 18, policyId: 10 }, { ...stored, id: 19, policyId: 11 },
      { ...stored, id: 20, strategyId: 21 }, { ...attached, id: 21 },
      { ...stored, id: 22, policyId: 10, strategyId: 20 },
    ]);
    expect((await caller.documents.availableForTask(target)).map(doc => doc.id)).toEqual([17, 18, 22]);
  });
  it("attaches an account file without another object upload", async () => {
    expect(await caller.documents.attachToTask(target)).toEqual({ success: true });
    expect(db.updateDocumentTaskLink).toHaveBeenCalledWith(stored, { policyId: 10, strategyId: 20, taskId: "s1-1" });
    expect(storagePut).not.toHaveBeenCalled(); expect(db.createDocumentUpload).not.toHaveBeenCalled();
  });
  it("treats a retry of the same attachment as success", async () => {
    vi.mocked(db.getDocumentsByUserId).mockResolvedValue([attached]);
    await expect(caller.documents.attachToTask(target)).resolves.toEqual({ success: true });
    expect(db.updateDocumentTaskLink).not.toHaveBeenCalled();
  });
  it.each([{ policyId: 11 }, { strategyId: 21 }, { taskId: "s1-2" }])("rejects an incompatible existing association: %j", async patch => {
    vi.mocked(db.getDocumentsByUserId).mockResolvedValue([{ ...stored, ...patch }]);
    await expect(caller.documents.attachToTask(target)).rejects.toThrow();
    expect(db.updateDocumentTaskLink).not.toHaveBeenCalled();
  });
  it("rejects a stale attachment after a concurrent change", async () => {
    vi.mocked(db.updateDocumentTaskLink).mockResolvedValue(false);
    await expect(caller.documents.attachToTask(target)).rejects.toMatchObject({ code: "CONFLICT" });
  });
  it("detaches while preserving policy and file access", async () => {
    vi.mocked(db.getDocumentsByUserId).mockResolvedValue([attached]);
    await expect(caller.documents.detachFromTask(target)).resolves.toEqual({ success: true });
    expect(db.updateDocumentTaskLink).toHaveBeenCalledWith(attached, { policyId: 10, strategyId: null, taskId: null });
    expect(db.deleteDocument).not.toHaveBeenCalled(); expect(storagePut).not.toHaveBeenCalled();
  });
  it("rejects detaching from a different task", async () => {
    vi.mocked(db.getDocumentsByUserId).mockResolvedValue([attached]);
    await expect(caller.documents.detachFromTask({ ...target, taskId: "s1-2" })).rejects.toMatchObject({ code: "CONFLICT" });
    expect(db.updateDocumentTaskLink).not.toHaveBeenCalled();
  });
  it("rejects a stale detach after a concurrent change", async () => {
    vi.mocked(db.getDocumentsByUserId).mockResolvedValue([attached]);
    vi.mocked(db.updateDocumentTaskLink).mockResolvedValue(false);
    await expect(caller.documents.detachFromTask(target)).rejects.toMatchObject({ code: "CONFLICT" });
  });
  it.each(["attachToTask", "detachFromTask"] as const)("denies foreign documents in %s", async action => {
    vi.mocked(db.getDocumentsByUserId).mockResolvedValue([]);
    await expect(caller.documents[action](target)).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(db.updateDocumentTaskLink).not.toHaveBeenCalled();
  });
  it.each(["availableForTask", "attachToTask", "detachFromTask"] as const)("denies foreign strategies in %s", async action => {
    vi.mocked(db.getStrategyById).mockResolvedValue({ id: 20, userId: 8, policyId: 10 } as any);
    await expect(caller.documents[action](target)).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(db.updateDocumentTaskLink).not.toHaveBeenCalled();
  });
});
