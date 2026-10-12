/** Stream-free temporary PDF download from an in-memory server response. */
export function downloadPublicPdf(pdfBase64: string, supportReference?:string) {
  const decoded = atob(pdfBase64);
  const bytes = new Uint8Array(decoded.length);
  for (let i = 0; i < decoded.length; i++) bytes[i] = decoded.charCodeAt(i);
  const objectUrl = URL.createObjectURL(new Blob([bytes], {type:"application/pdf"}));
  const link = document.createElement("a");
  link.href = objectUrl;
  const safeReference=supportReference && /^LTC-[A-F0-9]{12}$/.test(supportReference)
    ? "-"+supportReference : "";
  link.download = "Visiting-Angels-LTC-Strategy"+safeReference+".pdf";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}
