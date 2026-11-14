import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { profileQuery } from "@/lib/user";
import { productsQuery, productImage, money } from "@/lib/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({ meta: [{ title: "Account — Evolution" }, { name: "description", content: "Settings and purchases." }, { property: "og:title", content: "Account — Evolution" }, { property: "og:description", content: "Settings and purchases." }] }),
  component: Account,
});

const LANGS = ["English", "Français", "Español", "Deutsch", "Português", "中文", "العربية"];
const sel = "w-full rounded-md border bg-background px-3 py-2 text-sm";

function Account() {
  const qc = useQueryClient();
  const { data: profile } = useQuery(profileQuery);
  const { data: products = [] } = useQuery(productsQuery);
  const { data: orders = [] } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => (await supabase.from("orders").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const [lang, setLang] = useState("English");
  const [country, setCountry] = useState("Canada");
  const [cur, setCur] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  useEffect(() => { if (profile) { setLang(profile.language); setCountry(profile.country); } }, [profile]);

  async function save() {
    await supabase.from("profiles").update({ language: lang, country }).eq("id", profile!.id);
    qc.invalidateQueries({ queryKey: ["profile"] });
    toast.success("Settings saved");
  }
  async function changePw() {
    if (pw.length < 6) return toast.error("New password must be at least 6 characters.");
    if (pw !== pw2) return toast.error("New passwords don't match.");
    const { error } = await supabase.auth.updateUser({ password: pw, current_password: cur } as never);
    if (error) return toast.error(error.message);
    setCur(""); setPw(""); setPw2(""); toast.success("Password updated");
  }
  async function ret(id: string) {
    await supabase.from("orders").update({ status: "returned" }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["orders"] });
    toast.success("Return started. You'll get a refund once we receive it.");
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-6">
        <h1 className="font-display text-4xl tracking-wide">{profile?.first_name} {profile?.last_name}</h1>
        <section className="space-y-3 rounded-lg border bg-card p-4">
          <h2 className="font-semibold">Preferences</h2>
          <div><Label>Language</Label><select className={sel} value={lang} onChange={(e) => setLang(e.target.value)}>{LANGS.map((l) => <option key={l}>{l}</option>)}</select></div>
          <div><Label>Where you're from</Label><Input value={country} onChange={(e) => setCountry(e.target.value)} /></div>
          <Button onClick={save}>Save</Button>
        </section>
        <section className="space-y-3 rounded-lg border bg-card p-4">
          <h2 className="font-semibold">Security</h2>
          <div><Label>Current password</Label><Input type="password" value={cur} onChange={(e) => setCur(e.target.value)} /></div>
          <div><Label>New password</Label><Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} /></div>
          <div><Label>Type new password again</Label><Input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} /></div>
          <Button onClick={changePw}>Change password</Button>
        </section>
      </div>
      <section>
        <h2 className="mb-4 font-display text-3xl tracking-wide">Recent buys</h2>
        {orders.length === 0 && <p className="text-muted-foreground">No purchases yet.</p>}
        <ul className="space-y-3">
          {orders.map((o) => {
            const p = products.find((x) => x.id === o.product_id);
            if (!p) return null;
            return (
              <li key={o.id} className="flex items-center gap-4 rounded-lg border bg-card p-3">
                <img src={productImage(p.image)} alt={p.name} className="h-16 w-16 rounded object-cover" />
                <div className="flex-1">
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString()} · Qty {o.quantity} · {money(Number(o.price) * o.quantity)}</p>
                </div>
                {o.status === "returned" ? <span className="text-sm text-muted-foreground">Returned</span> : <Button variant="outline" size="sm" onClick={() => ret(o.id)}>Return</Button>}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
