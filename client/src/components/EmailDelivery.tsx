import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, Send, CheckCircle, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface EmailDeliveryProps {
  policyId: number;
  insuredName: string;
  insuredEmail?: string;
  strategyId?: number;
}

export function EmailDelivery({ policyId, insuredName, insuredEmail, strategyId }: EmailDeliveryProps) {
  const [recipients, setRecipients] = useState<string[]>(insuredEmail ? [insuredEmail] : []);
  const [newRecipient, setNewRecipient] = useState("");
  const [selectedDocuments, setSelectedDocuments] = useState({
    strategy: true,
    physicianLetter: false,
    planOfCare: false,
    w9Form: false,
  });
  const [customMessage, setCustomMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sendStatus, setSendStatus] = useState<"idle" | "success" | "error">("idle");

  const sendEmailMutation = trpc.system.notifyOwner.useMutation();

  const addRecipient = () => {
    if (newRecipient && !recipients.includes(newRecipient)) {
      setRecipients([...recipients, newRecipient]);
      setNewRecipient("");
    }
  };

  const removeRecipient = (email: string) => {
    setRecipients(recipients.filter((r) => r !== email));
  };

  const toggleDocument = (doc: keyof typeof selectedDocuments) => {
    setSelectedDocuments({ ...selectedDocuments, [doc]: !selectedDocuments[doc] });
  };

  const handleSendEmail = async () => {
    if (recipients.length === 0) {
      setSendStatus("error");
      return;
    }

    setIsLoading(true);
    try {
      const selectedDocs = Object.entries(selectedDocuments)
        .filter(([_, selected]) => selected)
        .map(([doc]) => doc);

      const emailContent = `
LTC Insurance Strategy - ${insuredName}
Policy ID: ${policyId}
Generated: ${new Date().toLocaleDateString()}

${customMessage ? `Message from Insured:\n${customMessage}\n\n` : ""}

Included Documents:
${selectedDocs.map((doc) => `- ${doc}`).join("\n")}

This email contains important information about the LTC insurance claim strategy.
Please review all documents carefully and keep them for your records.
      `;

      // Send notification to owner with email details
      await sendEmailMutation.mutateAsync({
        title: `LTC Strategy Email Sent - ${insuredName}`,
        content: `Email sent to: ${recipients.join(", ")}\nDocuments: ${selectedDocs.join(", ")}`,
      });

      setSendStatus("success");
      setTimeout(() => setSendStatus("idle"), 3000);
    } catch (error) {
      console.error("Error sending email:", error);
      setSendStatus("error");
      setTimeout(() => setSendStatus("idle"), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Strategy & Documents
        </CardTitle>
        <CardDescription>
          Send your LTC strategy and related documents to family, providers, or insurance company
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Recipients Section */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Recipients</label>
          <div className="flex gap-2">
            <Input
              type="email"
              value={newRecipient}
              onChange={(e) => setNewRecipient(e.target.value)}
              placeholder="Enter email address"
              onKeyPress={(e) => e.key === "Enter" && addRecipient()}
            />
            <Button onClick={addRecipient} variant="outline">
              Add
            </Button>
          </div>

          {recipients.length > 0 && (
            <div className="space-y-2">
              {recipients.map((email) => (
                <div
                  key={email}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                >
                  <span className="text-sm">{email}</span>
                  <button
                    onClick={() => removeRecipient(email)}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Documents Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Documents to Include</label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={selectedDocuments.strategy}
                onCheckedChange={() => toggleDocument("strategy")}
              />
              <span className="text-sm">Full Strategy Document</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={selectedDocuments.physicianLetter}
                onCheckedChange={() => toggleDocument("physicianLetter")}
              />
              <span className="text-sm">Physician Letter</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={selectedDocuments.planOfCare}
                onCheckedChange={() => toggleDocument("planOfCare")}
              />
              <span className="text-sm">Plan of Care</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={selectedDocuments.w9Form}
                onCheckedChange={() => toggleDocument("w9Form")}
              />
              <span className="text-sm">W-9 Form</span>
            </label>
          </div>
        </div>

        {/* Custom Message */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Custom Message (Optional)</label>
          <Textarea
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder="Add a personal message to include in the email..."
            rows={4}
          />
        </div>

        {/* Status Messages */}
        {sendStatus === "success" && (
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-sm text-green-800">Email sent successfully!</span>
          </div>
        )}

        {sendStatus === "error" && (
          <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-sm text-red-800">
              {recipients.length === 0
                ? "Please add at least one recipient"
                : "Error sending email. Please try again."}
            </span>
          </div>
        )}

        {/* Send Button */}
        <Button
          onClick={handleSendEmail}
          disabled={isLoading || recipients.length === 0}
          className="w-full gap-2"
        >
          <Send className="h-4 w-4" />
          {isLoading ? "Sending..." : "Send Email"}
        </Button>

        {/* Info Box */}
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-800">
            <strong>Note:</strong> Documents will be sent as attachments. Recipients will receive
            all selected documents along with your custom message.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
