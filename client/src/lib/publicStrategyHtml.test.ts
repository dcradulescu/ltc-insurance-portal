import {describe,it,expect} from "vitest";
import {safePublicStrategyHtml} from "./publicStrategyHtml";
describe("anonymous Strategy cached HTML",()=>{
  it("preserves only the approved paragraph and line-break structure",()=>{
    expect(safePublicStrategyHtml("<p>Confirm coverage<br>Then call insurer</p>"))
      .toBe("<p>Confirm coverage<br>Then call insurer</p>");
  });
  it("removes injected scripts, image event handlers and bogus P attributes",()=>{
    const html="<p onclick='alert(1)'>Safe</p><script>alert(1)</script><img src=x onerror=alert(1)>";
    const cleaned=safePublicStrategyHtml(html);
    expect(cleaned).not.toContain("<script");
    expect(cleaned).not.toContain("<img");
    expect(cleaned).not.toContain("onclick");
    expect(cleaned).toContain("Safe");
  });
  it("treats nonstrings as empty",()=>{
    expect(safePublicStrategyHtml(null)).toBe("");
  });
});
