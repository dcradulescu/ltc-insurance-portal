import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, Bell, Clock, AlertCircle, CheckCircle } from "lucide-react";

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
  const [phoneNumber, setPhoneNumber] = useState(insuredPhone || "");
  const [preferences, setPreferences] = useState<NotificationPreference>({
    taskReminders: true,
    milestoneAlerts: true,
    deadlineWarnings: true,
    reminderDaysBefore: [7, 3, 1],
  });
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [testMessage, setTestMessage] = useState("");
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<"idle" | "success" | "error">("idle");

  const reminderOptions = [
    { label: "7 days before", value: 7 },
    { label: "3 days before", value: 3 },
    { label: "1 day before", value: 1 },
    { label: "Day of task", value: 0 },
  ];

  const toggleReminderDay = (day: number) => {
    const updated = preferences.reminderDaysBefore.includes(day)
      ? preferences.reminderDaysBefore.filter((d) => d !== day)
      : [...preferences.reminderDaysBefore, day].sort((a, b) => b - a);
    setPreferences({ ...preferences, reminderDaysBefore: updated });
  };

  const handleSendTestMessage = async () => {
    if (!phoneNumber) {
      setTestResult("error");
      return;
    }

    setSendingTest(true);
    try {
      // Simulate sending test SMS
      const message = testMessage || `Test message for ${insuredName} from LTC Navigator`;
      console.log(`[SMS Test] Sending to ${phoneNumber}: ${message}`);

      // In production, this would call the SMS API
      setTimeout(() => {
        setTestResult("success");
        setSendingTest(false);
        setTimeout(() => setTestResult("idle"), 3000);
      }, 1000);
    } catch (error) {
      setTestResult("error");
      setSendingTest(false);
    }
  };

  const handleSavePreferences = () => {
    console.log("Saving SMS preferences:", { phoneNumber, preferences });
    // In production, this would save to database via tRPC mutation
    setTestResult("success");
    setTimeout(() => setTestResult("idle"), 3000);
  };

  return (
    <div className="w-full space-y-4">
      <Tabs defaultValue="setup" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="setup">Setup</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="test">Test</TabsTrigger>
        </TabsList>

        {/* SETUP TAB */}
        <TabsContent value="setup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                SMS Notification Setup
              </CardTitle>
              <CardDescription>
                Configure phone number and notification recipients
              </CardDescription>
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
                <p className="text-xs text-gray-500 mt-1">
                  SMS reminders will be sent to this number
                </p>
              </div>

              <div>
                <label className="text-sm font-medium mb-3 block">
                  Additional Recipients
                </label>
                <div className="space-y-2">
                  {[
                    { id: "poa", label: "Power of Attorney" },
                    { id: "family", label: "Family Member" },
                    { id: "provider", label: "Care Provider" },
                    { id: "insurance", label: "Insurance Company" },
                  ].map((recipient) => (
                    <label key={recipient.id} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={selectedRecipients.includes(recipient.id)}
                        onCheckedChange={() => {
                          setSelectedRecipients(
                            selectedRecipients.includes(recipient.id)
                              ? selectedRecipients.filter((r) => r !== recipient.id)
                              : [...selectedRecipients, recipient.id]
                          );
                        }}
                      />
                      <span className="text-sm">{recipient.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Button onClick={handleSavePreferences} className="w-full">
                Save Setup
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PREFERENCES TAB */}
        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Choose which notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Notification Types */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={preferences.taskReminders}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, taskReminders: checked as boolean })
                    }
                  />
                  <div>
                    <span className="text-sm font-medium">Task Reminders</span>
                    <p className="text-xs text-gray-500">
                      Receive reminders for upcoming tasks
                    </p>
                  </div>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={preferences.milestoneAlerts}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, milestoneAlerts: checked as boolean })
                    }
                  />
                  <div>
                    <span className="text-sm font-medium">Milestone Alerts</span>
                    <p className="text-xs text-gray-500">
                      Get notified when important milestones are reached
                    </p>
                  </div>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={preferences.deadlineWarnings}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, deadlineWarnings: checked as boolean })
                    }
                  />
                  <div>
                    <span className="text-sm font-medium">Deadline Warnings</span>
                    <p className="text-xs text-gray-500">
                      Urgent alerts for critical deadlines
                    </p>
                  </div>
                </label>
              </div>

              {/* Reminder Timing */}
              <div className="space-y-3">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Reminder Timing
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {reminderOptions.map((option) => (
                    <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={preferences.reminderDaysBefore.includes(option.value)}
                        onCheckedChange={() => toggleReminderDay(option.value)}
                      />
                      <span className="text-sm">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Button onClick={handleSavePreferences} className="w-full">
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TEST TAB */}
        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Test SMS Notification
              </CardTitle>
              <CardDescription>
                Send a test message to verify SMS setup is working
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Test Message</label>
                <textarea
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="Enter test message or leave blank for default"
                  className="w-full p-2 border rounded-lg text-sm"
                  rows={3}
                />
              </div>

              {testResult === "success" && (
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-green-800">
                    Test message sent successfully to {phoneNumber}
                  </span>
                </div>
              )}

              {testResult === "error" && (
                <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span className="text-sm text-red-800">
                    {phoneNumber
                      ? "Failed to send test message. Please try again."
                      : "Please enter a phone number first."}
                  </span>
                </div>
              )}

              <Button
                onClick={handleSendTestMessage}
                disabled={sendingTest || !phoneNumber}
                className="w-full"
              >
                {sendingTest ? "Sending..." : "Send Test Message"}
              </Button>

              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-800">
                  <strong>Note:</strong> SMS notifications require Twilio configuration. Contact
                  support to enable SMS for your account.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
