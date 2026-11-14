import { createFileRoute, Outlet, redirect, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Search, ShoppingCart, User, LogOut, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { profileQuery, cartQuery } from "@/lib/user";
import { EvoProvider, useEvo } from "@/components/evo/evo-context";
import { EvoPanel } from "@/components/evo/EvoPanel";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
  },
  component: () => <EvoProvider><Shell /></EvoProvider>,
});

function Shell() {
  const evo = useEvo();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const { data: profile } = useQuery(profileQuery);
  const { data: cart = [] } = useQuery(cartQuery);
  const count = cart.reduce((n, c) => n + c.quantity, 0);

  async function signOut() {
    await qc.cancelQueries(); qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const navCls = "px-3 py-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground";
  return (
    <div className="flex min-h-screen">
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
          <div className="flex items-center gap-4 px-4 py-3 md:px-8">
            <Link to="/home" className="font-display text-2xl tracking-wide">Evolution</Link>
            <form className="relative flex-1" onSubmit={(e) => { e.preventDefault(); if (q.trim()) navigate({ to: "/search", search: { q: q.trim() } }); }}>
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search sneakers, hoodies, boots…" className="w-full rounded-full border bg-surface py-2 pl-9 pr-4 text-sm outline-none focus:border-primary" />
            </form>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-accent">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">{profile ? `${profile.first_name} ${profile.last_name}` : "Account"}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate({ to: "/account" })}><Settings className="mr-2 h-4 w-4" />Settings & purchases</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}><LogOut className="mr-2 h-4 w-4" />Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Link to="/cart" className="relative flex flex-col items-center px-2">
              <ShoppingCart className="h-5 w-5" />
              <span className="text-xs font-bold">Cart</span>
              {count > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">{count}</span>}
            </Link>
          </div>
          <nav className="flex gap-1 overflow-x-auto border-t px-2 md:px-6">
            <Link to="/home" className={navCls} activeProps={{ className: "text-primary" }}>Home</Link>
            <Link to="/history" className={navCls} activeProps={{ className: "text-primary" }}>Search history</Link>
            <Link to="/support" className={navCls} activeProps={{ className: "text-primary" }}>Customer service</Link>
            <button onClick={() => (evo.open ? evo.close() : evo.openEvo())} className={`${navCls} ${evo.open ? "text-primary" : ""}`}>Evo AI</button>
          </nav>
        </header>
        <main className="px-4 py-6 md:px-8"><Outlet /></main>
      </div>
      {evo.open && <div className="fixed inset-0 z-50 md:static md:z-auto md:contents"><EvoPanel /></div>}
    </div>
  );
}
