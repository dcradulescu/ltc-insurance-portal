import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";
import { invokeLLM } from "./_core/llm";
import * as milestoneService from "./claimMilestones";
import * as careService from "./careScenarioPersistence";
vi.mock("./careScenarioPersistence", () => ({
  getSavedCareScenario:vi.fn().mockResolvedValue({
    status:"empty",inputs:null,savedAt:null,policyChanged:false,reason:null,
  }),
  saveOwnedCareScenario:vi.fn().mockResolvedValue({
    status:"needs_review",inputs:null,savedAt:"2026-10-10T12:00:00Z",
    policyChanged:false,reason:"Incomplete draft",
  }),
}));
vi.mock("./claimMilestones", () => ({
  recordClaimMilestone: vi.fn().mockResolvedValue({id:1,kind:"carrier_approval",effectiveDate:"2026-10-10",evidenceLevel:"user_submitted"}),
  listClaimMilestones: vi.fn().mockResolvedValue([]),
  hasDocumentedCarrierApproval: vi.fn().mockResolvedValue(false),
  isDocumentClaimEvidence: vi.fn().mockResolvedValue(false),
}));

vi.mock("./db", async original => ({
  ...await original<typeof import("./db")>(),
  getPolicyById: vi.fn(), getPolicyByUserId: vi.fn(), getStrategyById: vi.fn(), getStrategyByPolicyId: vi.fn(), getStrategyByUserId: vi.fn(),
  getUserContacts: vi.fn().mockResolvedValue([]), getDocumentsByUserId: vi.fn().mockResolvedValue([]), getDocumentsByTaskId: vi.fn().mockResolvedValue([]),
  getTaskCompletions: vi.fn().mockResolvedValue([]), createPolicy: vi.fn(), updatePolicy: vi.fn(), updateStrategy: vi.fn(),
  saveTaskCompletion: vi.fn(), deleteUserContact: vi.fn(), updateUserContact: vi.fn(), createDocumentUpload: vi.fn(), deleteDocument: vi.fn(),
  getSaveLinkByToken: vi.fn(),
}));
vi.mock("./_core/llm", () => ({ invokeLLM: vi.fn() }));
vi.mock("./storage", () => ({ storagePut: vi.fn(), getSignedStorageUrl: vi.fn() }));
const context = (id: number | null, role = "user") => ({ user: id ? { id, role, name: "Client", email: `client${id}@example.com` } : null, req: { headers: {} }, res: {} } as any);
const publicRoutes = new Set(["auth.me", "auth.login", "auth.logout", "system.health", "email.sendContactForm"]);
const protectedPaths = Object.keys(appRouter._def.procedures).filter(path => !publicRoutes.has(path));
function procedure(caller: any, path: string): any { return path.split(".").reduce((value, part) => value[part], caller); }

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(db.getPolicyById).mockResolvedValue({ id: 20, userId: 2 } as any);
  vi.mocked(db.getStrategyById).mockResolvedValue({ id: 30, userId: 2, policyId: 20 } as any);
  vi.mocked(db.getUserContacts).mockResolvedValue([]);
  vi.mocked(db.getDocumentsByUserId).mockResolvedValue([]);
  vi.mocked(milestoneService.hasDocumentedCarrierApproval).mockResolvedValue(false);
  vi.mocked(milestoneService.listClaimMilestones).mockResolvedValue([]);
});
describe("anonymous access inventory", () => {
  it.each(protectedPaths)("rejects anonymous %s before input processing", async path => {
    const result = procedure(appRouter.createCaller(context(null)), path)({});
    await expect(result).rejects.toMatchObject({ code: path.startsWith("sms.send") || path === "system.notifyOwner" ? "FORBIDDEN" : "UNAUTHORIZED" });
  });
});
const crossAccountCases: [string, any][] = [
  ["policy.save", { id: 20, insuredFullName: "Changed" }],
  ["strategy.getByPolicy", { policyId: 20 }],
  ["strategy.generate", { policyId: 20 }],
  ["strategy.generatePhysicianLetter", { policyId: 20 }],
  ["strategy.get", { id: 30 }],
  ["strategy.getTaskCompletions", { strategyId: 30 }],
  ["strategy.getCareScenario", { strategyId: 30 }],
  ["strategy.saveCareScenario", { strategyId: 30, inputs: {
    paymentType:"",termsConfirmed:false,eligibility:"unconfirmed",startDate:"",
    careDays:[],hourlyRate:"",hoursPerDay:"",capType:"",dailyMax:"",
    monthlyMax:"",totalPool:"",remainingPool:"",firstMonthUsed:"",
    eliminationType:"",eliminationRemaining:"",monthlyPremium:"",
    assumeFullWaiver:false,dualWaiver:false,spouseMonthlyPremium:"",
    careInflation:"0",benefitInflation:"none",benefitRate:"",
    inflationScope:"",nextIncrease:"",riderConfirmed:false,originalDaily:"",
    originalMonthly:"",originalPool:"",
  }}],
  ["strategy.saveTaskCompletion", { strategyId: 30, taskId: "t", taskTitle: "Task", stage: 1, completed: true }],
  ["strategy.updateTasks", { strategyId: 30, stage: "stage1Tasks", tasks: [] }],
  ["strategy.listClaimMilestones", {strategyId:30}],
  ["strategy.recordActualMilestone", {strategyId:30,kind:"claim_notice",effectiveDate:"2026-10-10"}],
  ["strategy.recordCarrierApproval", {strategyId:30,effectiveDate:"2026-10-10",carrierReference:"CLM-1",evidenceDocumentId:17,attestationConfirmed:true}],
  ["email.sendStrategy", { strategyId: 30, recipients: ["test@example.com"] }],
  ["chat.send", { policyId: 20, sessionId: "known-session", message: "What is the policy?" }],
  ["contacts.update", { id: 9, name: "Changed" }],
  ["contacts.delete", { id: 9 }],
  ["documents.upload", { policyId: 20, fileName: "policy.pdf", fileData: "dGVzdA==", mimeType: "application/pdf", category: "Insurance Policy" }],
  ["documents.delete", { id: 10 }],
];
describe("cross-account isolation", () => {
  it.each(crossAccountCases)("blocks %s before reads escape or writes occur", async (path, input) => {
    await expect(procedure(appRouter.createCaller(context(1)), path)(input)).rejects.toMatchObject({ code: "NOT_FOUND" });
    for (const fn of [db.updatePolicy, db.updateStrategy, db.saveTaskCompletion, db.deleteUserContact, db.updateUserContact, db.createDocumentUpload, db.deleteDocument, invokeLLM]) expect(fn).not.toHaveBeenCalled();
  });
  it("does not implicitly grant admins access to someone else's records", async () => {
    await expect(appRouter.createCaller(context(1, "admin")).strategy.get({ id: 30 })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
  it("checks the strategy's linked policy as well as the strategy owner", async () => {
    vi.mocked(db.getStrategyById).mockResolvedValue({ id: 30, userId: 1, policyId: 20 } as any);
    await expect(appRouter.createCaller(context(1)).strategy.get({ id: 30 })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
  it("scopes list helpers to the signed-in account", async () => {
    const caller = appRouter.createCaller(context(7));
    await caller.policy.get(); await caller.strategy.getMine(); await caller.contacts.list(); await caller.documents.list();
    expect(db.getPolicyByUserId).toHaveBeenCalledWith(7);
    expect(db.getStrategyByUserId).toHaveBeenCalledWith(7);
    expect(db.getUserContacts).toHaveBeenCalledWith(7);
    expect(db.getDocumentsByUserId).toHaveBeenCalledWith(7);
  });
  it.each([2, null])("denies a resume link owned by %s", async userId => {
    vi.mocked(db.getSaveLinkByToken).mockResolvedValue({ userId, formData: { private: "value" }, expiresAt: new Date(Date.now() + 60000) } as any);
    expect(await appRouter.createCaller(context(1)).email.getResumeData({ token: "known-token" })).toEqual({ found: false });
  });
});

describe("carrier approval must remain distinct from checklist progress", () => {
  const base = { strategyId: 30, stage: "stage1Tasks" as const, tasks: [] };

  it("rejects advancing to post-approval without explicit carrier confirmation", async () => {
    await expect(appRouter.createCaller(context(2)).strategy.updateTasks({
      ...base, currentStage: 3, claimStatus: "approved",
    })).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    expect(db.updateStrategy).not.toHaveBeenCalled();
  });

  it("rejects setting claim status to approved independently of stage advancement", async () => {
    await expect(appRouter.createCaller(context(2)).strategy.updateTasks({
      ...base, claimStatus: "approved",
    })).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    expect(db.updateStrategy).not.toHaveBeenCalled();
  });

  it("preserves stage 2 workflow without demanding an approval confirmation", async () => {
    await expect(appRouter.createCaller(context(2)).strategy.updateTasks({
      ...base, currentStage: 2, claimStatus: "in_progress",
    })).resolves.toEqual({ success: true });
    expect(db.updateStrategy).toHaveBeenCalledWith(30, 2, expect.objectContaining({
      currentStage: 2, claimStatus: "in_progress",
    }));
  });

  it("will not downgrade an already approved strategy by editing checklist tasks", async () => {
    vi.mocked(db.getStrategyById).mockResolvedValue({
      id:30,userId:2,policyId:20,currentStage:3,claimStatus:"approved",
    } as any);
    await expect(appRouter.createCaller(context(2)).strategy.updateTasks({
      ...base,currentStage:2,claimStatus:"in_progress",
    })).rejects.toMatchObject({code:"PRECONDITION_FAILED"});
    expect(db.updateStrategy).not.toHaveBeenCalled();
  });

  it("rejects boolean approval even when the client explicitly attests", async () => {
    await expect(appRouter.createCaller(context(2)).strategy.updateTasks({
      ...base, currentStage: 3, claimStatus: "approved", carrierApprovalConfirmed: true,
    })).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    expect(db.updateStrategy).not.toHaveBeenCalled();
  });
});

describe("completion records require current canonical tasks and carrier approval", () => {
  const task = { id: "s3-4", label: "Submit verified monthly invoices", completed: false, category: "ongoing" };

  beforeEach(() => {
    vi.mocked(db.getStrategyById).mockResolvedValue({
      id: 30, userId: 2, policyId: 20,
      currentStage: 2, claimStatus: "in_progress",
      stage1Tasks: [{ id: "s1-1", label: "Contact carrier for policy documents", completed: false, category: "carrier-contact" }],
      stage2Tasks: [{ id: "s2-1", label: "Complete claim packet", completed: false, category: "claim-packet" }],
      stage3Tasks: [task],
    } as any);
  });

  it("rejects invented task identifiers before database writes", async () => {
    await expect(appRouter.createCaller(context(2)).strategy.saveTaskCompletion({
      strategyId: 30, taskId: "s3-999", taskTitle: "Unknown task", stage: 3, completed: true,
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(db.saveTaskCompletion).not.toHaveBeenCalled();
  });

  it("rejects Stage 3 completion before the carrier-approved stage is active", async () => {
    await expect(appRouter.createCaller(context(2)).strategy.saveTaskCompletion({
      strategyId: 30, taskId: task.id, taskTitle: task.label, stage: 3, completed: true,
    })).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    expect(db.saveTaskCompletion).not.toHaveBeenCalled();
  });

  it("rejects invalid stage numbers", async () => {
    await expect(appRouter.createCaller(context(2)).strategy.saveTaskCompletion({
      strategyId: 30, taskId: task.id, taskTitle: task.label, stage: 4, completed: true,
    })).rejects.toBeTruthy();
    expect(db.saveTaskCompletion).not.toHaveBeenCalled();
  });

  it("preserves canonical titles despite client-supplied altered labels", async () => {
    await appRouter.createCaller(context(2)).strategy.saveTaskCompletion({
      strategyId: 30, taskId: "s1-1", taskTitle: "Misleading external title", stage: 1, completed: true,
    });
    expect(db.saveTaskCompletion).toHaveBeenCalledWith(2, 30, "s1-1", "Contact carrier for policy documents", 1, true);
  });

  it("accepts Stage 3 tasks only after recorded carrier approval", async () => {
    vi.mocked(db.getStrategyById).mockResolvedValue({
      id: 30, userId: 2, policyId: 20,
      currentStage: 3, claimStatus: "approved", stage3Tasks: [task],
    } as any);
    vi.mocked(milestoneService.hasDocumentedCarrierApproval).mockResolvedValueOnce(true);
    await appRouter.createCaller(context(2)).strategy.saveTaskCompletion({
      strategyId: 30, taskId: task.id, taskTitle: task.label, stage: 3, completed: true,
    });
    expect(db.saveTaskCompletion).toHaveBeenCalledWith(2, 30, task.id, task.label, 3, true);
  });
});

describe("User-entered planning date persists only on owned strategies", () => {
  it("accepts a valid leap-day planning anchor", async () => {
    await expect(appRouter.createCaller(context(2)).strategy.updateScheduleStartDate({
      strategyId: 30, startDate: "2028-02-29",
    })).resolves.toEqual({ success: true, startDate: "2028-02-29" });
    expect(db.updateStrategy).toHaveBeenCalledWith(30, 2, { scheduleStartDate: "2028-02-29" });
  });
  it("denies a planning date change by an unrelated account", async () => {
    await expect(appRouter.createCaller(context(1)).strategy.updateScheduleStartDate({
      strategyId: 30, startDate: "2026-10-10",
    })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(db.updateStrategy).not.toHaveBeenCalled();
  });
  it.each(["2026-02-30", "2025-02-29", "0000-01-01", "2101-01-01", "2026-13-01", "2026-00-01"])(
    "rejects impossible or unsupported planning date %s", async startDate => {
      await expect(appRouter.createCaller(context(2)).strategy.updateScheduleStartDate({
        strategyId: 30, startDate,
      })).rejects.toBeTruthy();
      expect(db.updateStrategy).not.toHaveBeenCalled();
    },
  );
  it.each(["10/10/2026", "2026-2-1", "2026-10-10T13:00:00Z", "<script>"])(
    "rejects non-ISO planning date %s", async startDate => {
      await expect(appRouter.createCaller(context(2)).strategy.updateScheduleStartDate({
        strategyId: 30, startDate,
      })).rejects.toBeTruthy();
      expect(db.updateStrategy).not.toHaveBeenCalled();
    },
  );
});


describe("evidence routes enforce authenticated ownership and strict approval forms",()=>{
  const valid={strategyId:30,effectiveDate:"2026-10-10",carrierReference:"SYNTH-ABC",evidenceDocumentId:17,attestationConfirmed:true as const};
  it("records evidence through the dedicated carrier route, not the checklist endpoint",async()=>{
    await expect(appRouter.createCaller(context(2)).strategy.recordCarrierApproval(valid)).resolves.toMatchObject({
      kind:"carrier_approval",evidenceLevel:"user_submitted",
    });
    expect(milestoneService.recordClaimMilestone).toHaveBeenCalledWith(2,{
      strategyId:30,kind:"carrier_approval",effectiveDate:valid.effectiveDate,
      carrierReference:valid.carrierReference,evidenceDocumentId:17,
    });
  });
  it("rejects a missing or false confirmation before the record-writing service",async()=>{
    await expect(appRouter.createCaller(context(2)).strategy.recordCarrierApproval({
      ...valid,attestationConfirmed:false as any,
    })).rejects.toBeTruthy();
    expect(milestoneService.recordClaimMilestone).not.toHaveBeenCalled();
  });
  it("does not allow the general milestone route to record carrier approval",async()=>{
    await expect(appRouter.createCaller(context(2)).strategy.recordActualMilestone({
      strategyId:30,kind:"carrier_approval" as any,effectiveDate:"2026-10-10",
    })).rejects.toBeTruthy();
    expect(milestoneService.recordClaimMilestone).not.toHaveBeenCalled();
  });
  it("scopes milestone history to the logged-in strategy owner",async()=>{
    await expect(appRouter.createCaller(context(1)).strategy.listClaimMilestones({strategyId:30}))
      .rejects.toMatchObject({code:"NOT_FOUND"});
    expect(milestoneService.listClaimMilestones).not.toHaveBeenCalled();
  });
});

describe("Care scenario account-scoped persistence APIs",()=>{
  const scenario = {
    paymentType:"",termsConfirmed:false,eligibility:"unconfirmed",startDate:"",
    careDays:[],hourlyRate:"",hoursPerDay:"",capType:"",dailyMax:"",
    monthlyMax:"",totalPool:"",remainingPool:"",firstMonthUsed:"",
    eliminationType:"",eliminationRemaining:"",monthlyPremium:"",
    assumeFullWaiver:false,dualWaiver:false,spouseMonthlyPremium:"",
    careInflation:"0",benefitInflation:"none",benefitRate:"",
    inflationScope:"",nextIncrease:"",riderConfirmed:false,originalDaily:"",
    originalMonthly:"",originalPool:"",
  };
  it("returns the authenticated strategy owner's saved scenario only",async()=>{
    await expect(appRouter.createCaller(context(2)).strategy.getCareScenario({strategyId:30}))
      .resolves.toMatchObject({status:"empty",inputs:null});
    expect(careService.getSavedCareScenario).toHaveBeenCalledWith(2,30);
  });
  it("saves a draft using only the owner account ID",async()=>{
    await expect(appRouter.createCaller(context(2)).strategy.saveCareScenario({strategyId:30,inputs:scenario}))
      .resolves.toMatchObject({status:"needs_review"});
    expect(careService.saveOwnedCareScenario).toHaveBeenCalledWith(2,30,scenario);
  });
  it("rejects inputs containing unexpected health data fields",async()=>{
    await expect(appRouter.createCaller(context(2)).strategy.saveCareScenario({
      strategyId:30,inputs:{...scenario,unrecognizedMedicalRecord:"bad"} as any,
    })).rejects.toBeTruthy();
    expect(careService.saveOwnedCareScenario).not.toHaveBeenCalled();
  });
  it("blocks a different account from reading and changing the saved scenario",async()=>{
    await expect(appRouter.createCaller(context(1)).strategy.getCareScenario({strategyId:30}))
      .rejects.toMatchObject({code:"NOT_FOUND"});
    await expect(appRouter.createCaller(context(1)).strategy.saveCareScenario({strategyId:30,inputs:scenario}))
      .rejects.toMatchObject({code:"NOT_FOUND"});
    expect(careService.saveOwnedCareScenario).not.toHaveBeenCalled();
    expect(careService.getSavedCareScenario).not.toHaveBeenCalled();
  });
});
