import { beforeEach, describe, expect, it, vi } from "vitest";
import { claimMilestoneEvents, documentUploads, strategies } from "../drizzle/schema";
import * as dbModule from "./db";
import {
  recordClaimMilestone, validActualMilestoneDate, validCarrierReference,
  hasDocumentedCarrierApproval, listClaimMilestones,
} from "./claimMilestones";

vi.mock("./db", async load => ({
  ...await load<typeof import("./db")>(),
  getDb: vi.fn(),
}));

const makeInput = () => ({
  strategyId: 30,
  kind: "carrier_approval" as const,
  effectiveDate: "2026-10-10",
  carrierReference: "CLM-2026-ABC",
  evidenceDocumentId: 17,
});

function fixture(options: {
  policyId?: number; docUserId?: number; docPolicyId?: number | null;
  docStrategyId?: number | null; fileKey?: string; mimeType?: string;
  oldApproval?: boolean;
} = {}) {
  const strategy = { id: 30, userId: 7, policyId: options.policyId ?? 20, currentStage: 2, claimStatus: "in_progress" };
  const document = {
    id: 17, userId: options.docUserId ?? 7, policyId: options.docPolicyId === undefined ? 20 : options.docPolicyId,
    strategyId: options.docStrategyId === undefined ? null : options.docStrategyId,
    fileKey: options.fileKey ?? "users/7/documents/carrier-letter",
    mimeType: options.mimeType ?? "application/pdf",
  };
  const events: Array<{ id:number; kind:string; evidenceDocumentId:number | null; evidenceLevel:string; effectiveDate:string; approvalDedupeKey:string | null }> = [];
  if (options.oldApproval) {
    events.push({id:99,kind:"carrier_approval",evidenceDocumentId:17,evidenceLevel:"user_submitted",effectiveDate:"2026-10-08",approvalDedupeKey:"approval:7:30"});
  }
  const log: string[] = [];
  let nextId = 100;
  const select = () => ({
    from(table: unknown) {
      return {
        where() {
          const records = table === strategies ? [strategy] :
            table === documentUploads ? [document] :
            table === claimMilestoneEvents ? events : [];
          return {
            for: async (mode: string) => {
              log.push("lock:" + mode);
              return records;
            },
            limit: async (max: number) => {
              log.push("select:" + max);
              if (table === documentUploads && options.docUserId === 99) return [];
              return records.slice(0, max);
            },
            orderBy: async () => records,
          };
        },
      };
    },
  });
  const tx = {
    select,
    insert(table: unknown) {
      return {
        values: async (data: any) => {
          if (table !== claimMilestoneEvents) throw new Error("Unexpected insertion");
          log.push("insert_event");
          const id = nextId++;
          events.push({id,...data});
          return [{insertId:id}];
        },
      };
    },
    update(table: unknown) {
      return {
        set(fields: any) {
          return {
            where: async () => {
              if (table !== strategies) throw new Error("Unexpected update");
              log.push("promote_stage3");
              Object.assign(strategy,fields);
            },
          };
        },
      };
    },
  };
  const fake = {
    transaction: async (fn:(tx:typeof tx)=>Promise<unknown>) => {
      log.push("transaction_start");
      const result=await fn(tx);
      log.push("transaction_commit");
      return result;
    },
    select,
  };
  return {fake:fake as any,log,events,strategy,document};
}

beforeEach(()=>vi.clearAllMocks());

describe("Claim milestone date/reference validation",()=>{
  it.each([
    ["2026-10-10",true],["2024-02-29",true],["2025-02-29",false],
    ["2026-02-30",false],["2026-13-01",false],["2026-00-01",false],
    ["2026-1-5",false],["2026-10-10T10:00:00Z",false],
    ["2101-01-01",false],["",false],
  ])("%s valid=%s",(date,expected)=>{
    expect(validActualMilestoneDate(date,new Date("2026-10-10T12:00:00Z"))).toBe(expected);
  });
  it("refuses future actual events",()=>{
    expect(validActualMilestoneDate("2026-11-10",new Date("2026-10-10T12:00:00Z"))).toBe(false);
  });
  it("accepts carrier claim references but not newlines or control characters",()=>{
    expect(validCarrierReference(" CLM-76/ABC ")).toBe(true);
    expect(validCarrierReference("")).toBe(false);
    expect(validCarrierReference("Claim\nFake")).toBe(false);
    expect(validCarrierReference("x".repeat(129))).toBe(false);
  });
});

describe("Immutable claim history and evidence control",()=>{
  it("stores an approval event and promotes the strategy atomically",async()=>{
    const f=fixture();
    vi.mocked(dbModule.getDb).mockResolvedValue(f.fake);
    const result=await recordClaimMilestone(7,makeInput());
    expect(result).toMatchObject({kind:"carrier_approval",evidenceLevel:"user_submitted",id:100});
    expect(f.strategy).toMatchObject({currentStage:3,claimStatus:"approved"});
    expect(f.events).toHaveLength(1);
    expect(f.events[0].approvalDedupeKey).toBe("approval:7:30");
    expect(f.log).toEqual(["transaction_start","lock:update","select:1","select:1","insert_event","promote_stage3","transaction_commit"]);
  });
  it("rejects a duplicate approval without overwriting the first event",async()=>{
    const f=fixture({oldApproval:true});
    vi.mocked(dbModule.getDb).mockResolvedValue(f.fake);
    await expect(recordClaimMilestone(7,makeInput())).rejects.toMatchObject({code:"CONFLICT"});
    expect(f.events).toHaveLength(1);
    expect(f.log).not.toContain("promote_stage3");
  });
  it.each([
    [{docPolicyId:99},"another policy"],
    [{docStrategyId:50},"another strategy"],
    [{fileKey:"users/99/documents/foreign"},"wrong storage owner"],
    [{mimeType:"text/html"},"unsupported mime type"],
    [{docUserId:99},"another account"],
  ] as const)("rejects evidence %s for %s",async(options)=>{
    const f=fixture(options);
    vi.mocked(dbModule.getDb).mockResolvedValue(f.fake);
    await expect(recordClaimMilestone(7,makeInput())).rejects.toMatchObject({code:"BAD_REQUEST"});
    expect(f.events).toHaveLength(0);
  });
  it("refuses approval without an uploaded document/reference",async()=>{
    const f=fixture();
    vi.mocked(dbModule.getDb).mockResolvedValue(f.fake);
    await expect(recordClaimMilestone(7,{...makeInput(),evidenceDocumentId:null})).rejects.toMatchObject({code:"BAD_REQUEST"});
    await expect(recordClaimMilestone(7,{...makeInput(),carrierReference:""})).rejects.toMatchObject({code:"BAD_REQUEST"});
    expect(f.log).toHaveLength(0);
  });
  it("allows other actual milestones without promoting the insurance status",async()=>{
    const f=fixture();
    vi.mocked(dbModule.getDb).mockResolvedValue(f.fake);
    const input={strategyId:30,kind:"care_started" as const,effectiveDate:"2026-10-09"};
    const result=await recordClaimMilestone(7,input);
    expect(result.kind).toBe("care_started");
    expect(f.events[0].approvalDedupeKey).toBeNull();
    expect(f.strategy).toMatchObject({currentStage:2,claimStatus:"in_progress"});
    expect(f.log).not.toContain("promote_stage3");
  });
  it("requires recorded evidence before reporting carrier approval",async()=>{
    const f=fixture();
    vi.mocked(dbModule.getDb).mockResolvedValue(f.fake);
    expect(await hasDocumentedCarrierApproval(7,30)).toBe(false);
    await recordClaimMilestone(7,makeInput());
    expect(await hasDocumentedCarrierApproval(7,30)).toBe(true);
    expect((await listClaimMilestones(7,30))).toHaveLength(1);
  });
});
