import { useState, type FormEvent } from "react";
import { Link, Redirect } from "wouter";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { LockKeyhole, Loader2 } from "lucide-react";

export function safeReturnPath(value: string | null) {
  return value && /^\/(policy-form|strategy|profile|documents)(\?|$)/.test(value) ? value : "/policy-form";
}
export default function Login() {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const login = trpc.auth.login.useMutation();
  const returnTo = safeReturnPath(new URLSearchParams(window.location.search).get("returnTo"));
  if (user) return <Redirect to={returnTo} />;
  async function submit(event: FormEvent) {
    event.preventDefault(); setError("");
    try {
      await login.mutateAsync({ email: email.trim(), password });
      setPassword("");
      // A fresh page also discards any previous account's query cache.
      window.location.assign(returnTo);
    } catch (err: any) {
      setPassword("");
      setError(err?.data?.code === "UNAUTHORIZED" ? "Unable to sign in. Check your email and password, or contact the office." :
        err?.data?.code === "TOO_MANY_REQUESTS" ? "Too many sign-in attempts. Please wait 15 minutes and try again." :
        "Sign-in is currently unavailable. Please contact the office for help.");
    }
  }
  return <Layout>
    <section className="mx-auto max-w-[480px] px-6 py-14 sm:py-20">
      <LockKeyhole className="mb-5 h-9 w-9 text-[#34B1C4]" aria-hidden="true" />
      <h1 className="text-3xl font-bold text-[#393F43]">Sign in to your LTC portal</h1>
      <p className="mt-3 mb-8 text-base leading-relaxed text-gray-600">Access your policy details, care strategy, and supporting documents.</p>
      {new URLSearchParams(window.location.search).get("passwordChanged") === "1" && <p role="status" className="mb-6 rounded-md bg-teal-50 p-3 text-sm text-teal-900">Your password was changed. Sign in with your new password.</p>}
      <form onSubmit={submit} className="space-y-5">
        <div className="space-y-2"><Label htmlFor="login-email">Email address</Label><Input id="login-email" type="email" autoComplete="username" maxLength={320} required value={email} onChange={e => setEmail(e.target.value)} disabled={login.isPending} /></div>
        <div className="space-y-2"><Label htmlFor="login-password">Password</Label><Input id="login-password" type="password" autoComplete="current-password" maxLength={128} required value={password} onChange={e => setPassword(e.target.value)} disabled={login.isPending} /></div>
        {error ? <p role="alert" className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}
        <Button type="submit" disabled={login.isPending} className="w-full bg-[#24899a] hover:bg-[#1b7180] text-white h-11">{login.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in…</> : "Sign in"}</Button>
      </form>
      <p className="mt-6 text-sm leading-relaxed text-gray-600">Need an account or a password reset? Contact SC Visiting Angels at <a className="font-semibold text-[#24899a] underline" href="tel:+18642446300">(864) 244-6300</a>.</p>
      <Link href="/" className="mt-6 inline-block text-sm text-[#24899a] underline">Return to the home page</Link>
    </section>
  </Layout>;
}
