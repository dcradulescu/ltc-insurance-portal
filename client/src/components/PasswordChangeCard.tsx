import { useState, type FormEvent } from "react";
import { LockKeyhole, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { clearAccountDrafts } from "@/lib/accountStorage";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PasswordChangeCard() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [changed, setChanged] = useState(false);
  const change = trpc.auth.changePassword.useMutation({ retry: false });
  const busy = change.isPending || changed;
  async function submit(event: FormEvent) {
    event.preventDefault(); setError("");
    if (newPassword !== confirmation) { setError("The new passwords do not match."); return; }
    if (newPassword === currentPassword) { setError("Choose a different new password."); return; }
    try {
      await change.mutateAsync({ currentPassword, newPassword });
      setChanged(true); clearAccountDrafts();
      window.location.assign("/login?returnTo=%2Fprofile&passwordChanged=1");
    } catch (cause: any) {
      const code = cause?.data?.code;
      setError(code === "BAD_REQUEST" || code === "CONFLICT" ? cause.message : code === "TOO_MANY_REQUESTS" || cause?.meta?.response?.status === 429
        ? "Too many attempts. Wait 15 minutes before trying again, or contact the office."
        : "The password change could not be confirmed. Try signing in with your new password before retrying, or contact the office.");
    } finally {
      setCurrentPassword(""); setNewPassword(""); setConfirmation(""); change.reset();
    }
  }
  return <Card className="mb-6">
    <CardHeader><CardTitle className="flex items-center gap-2"><LockKeyhole className="h-5 w-5 text-teal" aria-hidden="true" />Change password</CardTitle><CardDescription>Use 15–128 characters. Changing your password signs you out on all devices. Save any work before continuing.</CardDescription></CardHeader>
    <CardContent><form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5"><Label htmlFor="current-password">Current password</Label><Input id="current-password" type="password" autoComplete="current-password" required maxLength={128} value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} disabled={busy} /></div>
      <div className="space-y-1.5"><Label htmlFor="new-password">New password</Label><Input id="new-password" type="password" autoComplete="new-password" required minLength={15} maxLength={128} value={newPassword} onChange={event => setNewPassword(event.target.value)} disabled={busy} /></div>
      <div className="space-y-1.5"><Label htmlFor="confirm-password">Confirm new password</Label><Input id="confirm-password" type="password" autoComplete="new-password" required minLength={15} maxLength={128} value={confirmation} onChange={event => setConfirmation(event.target.value)} disabled={busy} /></div>
      {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {changed && <p role="status" className="text-sm text-teal-800">Password changed. Opening sign-in…</p>}
      <Button type="submit" className="bg-teal hover:bg-teal-dark text-white" disabled={busy}>{busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />Changing password…</> : "Change password and sign out"}</Button>
    </form></CardContent>
  </Card>;
}
