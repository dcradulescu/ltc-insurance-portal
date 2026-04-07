import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Download, Mail, AlertCircle, CheckCircle } from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface PdfDeliveryPanelProps {
  policyData: {
    insuredName: string;
    policyNumber: string;
    carrierName: string;
    dailyMaximum: number;
    monthlyMaximum: number;
    lifetimeMaximum: number;
    diagnosis: string;
    adlLimitations: string[];
    stage1Tasks: string[];
    stage2Tasks: string[];
    stage3Tasks: string[];
    careRecommendations: string;
    strategyContent: string;
  };
}

export function PdfDeliveryPanel({ policyData }: PdfDeliveryPanelProps) {
  const [activeTab, setActiveTab] = useState<'download' | 'email'>('download');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

  const generatePdfMutation = trpc.pdfDelivery.generatePdf.useMutation();
  const sendPdfMutation = trpc.pdfDelivery.sendPdfByEmail.useMutation();

  const handleDownloadPdf = async () => {
    setLoading(true);
    setStatus({ type: null, message: '' });
    try {
      const result = await generatePdfMutation.mutateAsync(policyData);
      if (result.success && result.url) {
        // Trigger download
        const link = document.createElement('a');
        link.href = result.url;
        link.download = `LTC-Strategy-${policyData.insuredName.replace(/\s+/g, '-')}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setStatus({ type: 'success', message: '✅ PDF downloaded successfully!' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: `❌ Failed to download PDF: ${error}` });
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!recipientEmail || !recipientName) {
      setStatus({ type: 'error', message: '❌ Please enter recipient email and name' });
      return;
    }

    setLoading(true);
    setStatus({ type: null, message: '' });
    try {
      const result = await sendPdfMutation.mutateAsync({
        ...policyData,
        recipientEmail,
        recipientName,
        message,
      });
      if (result.success) {
        setStatus({ type: 'success', message: `✅ ${result.message}` });
        setRecipientEmail('');
        setRecipientName('');
        setMessage('');
      }
    } catch (error) {
      setStatus({ type: 'error', message: `❌ Failed to send email: ${error}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full bg-gradient-to-br from-blue-50 to-teal-50 border-2 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900">
          📄 Download or Share Your Strategy
        </CardTitle>
        <CardDescription>Get your personalized LTC insurance strategy as a professional PDF</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Tab Buttons */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === 'download' ? 'default' : 'outline'}
            onClick={() => setActiveTab('download')}
            className="flex items-center gap-2"
          >
            <Download size={18} />
            Download PDF
          </Button>
          <Button
            variant={activeTab === 'email' ? 'default' : 'outline'}
            onClick={() => setActiveTab('email')}
            className="flex items-center gap-2"
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
                <li>✓ Three-stage claim strategy</li>
                <li>✓ Home care options with Visiting Angels</li>
                <li>✓ Important legal disclaimers</li>
              </ul>
            </div>

            <Button
              onClick={handleDownloadPdf}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg font-semibold"
            >
              {loading ? 'Generating PDF...' : '📥 Download Your Strategy PDF'}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recipient's Email Address *
                </label>
                <Input
                  type="email"
                  placeholder="example@email.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  disabled={loading}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recipient's Name *
                </label>
                <Input
                  type="text"
                  placeholder="John Smith"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  disabled={loading}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Optional Message
                </label>
                <Textarea
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
                {loading ? 'Sending Email...' : '📧 Send Strategy PDF by Email'}
              </Button>
            </div>
          </div>
        )}

        {/* Status Messages */}
        {status.type && (
          <div
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
            <strong>⚠️ Legal Notice:</strong> This PDF is provided for informational purposes only and is not legal or medical advice. 
            Each situation is unique. Please consult with your insurance carrier to confirm all details specific to your policy.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
