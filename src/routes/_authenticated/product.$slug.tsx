import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Star, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { productsQuery, productImage, money } from "@/lib/products";
import { profileQuery, uid } from "@/lib/user";
import { useEvo } from "@/components/evo/evo-context";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/product/$slug")({
  head: () => ({ meta: [{ title: "Item — Evolution" }, { name: "description", content: "Evolution item details and reviews." }, { property: "og:title", content: "Item — Evolution" }, { property: "og:description", content: "Evolution item details and reviews." }] }),
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { openEvo } = useEvo();
  const { data: products = [] } = useQuery(productsQuery);
  const { data: profile } = useQuery(profileQuery);
  const p = products.find((x) => x.slug === slug);
  const [body, setBody] = useState("");
  const [rating, setRating] = useState(5);

  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews", p?.id], enabled: !!p,
    queryFn: async () => (await supabase.from("reviews").select("*").eq("product_id", p!.id).order("created_at", { ascending: false })).data ?? [],
  });

  useEffect(() => {
    if (!p) return;
    uid().then((user_id) => supabase.from("product_views").insert({ user_id, product_id: p.id })).then(() => qc.invalidateQueries({ queryKey: ["views"] }));
  }, [p?.id]);

  if (!p) return <p className="text-muted-foreground">Loading…</p>;

  async function addToCart() {
    const user_id = await uid();
    const { data: existing } = await supabase.from("cart_items").select("id,quantity").eq("product_id", p!.id).maybeSingle();
    if (existing) await supabase.from("cart_items").update({ quantity: existing.quantity + 1 }).eq("id", existing.id);
    else await supabase.from("cart_items").insert({ user_id, product_id: p!.id });
    await qc.invalidateQueries({ queryKey: ["cart"] });
    navigate({ to: "/cart" });
  }

  async function postReview(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    const user_id = await uid();
    const author_name = profile ? `${profile.first_name} ${profile.last_name.charAt(0)}.` : "Shopper";
    const { error } = await supabase.from("reviews").insert({ user_id, product_id: p!.id, author_name, rating, body: body.trim() });
    if (error) { toast.error("Couldn't post your review."); return; }
    setBody(""); setRating(5);
    qc.invalidateQueries({ queryKey: ["reviews", p!.id] });
  }

  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  return (
    <div className="space-y-12">
      <div className="grid gap-8 md:grid-cols-2">
        <img src={productImage(p.image)} alt={p.name} width={1024} height={1024} className="aspect-square w-full rounded-xl border object-cover" />
        <div className="flex flex-col justify-center gap-4">
          <p className="text-sm uppercase tracking-widest text-muted-foreground">{p.category}</p>
          <h1 className="font-display text-6xl leading-none tracking-wide">{p.name}</h1>
          <p className="text-2xl font-bold text-primary">{money(p.price)}</p>
          <p className="text-muted-foreground">{p.description}</p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" onClick={addToCart}>Add to cart</Button>
            <Button size="lg" variant="outline" onClick={() => openEvo(p.slug)}><Sparkles className="mr-2 h-4 w-4" />Ask Evo AI</Button>
          </div>
        </div>
      </div>

      <section className="max-w-3xl space-y-4">
        <h2 className="font-display text-3xl tracking-wide">Reviews {reviews.length > 0 && <span className="text-lg text-muted-foreground">· {avg.toFixed(1)} ★ ({reviews.length})</span>}</h2>
        <form onSubmit={postReview} className="space-y-3 rounded-lg border bg-card p-4">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button type="button" key={n} onClick={() => setRating(n)} aria-label={`${n} stars`}>
                <Star className={`h-5 w-5 ${n <= rating ? "fill-primary text-primary" : "text-muted-foreground"}`} />
              </button>
            ))}
          </div>
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write a review…" />
          <Button type="submit">Post review</Button>
        </form>
        {reviews.length === 0 && <p className="text-muted-foreground">No reviews yet — be the first.</p>}
        {reviews.map((r) => (
          <div key={r.id} className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between"><p className="font-semibold">{r.author_name}</p><p className="text-sm text-primary">{"★".repeat(r.rating)}</p></div>
            <p className="mt-1 text-sm text-muted-foreground">{r.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
