import { emailSchema, nameSchema } from "@shared/contactValidation";
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Download, Mail, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface PdfDeliveryPanelProps {
  policyData: {
    // Insured
    insuredName: string;
    insuredDob?: string;
    insuredPhone?: string;
    insuredEmail?: string;
    insuredAddress?: string;
    // Policy
    policyNumber: string;
    claimNumber?: string;
    carrierName: string;
    carrierPhone?: string;
    // Coverage
    eliminationPeriod?: string;
    dailyMaximum: number;
    monthlyMaximum: number;
    lifetimeMaximum: number;
    minAdlsRequired?: number;
    waiverOfPremium?: string;
    assignmentOfBenefits?: string;
    // Qualifying
    adlLimitations: string[];
    diagnosisCheckboxes?: string[];
    cognitiveImpairmentTrigger?: string;
    // Tasks
    stage1Tasks: string[];
    stage2Tasks: string[];
    stage3Tasks: string[];
    // Extra
    careRecommendations: string;
    strategyContent: string;
    diagnosis?: string;
    caseManagerName?: string;
    thirdPartyAssessmentRequired?: string;
  };
}

export function PdfDeliveryPanel({ policyData }: PdfDeliveryPanelProps) {
  const [activeTab, setActiveTab] = useState<'download' | 'email'>('download');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

  const generatePdfMutation = trpc.pdfDelivery.generatePdf.useMutation({
    onSuccess: (data) => {
      if (data.base64) {
        const link = document.createElement('a');
        const bytes = Uint8Array.from(atob(data.base64), char => char.charCodeAt(0));
        const url = URL.createObjectURL(new Blob([bytes], {type: 'application/pdf'}));
        link.href = url;
        link.download = `LTC-Strategy-${policyData.insuredName.replace(/\s+/g, '-')}.pdf`;
        link.rel = 'noopener';
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 30000);
        setStatus({ type: 'success', message: 'PDF ready. Your browser download has started.' });
      }
    },
    onError: (error) => {
      setStatus({ type: 'error', message: `Failed to generate PDF: ${error.message}` });
    },
    onSettled: () => setLoading(false),
  });

  const handleDownloadPdf = async () => {
    setLoading(true);
    setStatus({ type: null, message: '' });
    generatePdfMutation.mutate(policyData);
  };

  const sendEmailMutation = trpc.pdfDelivery.sendPdfByEmail.useMutation({
    onSuccess: (data) => {
      setStatus({ type: 'success', message: data.message });
      setRecipientEmail('');
      setRecipientName('');
      setMessage('');
    },
    onError: (error) => {
      setStatus({ type: 'error', message: `Failed to send email: ${error.message}` });
    },
    onSettled: () => setLoading(false),
  });

  const handleSendEmail = async () => {
    const email = emailSchema.safeParse(recipientEmail);
    const name = nameSchema.safeParse(recipientName);
    if (!email.success || !name.success) {
      setStatus({ type: 'error', message: 'Please enter a valid recipient email and name' });
      return;
    }
    setLoading(true);
    setStatus({ type: null, message: '' });
    sendEmailMutation.mutate({
      recipientEmail: email.data,
      recipientName: name.data,
      message,
      ...policyData,
    });
  };

  return (
    <Card className="w-full bg-gradient-to-br from-blue-50 to-teal-50 border-2 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900">
          Download or Share Your Strategy
        </CardTitle>
        <CardDescription>Get your personalized LTC insurance strategy as a professional PDF</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Tab Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 mb-6">
          <Button
            variant={activeTab === 'download' ? 'default' : 'outline'}
            onClick={() => setActiveTab('download')}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <Download size={18} />
            Download PDF
          </Button>
          <Button
            variant={activeTab === 'email' ? 'default' : 'outline'}
            onClick={() => setActiveTab('email')}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <Mail size={18} />
            Email to Someone
          </Button>
        </div>

        {/* Download Tab */}
        {activeTab === 'download' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg border border-blue-100">
              <p className="text-sm text-gray-700 mb-4">
                Your personalized strategy PDF includes:
              </p>
              <ul className="text-sm text-gray-700 space-y-2 ml-4">
                <li>✓ Executive Summary with your policy benefits</li>
                <li>✓ Complete policy overview</li>
                <li>✓ Care recommendations based on your diagnosis</li>
                <li>✓ Three-stage claim strategy with checklists</li>
                <li>✓ Home care options with Visiting Angels</li>
                <li>✓ Important legal disclaimers</li>
              </ul>
            </div>

            <Button
              onClick={handleDownloadPdf}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg font-semibold"
            >
              {loading ? 'Generating PDF...' : 'Download Your Strategy PDF'}
            </Button>
          </div>
        )}

        {/* Email Tab */}
        {activeTab === 'email' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg border border-blue-100">
              <p className="text-sm text-gray-700 mb-4">
                Share your strategy PDF with family members, caregivers, or advisors
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label htmlFor="recipient-email" className="block text-sm font-medium text-gray-700 mb-1">
                  Recipient's Email Address *
                </label>
                <Input
                  id="recipient-email" type="email"
                  placeholder="example@email.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  disabled={loading}
                  className="w-full"
                />
              </div>

              <div>
                <label htmlFor="recipient-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Recipient's Name *
                </label>
                <Input
                  id="recipient-name" type="text"
                  placeholder="John Smith"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  disabled={loading}
                  className="w-full"
                />
              </div>

              <div>
                <label htmlFor="recipient-message" className="block text-sm font-medium text-gray-700 mb-1">
                  Optional Message
                </label>
                <Textarea id="recipient-message" maxLength={4000}
                  placeholder="Add a personal message (optional)"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={loading}
                  className="w-full min-h-24"
                />
              </div>

              <Button
                onClick={handleSendEmail}
                disabled={loading || !recipientEmail || !recipientName}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white py-6 text-lg font-semibold"
              >
                {loading ? 'Sending Email...' : 'Send Strategy PDF by Email'}
              </Button>
            </div>
          </div>
        )}

        {/* Status Messages */}
        {status.type && (
          <div role={status.type === 'error' ? 'alert' : 'status'}
            className={`mt-4 p-4 rounded-lg flex items-start gap-3 ${
              status.type === 'success'
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            {status.type === 'success' ? (
              <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
            ) : (
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            )}
            <p className={status.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {status.message}
            </p>
          </div>
        )}

        {/* Legal Disclaimer */}
        <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
          <p className="text-xs text-gray-700">
            <strong>Legal Notice:</strong> This PDF is provided for informational purposes only and is not legal or medical advice. 
            Each situation is unique. Please consult with your insurance carrier to confirm all details specific to your policy.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
