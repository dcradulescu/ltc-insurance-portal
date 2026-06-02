import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, Bell, Clock, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface SMSNotificationManagerProps {
  policyId: number;
  insuredName: string;
  insuredPhone?: string;
  onNotificationSent?: (result: any) => void;
}

interface NotificationPreference {
  taskReminders: boolean;
  milestoneAlerts: boolean;
  deadlineWarnings: boolean;
  reminderDaysBefore: number[];
}

export function SMSNotificationManager({
  policyId,
  insuredName,
  insuredPhone,
  onNotificationSent,
}: SMSNotificationManagerProps) {
  const [phoneNumber, setPhoneNumber]   = useState(insuredPhone || "");
  const [preferences, setPreferences]   = useState<NotificationPreference>({
    taskReminders: true,
    milestoneAlerts: true,
    deadlineWarnings: true,
    reminderDaysBefore: [7, 3, 1],
  });
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [testMessage, setTestMessage]   = useState("");
  const [statusMsg, setStatusMsg]       = useState<{ type: "success" | "error" | null; text: string }>({ type: null, text: "" });

  // ── tRPC mutations ──────────────────────────────────────────────────────────
  const sendNotificationMutation = trpc.sms.sendNotification.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setStatusMsg({ type: "success", text: data.message });
        onNotificationSent?.(data);
      } else {
        setStatusMsg({ type: "error", text: data.message });
      }
    },
    onError: (err) => {
      setStatusMsg({ type: "error", text: `Failed to send SMS: ${err.message}` });
    },
  });

  const savePreferencesMutation = trpc.sms.savePreferences.useMutation({
    onSuccess: (data) => {
      setStatusMsg({ type: "success", text: data.message ?? "Preferences saved." });
      setTimeout(() => setStatusMsg({ type: null, text: "" }), 3000);
    },
    onError: (err) => {
      setStatusMsg({ type: "error", text: `Failed to save preferences: ${err.message}` });
    },
  });

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleSendTestMessage = () => {
    if (!phoneNumber) {
      setStatusMsg({ type: "error", text: "Please enter a phone number first." });
      return;
    }
    setStatusMsg({ type: null, text: "" });
    sendNotificationMutation.mutate({
      phoneNumber,
      taskName: testMessage || `Test notification for ${insuredName}`,
      taskDueDate: new Date().toLocaleDateString(),
      reminderType: "task_reminder",
      priority: "medium",
      customMessage: testMessage || undefined,
    });
  };

  const handleSavePreferences = () => {
    if (!phoneNumber) {
      setStatusMsg({ type: "error", text: "Please enter a phone number first." });
      return;
    }
    setStatusMsg({ type: null, text: "" });
    savePreferencesMutation.mutate({
      phoneNumber,
      taskReminders: preferences.taskReminders,
      milestoneAlerts: preferences.milestoneAlerts,
      deadlineWarnings: preferences.deadlineWarnings,
      reminderDaysBefore: preferences.reminderDaysBefore,
    });
  };

  const toggleReminderDay = (day: number) => {
    const updated = preferences.reminderDaysBefore.includes(day)
      ? preferences.reminderDaysBefore.filter((d) => d !== day)
      : [...preferences.reminderDaysBefore, day].sort((a, b) => b - a);
    setPreferences({ ...preferences, reminderDaysBefore: updated });
  };

  const isSending = sendNotificationMutation.isPending;
  const isSaving  = savePreferencesMutation.isPending;

  const reminderOptions = [
    { label: "7 days before", value: 7 },
    { label: "3 days before", value: 3 },
    { label: "1 day before",  value: 1 },
    { label: "Day of task",   value: 0 },
  ];

  return (
    <div className="w-full space-y-4">
      {/* Global status banner */}
      {statusMsg.type && (
        <div className={`flex items-center gap-2 p-3 rounded-lg ${statusMsg.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
          {statusMsg.type === "success"
            ? <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
            : <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />}
          <span className="text-sm">{statusMsg.text}</span>
        </div>
      )}

      <Tabs defaultValue="setup" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="setup">Setup</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="test">Test</TabsTrigger>
        </TabsList>

        {/* ── SETUP TAB ── */}
        <TabsContent value="setup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                SMS Notification Setup
              </CardTitle>
              <CardDescription>Configure phone number and notification recipients</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Primary Phone Number</label>
                <Input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="(123) 456-7890"
                />
                <p className="text-xs text-gray-500 mt-1">SMS reminders will be sent to this number</p>
              </div>

              <div>
                <label className="text-sm font-medium mb-3 block">Additional Recipients</label>
                <div className="space-y-2">
                  {[
                    { id: "poa",       label: "Power of Attorney" },
                    { id: "family",    label: "Family Member" },
                    { id: "provider",  label: "Care Provider" },
                    { id: "insurance", label: "Insurance Company" },
                  ].map((r) => (
                    <label key={r.id} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={selectedRecipients.includes(r.id)}
                        onCheckedChange={() =>
                          setSelectedRecipients(
                            selectedRecipients.includes(r.id)
                              ? selectedRecipients.filter((x) => x !== r.id)
                              : [...selectedRecipients, r.id]
                          )
                        }
                      />
                      <span className="text-sm">{r.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Button onClick={handleSavePreferences} disabled={isSaving} className="w-full">
                {isSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : "Save Setup"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── PREFERENCES TAB ── */}
        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>Choose which notifications you want to receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                {[
                  { key: "taskReminders",    label: "Task Reminders",    desc: "Receive reminders for upcoming tasks" },
                  { key: "milestoneAlerts",  label: "Milestone Alerts",  desc: "Get notified when important milestones are reached" },
                  { key: "deadlineWarnings", label: "Deadline Warnings", desc: "Urgent alerts for critical deadlines" },
                ].map(({ key, label, desc }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={preferences[key as keyof NotificationPreference] as boolean}
                      onCheckedChange={(checked) =>
                        setPreferences({ ...preferences, [key]: checked as boolean })
                      }
                    />
                    <div>
                      <span className="text-sm font-medium">{label}</span>
                      <p className="text-xs text-gray-500">{desc}</p>
                    </div>
                  </label>
                ))}
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Reminder Timing
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {reminderOptions.map((opt) => (
                    <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={preferences.reminderDaysBefore.includes(opt.value)}
                        onCheckedChange={() => toggleReminderDay(opt.value)}
                      />
                      <span className="text-sm">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Button onClick={handleSavePreferences} disabled={isSaving} className="w-full">
                {isSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : "Save Preferences"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TEST TAB ── */}
        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Test SMS Notification
              </CardTitle>
              <CardDescription>Send a test message to verify SMS setup is working</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Test Message (optional)</label>
                <textarea
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="Leave blank to use the default reminder message"
                  className="w-full p-2 border rounded-lg text-sm mt-1"
                  rows={3}
                />
              </div>

              <Button
                onClick={handleSendTestMessage}
                disabled={isSending || !phoneNumber}
                className="w-full"
              >
                {isSending
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending…</>
                  : "Send Test Message"}
              </Button>

              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-800">
                  <strong>Note:</strong> SMS delivery requires Twilio credentials to be configured
                  by your administrator (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER).
                  Without them, messages will be logged server-side only.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
