import { expect, it } from "vitest";
import { downloadDisposition } from "./storage";
it("preserves Unicode filenames safely in an attachment header", () => {
  expect(() => downloadDisposition("a".repeat(199) + "📄.pdf")).not.toThrow();
  expect(downloadDisposition("Médical records.pdf")).toBe('attachment; filename="document"; filename*=UTF-8\'\'M%C3%A9dical%20records.pdf');
});
it("removes paths and control characters and escapes header punctuation", () => {
  const value = downloadDisposition('folder/Report\r\n"; injected.pdf');
  expect(value).not.toMatch(/[\r\n]/);
  expect(value).toContain('Report%22%3B%20injected.pdf');
  expect(value).not.toContain("folder");
});
