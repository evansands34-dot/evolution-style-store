import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { productsQuery } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({ meta: [{ title: "Home — Evolution" }, { name: "description", content: "Your Evolution home." }, { property: "og:title", content: "Home — Evolution" }, { property: "og:description", content: "Your Evolution home." }] }),
  component: Home,
});

function Home() {
  const { data: products = [] } = useQuery(productsQuery);
  const { data: views = [] } = useQuery({
    queryKey: ["views"],
    queryFn: async () => (await supabase.from("product_views").select("product_id").order("created_at", { ascending: false }).limit(30)).data ?? [],
  });
  const viewed = new Set(views.map((v) => v.product_id));
  const cats = new Set(products.filter((p) => viewed.has(p.id)).map((p) => p.category));
  const tags = new Set(products.filter((p) => viewed.has(p.id)).flatMap((p) => p.tags));
  const rec = [...products]
    .map((p) => ({ p, s: (cats.has(p.category) ? 3 : 0) + p.tags.filter((t) => tags.has(t)).length + (viewed.has(p.id) ? 1 : 0) }))
    .sort((a, b) => b.s - a.s).slice(0, 4).map((x) => x.p);

  return (
    <div className="space-y-10">
      <section>
        <h2 className="mb-4 font-display text-3xl tracking-wide">Recommended items for you</h2>
        {views.length === 0 && <p className="mb-3 text-sm text-muted-foreground">Look at a few items and we'll tailor these picks to you.</p>}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{rec.map((p) => <ProductCard key={p.id} p={p} />)}</div>
      </section>
      <section>
        <h2 className="mb-4 font-display text-3xl tracking-wide">All items</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{products.map((p) => <ProductCard key={p.id} p={p} />)}</div>
      </section>
    </div>
  );
}
