import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { productsQuery } from "@/lib/products";
import { searchItems } from "@/lib/search";
import { ProductCard } from "@/components/ProductCard";
import { uid } from "@/lib/user";

export const Route = createFileRoute("/_authenticated/search")({
  validateSearch: (s: Record<string, unknown>) => ({ q: typeof s.q === "string" ? s.q : "" }),
  head: () => ({ meta: [{ title: "Search — Evolution" }, { name: "description", content: "Search Evolution items." }, { property: "og:title", content: "Search — Evolution" }, { property: "og:description", content: "Search Evolution items." }] }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const { data: products = [] } = useQuery(productsQuery);
  useEffect(() => {
    if (!q) return;
    uid().then((user_id) => supabase.from("search_history").insert({ user_id, query: q }));
  }, [q]);
  const results = searchItems(products, q);
  return (
    <div>
      <h1 className="mb-4 font-display text-4xl tracking-wide">Results for "{q}"</h1>
      {results.length === 0 ? <p className="text-muted-foreground">Nothing matched. Try "shoes", "hoodie" or ask Evo AI.</p> :
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{results.map((p) => <ProductCard key={p.id} p={p} />)}</div>}
    </div>
  );
}
