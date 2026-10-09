import { profileDetailsSchema, contactDetailsSchema } from "@shared/contactValidation";
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  User, Mail, Phone, Plus, Trash2, Save, Users, Bell, CheckCircle2, Loader2, Edit2, X,
} from "lucide-react";

interface Contact {
  id: number;
  name: string;
  email: string;
  relationship?: string | null;
  receiveCcEmails: number;
  createdAt: Date;
  updatedAt: Date;
}

export default function Profile() {
  // ── Profile state ──────────────────────────────────────────────────────────
  const profileQuery = trpc.auth.getProfile.useQuery();
  const updateProfileMutation = trpc.auth.updateProfile.useMutation();
  const utils = trpc.useUtils();

  const [editingProfile, setEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");

  // Notification preferences
  const [notifyOnNewPolicy, setNotifyOnNewPolicy] = useState(true);
  const [notifyOnStrategyGenerated, setNotifyOnStrategyGenerated] = useState(true);
  const [notifyOnContactForm, setNotifyOnContactForm] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);

  useEffect(() => {
    if (profileQuery.data) {
      if (!editingProfile) {
        setProfileName(profileQuery.data.name ?? "");
        setProfileEmail(profileQuery.data.email ?? "");
      }
      const prefs = profileQuery.data.notificationPreferences;
      if (prefs) {
        setNotifyOnNewPolicy(prefs.notifyOnNewPolicy ?? true);
        setNotifyOnStrategyGenerated(prefs.notifyOnStrategyGenerated ?? true);
        setNotifyOnContactForm(prefs.notifyOnContactForm ?? true);
      }
    }
  }, [profileQuery.data, editingProfile]);

  const handleSaveProfile = async () => {
    const parsed = profileDetailsSchema.safeParse({ name: profileName, email: profileEmail });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    try {
      await updateProfileMutation.mutateAsync(parsed.data);
      await profileQuery.refetch();
      setEditingProfile(false);
      toast.success("Profile updated successfully");
    } catch {
      toast.error("Failed to update profile");
    }
  };

  const handleToggleNotification = async (key: "notifyOnNewPolicy" | "notifyOnStrategyGenerated" | "notifyOnContactForm", value: boolean) => {
    if (key === "notifyOnNewPolicy") setNotifyOnNewPolicy(value);
    if (key === "notifyOnStrategyGenerated") setNotifyOnStrategyGenerated(value);
    if (key === "notifyOnContactForm") setNotifyOnContactForm(value);
    setSavingPrefs(true);
    try {
      await updateProfileMutation.mutateAsync({
        notificationPreferences: { [key]: value },
      });
      await utils.auth.getProfile.invalidate();
    } catch {
      toast.error("Failed to save notification preference");
      // Revert on error
      if (key === "notifyOnNewPolicy") setNotifyOnNewPolicy(!value);
      if (key === "notifyOnStrategyGenerated") setNotifyOnStrategyGenerated(!value);
      if (key === "notifyOnContactForm") setNotifyOnContactForm(!value);
    } finally {
      setSavingPrefs(false);
    }
  };

  // ── Contacts state ─────────────────────────────────────────────────────────
  const contactsQuery = trpc.contacts.list.useQuery();
  const addContactMutation = trpc.contacts.add.useMutation();
  const updateContactMutation = trpc.contacts.update.useMutation();
  const deleteContactMutation = trpc.contacts.delete.useMutation();

  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({ name: "", email: "", relationship: "", receiveCcEmails: 1 });
  const [editingContactId, setEditingContactId] = useState<number | null>(null);
  const [editContact, setEditContact] = useState({ name: "", email: "", relationship: "" });

  const contacts: Contact[] = (contactsQuery.data as Contact[] | undefined) ?? [];

  const handleAddContact = async () => {
    const parsed = contactDetailsSchema.safeParse(newContact);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    try {
      await addContactMutation.mutateAsync(parsed.data);
      await contactsQuery.refetch();
      setNewContact({ name: "", email: "", relationship: "", receiveCcEmails: 1 });
      setShowAddContact(false);
      toast.success("Contact added");
    } catch {
      toast.error("Failed to add contact");
    }
  };

  const handleUpdateContact = async (id: number) => {
    const parsed = contactDetailsSchema.safeParse(editContact);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    try {
      await updateContactMutation.mutateAsync({ id, ...parsed.data });
      await contactsQuery.refetch();
      setEditingContactId(null);
      toast.success("Contact updated");
    } catch {
      toast.error("Failed to update contact");
    }
  };

  const handleToggleCc = async (contact: Contact) => {
    try {
      await updateContactMutation.mutateAsync({
        id: contact.id,
        receiveCcEmails: contact.receiveCcEmails ? 0 : 1,
      });
      await contactsQuery.refetch();
    } catch {
      toast.error("Failed to update CC preference");
    }
  };

  const handleDeleteContact = async (id: number) => {
    try {
      await deleteContactMutation.mutateAsync({ id });
      await contactsQuery.refetch();
      toast.success("Contact removed");
    } catch {
      toast.error("Failed to remove contact");
    }
  };

  const startEditContact = (contact: Contact) => {
    setEditingContactId(contact.id);
    setEditContact({
      name: contact.name,
      email: contact.email,
      relationship: contact.relationship ?? "",
    });
  };

  return (
    <Layout>
      <div className="container max-w-3xl py-10">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Profile & Settings</h1>
          <p className="text-muted-foreground">
            Manage your profile and save contact details for your care team.
          </p>
        </div>

        {/* ── Profile Card ──────────────────────────────────────────────────── */}
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-teal" />
                Your Profile
              </CardTitle>
              <CardDescription>
                Your profile details are saved with this portal session.
              </CardDescription>
            </div>
            {!editingProfile && (
              <Button variant="outline" size="sm" disabled={profileQuery.isLoading || profileQuery.isError || savingPrefs} onClick={() => setEditingProfile(true)}>
                <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                Edit
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {profileQuery.isLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading profile…
              </div>
            ) : profileQuery.isError ? (
              <p role="alert">Profile could not be loaded. <button className="underline" onClick={() => void profileQuery.refetch()}>Try again</button></p>
            ) : editingProfile ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="profile-name">Display Name</Label>
                  <Input
                    disabled={updateProfileMutation.isPending}
                    id="profile-name"
                    value={profileName}
                    onChange={e => setProfileName(e.target.value)}
                    placeholder="e.g. Daniel Radulescu"
                    autoCapitalize="words"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="profile-email">Email Address</Label>
                  <Input
                    disabled={updateProfileMutation.isPending}
                    id="profile-email"
                    type="email"
                    value={profileEmail}
                    onChange={e => setProfileEmail(e.target.value)}
                    placeholder="e.g. daniel@scvisitingangels.com"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={updateProfileMutation.isPending}
                    className="bg-teal hover:bg-teal-dark text-white"
                  >
                    {updateProfileMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                    ) : (
                      <Save className="w-4 h-4 mr-1.5" />
                    )}
                    Save Changes
                  </Button>
                  <Button variant="outline" disabled={updateProfileMutation.isPending} onClick={() => {
                    setEditingProfile(false);
                    setProfileName(profileQuery.data?.name ?? "");
                    setProfileEmail(profileQuery.data?.email ?? "");
                  }}>
                    <X className="w-4 h-4 mr-1.5" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal/10 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-teal" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      {profileQuery.data?.name || <span className="text-muted-foreground italic">No name set</span>}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" />
                      {profileQuery.data?.email || <span className="italic">No email set</span>}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── CC Contacts Card ──────────────────────────────────────────────── */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-teal" />
              CC Contacts
            </CardTitle>
            <CardDescription>
              Save people you may want to contact about your plan. CC preferences are included in office handoffs; choose recipients explicitly when emailing a strategy.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Contact list */}
            {contactsQuery.isLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading contacts…
              </div>
            ) : contactsQuery.isError ? (
              <p role="alert" className="mb-4">Contacts could not be loaded. <button className="underline" onClick={() => void contactsQuery.refetch()}>Try again</button></p>
            ) : contacts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg mb-4">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No contacts yet. Add someone below to your care team.</p>
              </div>
            ) : (
              <div className="space-y-3 mb-4">
                {contacts.map(contact => (
                  <div key={contact.id} className="border rounded-lg p-3">
                    {editingContactId === contact.id ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label htmlFor={`contact-name-${contact.id}`} className="text-xs">Name</Label>
                            <Input
                              id={`contact-name-${contact.id}`}
                              disabled={updateContactMutation.isPending}
                              value={editContact.name}
                              onChange={e => setEditContact(prev => ({ ...prev, name: e.target.value }))}
                              className="h-8 text-sm"
                              autoCapitalize="words"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor={`contact-email-${contact.id}`} className="text-xs">Email</Label>
                            <Input
                              type="email"
                              id={`contact-email-${contact.id}`}
                              disabled={updateContactMutation.isPending}
                              value={editContact.email}
                              onChange={e => setEditContact(prev => ({ ...prev, email: e.target.value }))}
                              className="h-8 text-sm"
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`contact-relationship-${contact.id}`} className="text-xs">Relationship (optional)</Label>
                          <Input
                            id={`contact-relationship-${contact.id}`}
                              disabled={updateContactMutation.isPending}
                              value={editContact.relationship}
                            onChange={e => setEditContact(prev => ({ ...prev, relationship: e.target.value }))}
                            placeholder="e.g. Supervisor, Care Coordinator"
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleUpdateContact(contact.id)} disabled={updateContactMutation.isPending}
                            className="bg-teal hover:bg-teal-dark text-white h-7 text-xs">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Save
                          </Button>
                          <Button size="sm" variant="outline" disabled={updateContactMutation.isPending} onClick={() => setEditingContactId(null)} className="h-7 text-xs">
                            <X className="w-3 h-3 mr-1" /> Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-slate-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{contact.name}</p>
                            <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                              <Mail className="w-3 h-3 flex-shrink-0" />
                              {contact.email}
                            </p>
                            {contact.relationship && (
                              <Badge variant="secondary" className="text-[10px] mt-0.5 h-4">{contact.relationship}</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-muted-foreground hidden sm:inline">CC</span>
                            <Switch
                              aria-label={`CC preference for ${contact.name}`}
                              disabled={updateContactMutation.isPending || deleteContactMutation.isPending}
                              checked={!!contact.receiveCcEmails}
                              onCheckedChange={() => handleToggleCc(contact)}
                            />
                          </div>
                          <Button size="icon" variant="ghost" className="h-7 w-7" aria-label={`Edit ${contact.name}`} disabled={updateContactMutation.isPending || deleteContactMutation.isPending} onClick={() => startEditContact(contact)}>
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                            aria-label={`Remove ${contact.name}`} disabled={deleteContactMutation.isPending || updateContactMutation.isPending} onClick={() => handleDeleteContact(contact.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <Separator className="mb-4" />

            {/* Add contact form */}
            {showAddContact ? (
              <div className="border rounded-lg p-4 bg-slate-50 space-y-3">
                <p className="text-sm font-medium">Add New Contact</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="new-name" className="text-xs">Name *</Label>
                    <Input
                      disabled={addContactMutation.isPending} id="new-name"
                      value={newContact.name}
                      onChange={e => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Full name"
                      className="h-9"
                      autoCapitalize="words"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="new-email" className="text-xs">Email *</Label>
                    <Input
                      disabled={addContactMutation.isPending} id="new-email"
                      type="email"
                      value={newContact.email}
                      onChange={e => setNewContact(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="email@example.com"
                      className="h-9"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="new-relationship" className="text-xs">Relationship (optional)</Label>
                  <Input
                    disabled={addContactMutation.isPending} id="new-relationship"
                    value={newContact.relationship}
                    onChange={e => setNewContact(prev => ({ ...prev, relationship: e.target.value }))}
                    placeholder="e.g. Supervisor, Care Coordinator, Family Member"
                    className="h-9"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    disabled={addContactMutation.isPending} id="new-cc"
                    checked={!!newContact.receiveCcEmails}
                    onCheckedChange={v => setNewContact(prev => ({ ...prev, receiveCcEmails: v ? 1 : 0 }))}
                  />
                  <Label htmlFor="new-cc" className="text-sm cursor-pointer">Include CC preference in office handoffs</Label>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button
                    onClick={handleAddContact}
                    disabled={addContactMutation.isPending}
                    className="bg-teal hover:bg-teal-dark text-white"
                    size="sm"
                  >
                    {addContactMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                    ) : (
                      <Plus className="w-4 h-4 mr-1.5" />
                    )}
                    Add Contact
                  </Button>
                  <Button variant="outline" size="sm" disabled={addContactMutation.isPending} onClick={() => {
                    setShowAddContact(false);
                    setNewContact({ name: "", email: "", relationship: "", receiveCcEmails: 1 });
                  }}>
                    <X className="w-4 h-4 mr-1.5" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="outline" onClick={() => setShowAddContact(true)} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Contact
              </Button>
            )}
          </CardContent>
        </Card>

        {/* ── Notification Preferences Card ─────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-teal" />
              Notification Preferences
            </CardTitle>
            <CardDescription>
              Choose when you receive owner notifications for portal activity.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {profileQuery.isLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading preferences…
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">New policy form submitted</p>
                    <p className="text-xs text-muted-foreground">Receive a notification when a family completes the policy intake form</p>
                  </div>
                  <Switch
                    aria-label="New policy notification preference" checked={notifyOnNewPolicy}
                    onCheckedChange={v => handleToggleNotification("notifyOnNewPolicy", v)}
                    disabled={savingPrefs || editingProfile || profileQuery.isError}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Strategy generated</p>
                    <p className="text-xs text-muted-foreground">Receive a notification when a personalized strategy is created</p>
                  </div>
                  <Switch
                    aria-label="Strategy generated notification preference" checked={notifyOnStrategyGenerated}
                    onCheckedChange={v => handleToggleNotification("notifyOnStrategyGenerated", v)}
                    disabled={savingPrefs || editingProfile || profileQuery.isError}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Contact form submission</p>
                    <p className="text-xs text-muted-foreground">Receive a notification when someone submits the contact form</p>
                  </div>
                  <Switch
                    aria-label="Contact form submission notification preference" checked={notifyOnContactForm}
                    onCheckedChange={v => handleToggleNotification("notifyOnContactForm", v)}
                    disabled={savingPrefs || editingProfile || profileQuery.isError}
                  />
                </div>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-4 bg-slate-50 rounded p-3">
              Preferences are saved automatically. Automatic notifications are not connected yet; these settings do not currently trigger or suppress delivery.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
