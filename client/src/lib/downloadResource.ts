import { RESOURCE_DISCLAIMER, RESOURCE_SOURCE, type ResourceGuide } from '@shared/resourceGuides';
function save(blob: Blob, name: string) {
 const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(url), 30_000);
}
export async function downloadResource(guide: ResourceGuide, format: 'pdf' | 'docx' = guide.format) {
 if(format === 'docx') {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, Header, Footer } = await import('docx');
  const doc=new Document({sections:[{headers:{default:new Header({children:[new Paragraph({children:[new TextRun({text:'SC VISITING ANGELS | LTC RESOURCE CENTER',bold:true,color:'147887'})]})]})},footers:{default:new Footer({children:[new Paragraph('scvisitingangels.com | (864) 244-6300')]})},children:[new Paragraph({text:guide.title,heading:HeadingLevel.TITLE}),new Paragraph(guide.summary),...guide.points.map(text=>new Paragraph({text,bullet:{level:0}})),...(guide.fields??[]).flatMap(field=>[new Paragraph({text:field,heading:HeadingLevel.HEADING_2}),new Paragraph('________________________________________________________________')]),new Paragraph({text:'Educational use',heading:HeadingLevel.HEADING_2}),new Paragraph(RESOURCE_DISCLAIMER),new Paragraph({text:'General reference: '+RESOURCE_SOURCE})]}]});
  save(await Packer.toBlob(doc),guide.slug+'.docx'); return;
 }
 const {jsPDF}=await import('jspdf'); const doc=new jsPDF({unit:'mm',format:'letter'}); let y=45;
 const {registerPdfFonts}=await import('@shared/pdfFonts');registerPdfFonts(doc);
 const header=()=>{doc.setFillColor(27,58,92);doc.rect(0,0,216,29,'F');doc.setTextColor(255);doc.setFontSize(10);doc.text('SC VISITING ANGELS',16,11);doc.setFontSize(16);doc.text(guide.title,16,22);doc.setTextColor(45);};
 const footer=()=>{doc.setTextColor(80);doc.setFontSize(8);doc.text(`scvisitingangels.com | (864) 244-6300 | ${doc.getNumberOfPages()}`,16,270);};
 const paragraph=(text:string,size=10)=>{doc.setFontSize(size);const lines=doc.splitTextToSize(text,180);for(const line of lines){if(y>248){footer();doc.addPage();header();y=42;}doc.text(line,16,y);y+=5;}y+=4;};
 header();paragraph(guide.summary,11);
 guide.points.forEach((text,i)=>paragraph(`${i+1}. ${text}`));
 (guide.fields??[]).forEach(label=>{paragraph(label,10);doc.setDrawColor(150,190,200);doc.line(16,y,196,y);y+=12;});
 paragraph('Educational use only',11);paragraph(RESOURCE_DISCLAIMER,8);paragraph('General reference: '+RESOURCE_SOURCE,8);footer();doc.save(guide.slug+'.pdf');
}
