import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright-core";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { buildCanonicalReportModel, type CanonicalReportInput } from "./canonicalReportModel";
import { bindCanonicalReportPage } from "./canonicalReportBinder";
import { addCanonicalSearchLayer, collectCanonicalPageText } from "./canonicalReportTextLayer";

const ID="sc-visiting-angels-ltc-original-18-v1";
const defaultSource=path.resolve(process.cwd());
export interface CanonicalPdfResult {
  buffer: Buffer;
  templateId: typeof ID;
  pageCount: number;
  reportWarnings: string[];
  renderingMode: "original-image-with-searchable-text-layer";
  pageChanges: Array<{page:number;changedTextNodes:number;indexedWords:number}>;
}

function cleanSourceScripts(html:string) {
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi,"");
}

function chromiumBinary() {
  const env=process.env.CANONICAL_REPORT_CHROMIUM_PATH || process.env.CHROMIUM_EXECUTABLE_PATH;
  if(env)return env;
  if(process.platform==="win32") {
    return "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  }
  return "/usr/bin/chromium";
}

/**
 * Print the exact canonical HTML pages in browser memory. We prohibit outbound
 * network traffic and remove original scripts. No policy data or rendered HTML
 * is written to disk by this function. Rejection is atomic: none of the 18
 * pages is uploaded if any required page, source hash or print test fails.
 */
export async function renderApprovedLtcReport(
  input: CanonicalReportInput,
  config: { sourceRoot?: string } = {},
): Promise<CanonicalPdfResult> {
  const root=config.sourceRoot ?? defaultSource;
  const raw=await readFile(path.join(root,"report-templates","ltc-original-18.lock.json"),"utf8");
  const lock=JSON.parse(raw);
  if(lock.template_id!==ID || lock.status!=="CANONICAL_DESIGN_APPROVED" ||
    lock.page_count!==18 || !Array.isArray(lock.pages) || lock.pages.length!==18)
    throw new Error("Canonical 18-page template approval lock is missing or invalid");
  const model=buildCanonicalReportModel(input);
  const browser=await chromium.launch({
    headless:true,
    executablePath:chromiumBinary(),
    args:["--disable-dev-shm-usage",...(process.env.CANONICAL_REPORT_CHROMIUM_SANDBOX==="off" ? ["--no-sandbox"]:[])],
  });
  const output=await PDFDocument.create();
  const indexFont=await output.embedFont(StandardFonts.Helvetica);
  output.setTitle("Personalized Long-Term Care Insurance Strategy");
  output.setSubject("Visiting Angels LTC Strategy");
  output.setCreator("Visiting Angels LTC Portal");
  const logs:CanonicalPdfResult["pageChanges"]=[];
  try {
    const page=await browser.newPage({
      viewport:{width:1060,height:1200},
      deviceScaleFactor:1,
      javaScriptEnabled:true,
    });
    // The approved HTML contains embedded logos and design assets; no
    // remote images, fonts, scripts, or third-party connections are allowed.
    await page.route("**/*",route=>route.abort("blockedbyclient"));
    for(const [index,entry] of lock.pages.entries()){
      const file=entry.file;
      if(entry.page!==index+1 ||
        typeof file!=="string" ||
        !file.startsWith("original-templates/"+String(index+1).padStart(2,"0")+"-") ||
        !/^[a-f0-9]{64}$/.test(entry.sha256)) {
        throw new Error("Canonical template lock page order is invalid");
      }
      const template=await readFile(path.join(root,file));
      if(template.length!==entry.bytes ||
        createHash("sha256").update(template).digest("hex")!==entry.sha256) {
        throw new Error("Approved original template page has changed: "+index);
      }
      const source=cleanSourceScripts(template.toString("utf-8"));
      await page.setContent(source,{waitUntil:"load",timeout:45000});
      // The development TypeScript transformer decorates nested functions
      // with __name. Define its no-op implementation in this isolated page.
      await page.evaluate("globalThis.__name = (fn) => fn");
      const details=await page.evaluate(bindCanonicalReportPage, {model,pageNumber:index+1});
      if(!details.removedSourceScripts || details.unresolvedExamples.length) {
        throw new Error("Unverified source sample values remain on original page "+(index+1)+": "+
          details.unresolvedExamples.join(", "));
      }
      const bounds=await page.evaluate(()=>{
        const box=document.querySelector("section.page") as HTMLElement|null;
        return {
          hasPage:!!box,
          pageScrollWidth:box?.scrollWidth||0,
          pageClientWidth:box?.clientWidth||0,
          imageErrors:Array.from(document.images).filter(img=>img.getAttribute("src")?.trim() &&
            (!img.complete || img.naturalWidth===0)).length,
        };
      });
      if(!bounds.hasPage || bounds.pageScrollWidth>bounds.pageClientWidth+8 || bounds.imageErrors) {
        throw new Error("Approved report page "+(index+1)+" failed geometry/image verification");
      }
      // The approved originals deliberately contain overflowing screen layouts.
      // Chromium's native print CSS truncates content on several pages, even
      // though it reports one sheet. Full-page capture preserves every source
      // element. Embed the complete screenshot at uniform aspect ratio.
      // Capture browser-placed text, not the source HTML string, so the
      // PDF index follows the actual rendered page positions after binding.
      const indexedText=await page.evaluate(collectCanonicalPageText);
      const capture=await page.screenshot({type:"png",fullPage:true,animations:"disabled",caret:"hide"});
      const image=await output.embedPng(capture);
      if(image.width<800 || image.height<500 || image.height>4500) {
        throw new Error("Canonical page "+(index+1)+" screen geometry is invalid");
      }
      const isLandscape=index===12;
      const pageWidth=isLandscape?792:612;
      const pageHeight=isLandscape?612:792;
      const sheet=output.addPage([pageWidth,pageHeight]);
      const scale=Math.min(pageWidth/image.width,pageHeight/image.height);
      const imageX=(pageWidth-image.width*scale)/2;
      const imageY=(pageHeight-image.height*scale)/2;
      sheet.drawImage(image,{
        x:imageX,y:imageY,width:image.width*scale,height:image.height*scale,
      });
      const indexed=addCanonicalSearchLayer(sheet,indexFont,indexedText,{
        imageX,imageY,imageWidth:image.width*scale,
        imageHeight:image.height*scale,pixelWidth:image.width,pixelHeight:image.height,
      });
      logs.push({page:index+1,changedTextNodes:details.changes,indexedWords:indexed.indexedWords});
    }
    await page.close();
  } finally {
    await browser.close();
  }
  if(output.getPageCount()!==18)throw new Error("Approved report must contain exactly 18 PDF pages");
  const bytes=await output.save({useObjectStreams:true});
  return {
    buffer:Buffer.from(bytes),
    templateId:ID,
    pageCount:18,
    reportWarnings:[...model.warnings,
      "Original full-page visual design is preserved with searchable text overlay. PDF/UA screen-reader accessibility has not been independently certified."],
    renderingMode:"original-image-with-searchable-text-layer",
    pageChanges:logs,
  };
}
