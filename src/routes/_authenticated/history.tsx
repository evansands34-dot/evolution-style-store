import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({ meta: [{ title: "Search history — Evolution" }, { name: "description", content: "Everything you searched." }, { property: "og:title", content: "Search history — Evolution" }, { property: "og:description", content: "Everything you searched." }] }),
  component: History,
});

function History() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["history"],
    queryFn: async () => (await supabase.from("search_history").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  async function clear() {
    await supabase.from("search_history").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    qc.invalidateQueries({ queryKey: ["history"] });
  }
  return (
    <div className="max-w-2xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-4xl tracking-wide">Search history</h1>
        {data.length > 0 && <Button variant="outline" size="sm" onClick={clear}>Clear</Button>}
      </div>
      {data.length === 0 && <p className="text-muted-foreground">You haven't searched anything yet.</p>}
      <ul className="divide-y rounded-lg border bg-card">
        {data.map((h) => (
          <li key={h.id} className="flex justify-between p-3 text-sm">
            <Link to="/search" search={{ q: h.query }} className="hover:text-primary">{h.query}</Link>
            <span className="text-muted-foreground">{new Date(h.created_at).toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
