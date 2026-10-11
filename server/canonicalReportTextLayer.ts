import {
  type PDFDocument, type PDFPage, type PDFFont,
} from "pdf-lib";

/** A single visible source word and its browser screenshot coordinates. */
export interface CanonicalTextWord {
  text: string;
  x: number;
  top: number;
  width: number;
  height: number;
  fontSize: number;
}
export interface CanonicalPageText {
  words: CanonicalTextWord[];
  visibleWordCount: number;
  extractedWordCount: number;
  visibleCharacters: number;
}

/**
 * Runs in a locked, network-disabled Chromium page after all client fields
 * have been safely bound. Extract only text that is actually displayed, never
 * scripts, hidden elements, CSS declarations, input values or HTML comments.
 *
 * PDF coordinates are computed separately after raster placement; this
 * extractor is intentionally source-layout independent.
 */
export function collectCanonicalPageText(): CanonicalPageText {
  const root=document.querySelector("section.page");
  if(!root) throw new Error("Canonical report has no page element");
  const walker=document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const words:CanonicalTextWord[]=[];
  let totalVisibleWords=0;
  let visibleCharacters=0;
  let next:Node|null=walker.nextNode();
  while(next){
    const node=next as Text;
    next=walker.nextNode();
    const original=node.nodeValue||"";
    const matches=Array.from(original.matchAll(/\S+/gu));
    if(!matches.length)continue;
    const parent=node.parentElement;
    if(!parent)continue;
    let hidden=false;
    for(let cur:Element|null=parent; cur && cur!==root.parentElement; cur=cur.parentElement){
      const element=cur as HTMLElement;
      const style=window.getComputedStyle(cur);
      if(["SCRIPT","STYLE","NOSCRIPT","TEMPLATE"].includes(cur.tagName) ||
        element.hidden || style.display==="none" ||
        style.visibility==="hidden" || style.visibility==="collapse" ||
        Number(style.opacity)===0) {
        hidden=true;break;
      }
    }
    if(hidden)continue;
    const style=window.getComputedStyle(parent);
    const fontSize=Number.parseFloat(style.fontSize)||12;
    const range=document.createRange();
    for(const match of matches){
      totalVisibleWords++;
      const begin=match.index??0;
      const end=begin+match[0].length;
      range.setStart(node,begin);
      range.setEnd(node,end);
      const rects=Array.from(range.getClientRects()).filter(rect=>
        rect.width>0.25 && rect.height>0.25 && Number.isFinite(rect.x) && Number.isFinite(rect.y));
      if(!rects.length)continue;
      // A pathological unbroken word can wrap across rectangles.
      // Keep the full searchable token at the first visible fragment.
      const rect=rects[0];
      const word=match[0].slice(0,256);
      words.push({
        text:word,
        x:rect.left+window.scrollX,
        top:rect.top+window.scrollY,
        width:rect.width,
        height:rect.height,
        fontSize,
      });
      visibleCharacters+=word.length;
      if(words.length>14000)throw new Error("Approved report page exceeded searchable text overlay capacity");
    }
    range.detach();
  }
  return {
    words,
    visibleWordCount:totalVisibleWords,
    extractedWordCount:words.length,
    visibleCharacters,
  };
}

/**
 * PDF standard Helvetica uses WinAnsi and cannot encode every glyph.
 * Replace unsupported punctuation for the *invisible index only*; the
 * original branded, Unicode-inclusive visual screenshot is never altered.
 */
export function normalizeSearchText(value:string):string {
  return value.normalize("NFKD")
    .replace(/[\u0300-\u036f]/g,"")
    .replace(/[\u2010-\u2015\u2212]/g,"-")
    .replace(/[\u2018\u2019\u2032]/g,"'")
    .replace(/[\u201c\u201d\u2033]/g,'"')
    .replace(/\u2026/g,"...")
    .replace(/\u2022/g,"-")
    .replace(/\u00a0/g," ")
    .replace(/[^\x20-\x7E]/g,"?");
}
export interface SearchLayerPlacement {
  imageX:number;
  imageY:number;
  imageWidth:number;
  imageHeight:number;
  pixelWidth:number;
  pixelHeight:number;
}
export interface SearchLayerStats {
  words:number;
  indexedWords:number;
  skippedWords:number;
  replacedCharacters:number;
}

/**
 * Add genuine, position-matched, non-painting PDF text operators over a
 * screenshot. Acrobat/Preview/PDF.js can search and select the text without
 * changing a pixel of the approved original HTML design.
 *
 * This does NOT produce a tagged/UA-conformant PDF: screen-reader ordering,
 * hyperlinks and PDF/UA compliance need a separate accessibility audit.
 */
export function addCanonicalSearchLayer(
  page:PDFPage,
  font:PDFFont,
  source:CanonicalPageText,
  placement:SearchLayerPlacement,
): SearchLayerStats {
  if(source.words.length<20 ||
    source.extractedWordCount<Math.floor(source.visibleWordCount*0.96)) {
    throw new Error("Insufficient visible words for a complete searchable text layer");
  }
  const width=page.getWidth(),height=page.getHeight();
  const scaleX=placement.imageWidth/placement.pixelWidth;
  const scaleY=placement.imageHeight/placement.pixelHeight;
  if(!Number.isFinite(scaleX)||!Number.isFinite(scaleY)||scaleX<=0||scaleY<=0)
    throw new Error("Invalid screenshot-to-PDF text mapping");
  let added=0,skipped=0,altered=0;
  for(const word of source.words){
    if(!word.text.trim() || !Number.isFinite(word.x) || !Number.isFinite(word.top)){
      skipped++;continue;
    }
    const token=normalizeSearchText(word.text);
    if(token!==word.text)altered++;
    if(!token.trim()){skipped++;continue;}
    const x=placement.imageX+word.x*scaleX;
    // Visual bottom of the word's glyph rectangle is slightly below the
    // Helvetica baseline. Text remains invisible, but highlight placement
    // follows the image's source rectangle.
    const y=placement.imageY+placement.imageHeight-
      (word.top+word.height*0.84)*scaleY;
    const boxWidth=Math.max(0.1,word.width*scaleX);
    let size=Math.max(0.1,Math.min(40,word.fontSize*scaleY));
    if(x<0 || x>=width || y<0 || y>=height){skipped++;continue;}
    const measured=font.widthOfTextAtSize(token,size);
    if(measured>boxWidth*1.12 && measured>0){
      size=Math.max(0.1,size*(boxWidth*1.12)/measured);
    }
    page.drawText(token,{
      x,y,font,size,opacity:0,
      // Never draw visible Unicode substitute tokens over the source design.
      // The invisible text still enters the PDF's actual text operators.
    });
    added++;
  }
  if(added<Math.floor(source.visibleWordCount*0.95)) {
    throw new Error("Searchable PDF index omitted too many visible words");
  }
  return {words:source.visibleWordCount,indexedWords:added,
    skippedWords:skipped,replacedCharacters:altered};
}
