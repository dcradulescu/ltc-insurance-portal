import { describe, expect, it } from "vitest";
import {
  assessClaimAuditTable, runClaimAuditUpgrade, REQUIRED_COLUMNS,
} from "../scripts/upgrade-claim-milestones.mjs";

const installed = {
  tablePresent: true, engine: "InnoDB",
  missingColumns: [], uniqueDedupeKey: true,
  evidenceForeignKey: true, missingIndexes: [], rowCount: 0,
};
describe("Claim-audit migration safety guards", () => {
  it("requires exactly the expected full audit schema", () => {
    expect(REQUIRED_COLUMNS).toContain("attestedByUserId");
    expect(REQUIRED_COLUMNS).toContain("evidenceDocumentId");
    expect(REQUIRED_COLUMNS).toContain("approvalDedupeKey");
    expect(assessClaimAuditTable(installed)).toEqual({readyToApply:true,reason:"table_already_present"});
  });
  it("permits the additive empty-table installation", () => {
    expect(assessClaimAuditTable({tablePresent:false}).readyToApply).toBe(true);
  });
  it.each([
    [{...installed,engine:"MyISAM"},"claim_events_must_use_innodb"],
    [{...installed,missingColumns:["attestedByUserId"]},"table_definition_incomplete"],
    [{...installed,uniqueDedupeKey:false},"unique_approval_key_missing"],
    [{...installed,evidenceForeignKey:false},"evidence_file_retention_fk_missing"],
    [{...installed,missingIndexes:["idx_claim_milestones_strategy"]},"claim_event_indexes_missing"],
  ] as const)("refuses incompatible schema %o", (config, reason)=>{
    expect(assessClaimAuditTable(config)).toMatchObject({readyToApply:false,reason});
  });
  it("requires a configured database URL for read-only inspection",async()=>{
    const before=process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    try{await expect(runClaimAuditUpgrade(["--inspect"])).rejects.toThrow(/DATABASE_URL/);}
    finally{if(before===undefined)delete process.env.DATABASE_URL;else process.env.DATABASE_URL=before;}
  });
  it("blocks DDL without two explicit operator approvals",async()=>{
    const before=process.env.DATABASE_URL;
    const approval=process.env.LTC_APPROVE_CLAIM_MILESTONES_MIGRATION;
    process.env.DATABASE_URL="mysql://fake:fake@127.0.0.1:1/unused";
    delete process.env.LTC_APPROVE_CLAIM_MILESTONES_MIGRATION;
    try{
      await expect(runClaimAuditUpgrade(["--apply"])).rejects.toThrow(/backup-verified/);
      await expect(runClaimAuditUpgrade(["--apply","--backup-verified"])).rejects.toThrow(/LTC_APPROVE/);
    }finally{
      if(before===undefined)delete process.env.DATABASE_URL;else process.env.DATABASE_URL=before;
      if(approval===undefined)delete process.env.LTC_APPROVE_CLAIM_MILESTONES_MIGRATION;else process.env.LTC_APPROVE_CLAIM_MILESTONES_MIGRATION=approval;
    }
  });
});
