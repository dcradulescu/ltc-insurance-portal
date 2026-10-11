import { describe, expect, it } from "vitest";
import { PDFDocument, StandardFonts } from "pdf-lib";
import {
  addCanonicalSearchLayer,normalizeSearchText,
  type CanonicalPageText,type SearchLayerPlacement,
} from "./canonicalReportTextLayer";

const placement:SearchLayerPlacement={
 imageX:0,imageY:0,imageWidth:612,imageHeight:792,
 pixelWidth:1060,pixelHeight:1371,
};
function words(count=30):CanonicalPageText{
 const tokens=Array.from({length:count},(_,index)=>({
  text:index===4?"TEST-LTC-000000":index===8?"Fiancé’s":("word"+index),
  x:40+(index%10)*65,top:80+Math.floor(index/10)*18,
  width:60,height:14,fontSize:12,
 }));
 return {
   words:tokens,visibleWordCount:count,
   extractedWordCount:count,
   visibleCharacters:tokens.reduce((sum,x)=>sum+x.text.length,0),
 };
}
async function pdfFixture(){
 const doc=await PDFDocument.create();
 const page=doc.addPage([612,792]);
 const font=await doc.embedFont(StandardFonts.Helvetica);
 return {doc,page,font};
}
describe("Canonical report searchable PDF text overlay",()=>{
 it("retains literal policy IDs, amounts, and ASCII claim references",()=>{
   expect(normalizeSearchText("TEST-LTC-000000")).toBe("TEST-LTC-000000");
   expect(normalizeSearchText("$273,750")).toBe("$273,750");
 });
 it("normalizes curly punctuation without changing visible pixels",()=>{
   expect(normalizeSearchText("Fiancé’s – policy…")).toBe("Fiance's - policy...");
 });
 it("replaces unsupported glyphs without throwing on arbitrary text",()=>{
   expect(normalizeSearchText("中文 • ✓")).toBe("?? - ?");
 });
 it("embeds invisible text operators for ordinary on-page words",async()=>{
   const {doc,page,font}=await pdfFixture();
   const stats=addCanonicalSearchLayer(page,font,words(),placement);
   expect(stats.indexedWords).toBe(30);
   expect(stats.skippedWords).toBe(0);
   expect(stats.replacedCharacters).toBe(1);
   const bytes=await doc.save();
   expect(bytes.byteLength).toBeGreaterThan(1000);
 });
 it("refuses a nearly empty page instead of claiming searchability",async()=>{
   const {page,font}=await pdfFixture();
   expect(()=>addCanonicalSearchLayer(page,font,words(8),placement))
     .toThrow(/Insufficient visible words/);
 });
 it("refuses missing visible text under the 96 percent threshold",async()=>{
   const {page,font}=await pdfFixture();
   const input=words(100);
   input.extractedWordCount=40;
   expect(()=>addCanonicalSearchLayer(page,font,input,placement))
     .toThrow(/Insufficient visible words/);
 });
 it("refuses an invalid PDF coordinate transform",async()=>{
   const {page,font}=await pdfFixture();
   expect(()=>addCanonicalSearchLayer(page,font,words(),{
     ...placement,pixelWidth:0,
   })).toThrow(/Invalid screenshot/);
 });
 it("fails closed when more than five percent of visible text is outside page bounds",async()=>{
   const {page,font}=await pdfFixture();
   const input=words(30);
   input.words.slice(0,4).forEach(x=>x.x=999999);
   expect(()=>addCanonicalSearchLayer(page,font,input,placement))
     .toThrow(/omitted too many visible words/);
 });
 it("accounts for uncommon but legal Unicode characters in the text index",async()=>{
   const {page,font}=await pdfFixture();
   const input=words(30);
   input.words[0].text="Émile";
   input.words[1].text="﹩100";
   const stats=addCanonicalSearchLayer(page,font,input,placement);
   expect(stats.indexedWords).toBe(30);
   expect(stats.replacedCharacters).toBeGreaterThanOrEqual(2);
 });
});
