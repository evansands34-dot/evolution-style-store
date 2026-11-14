import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { nameToEmail } from "@/lib/auth-name";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — Evolution" },
      { name: "description", content: "Create an Evolution account or sign in." },
      { property: "og:title", content: "Sign in — Evolution" },
      { property: "og:description", content: "Create an Evolution account or sign in." },
    ],
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/home" });
  },
  component: AuthPage,
});

function AuthPage() {
  const [tab, setTab] = useState<"create" | "signin">("create");
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!first.trim() || !last.trim()) return setErr("Please enter your first and last name.");
    if (pw.length < 6) return setErr("Password must be at least 6 characters.");
    const email = nameToEmail(first, last);
    setBusy(true);
    if (tab === "create") {
      if (pw !== pw2) { setBusy(false); return setErr("The passwords don't match. Please type them again."); }
      const { error } = await supabase.auth.signUp({
        email, password: pw,
        options: { data: { first_name: first.trim(), last_name: last.trim() } },
      });
      if (error) { setBusy(false); return setErr(error.message.includes("registered") ? "An account with this name already exists. Try signing in." : error.message); }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
      if (error) { setBusy(false); return setErr("Name or password is incorrect."); }
    }
    navigate({ to: "/home", replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="mb-8 text-center font-display text-6xl tracking-wide">Evolution</h1>
        <div className="mb-6 grid grid-cols-2 rounded-lg bg-surface p-1">
          {(["create", "signin"] as const).map((t) => (
            <button key={t} onClick={() => { setTab(t); setErr(""); }}
              className={`rounded-md py-2.5 text-sm font-semibold transition ${tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {t === "create" ? "Create an account" : "Sign into an account"}
            </button>
          ))}
        </div>
        <form onSubmit={submit} className="space-y-4 rounded-xl border bg-card p-6">
          <div className="grid grid-cols-2 gap-3">
            <div><Label htmlFor="f">First name</Label><Input id="f" value={first} onChange={(e) => setFirst(e.target.value)} /></div>
            <div><Label htmlFor="l">Last name</Label><Input id="l" value={last} onChange={(e) => setLast(e.target.value)} /></div>
          </div>
          <div><Label htmlFor="p">{tab === "create" ? "Create a password" : "Password"}</Label><Input id="p" type="password" value={pw} onChange={(e) => setPw(e.target.value)} /></div>
          {tab === "create" && (
            <div><Label htmlFor="p2">Type the password again</Label><Input id="p2" type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} /></div>
          )}
          {err && <p className="text-sm text-destructive">{err}</p>}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Please wait…" : tab === "create" ? "Create account" : "Sign in"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">You'll stay signed in on this device.</p>
        </form>
      </div>
    </div>
  );
}
