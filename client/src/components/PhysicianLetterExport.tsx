import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { FileText, Download, Mail } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface PhysicianLetterExportProps {
  policyId: number;
  insuredName: string;
  diagnosis: string;
}

export function PhysicianLetterExport({ policyId, insuredName, diagnosis }: PhysicianLetterExportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [letterContent, setLetterContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const generateLetterMutation = trpc.strategy.generatePhysicianLetter.useMutation();

  const handleGenerateLetter = async () => {
    setIsLoading(true);
    try {
      const result = await generateLetterMutation.mutateAsync({ policyId });
      setLetterContent(result.html);
      setIsOpen(true);
    } catch (error) {
      console.error("Error generating physician letter:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      // Use html2pdf library to convert HTML to PDF
      const element = document.getElementById("physician-letter-content");
      if (!element) return;

      // Create a new window for printing
      const printWindow = window.open("", "", "height=600,width=800");
      if (!printWindow) return;

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Physician Letter - ${insuredName}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
              .letter-header { text-align: center; margin-bottom: 30px; }
              .letter-date { margin-bottom: 20px; }
              .letter-body { margin: 20px 0; }
              .signature-line { margin-top: 40px; border-top: 1px solid #000; width: 200px; }
            </style>
          </head>
          <body>
            ${letterContent}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    } catch (error) {
      console.error("Error downloading PDF:", error);
    }
  };

  const handleEmailLetter = async () => {
    // This would integrate with email service
    // For now, just copy to clipboard
    const text = letterContent.replace(/<[^>]*>/g, "");
    navigator.clipboard.writeText(text);
    alert("Letter copied to clipboard. You can now paste it into an email.");
  };

  return (
    <>
      <Button
        onClick={handleGenerateLetter}
        disabled={isLoading}
        variant="outline"
        className="gap-2"
      >
        <FileText className="h-4 w-4" />
        {isLoading ? "Generating..." : "Generate Physician Letter"}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Physician Letter - {insuredName}</DialogTitle>
          </DialogHeader>

          <div
            id="physician-letter-content"
            className="prose prose-sm max-w-none p-4 bg-white border rounded"
            dangerouslySetInnerHTML={{ __html: letterContent }}
          />

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Close
            </Button>
            <Button onClick={handleEmailLetter} variant="outline" className="gap-2">
              <Mail className="h-4 w-4" />
              Email Letter
            </Button>
            <Button onClick={handleDownloadPDF} className="gap-2">
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
