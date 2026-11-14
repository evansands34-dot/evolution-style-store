import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { productsQuery, money } from "@/lib/products";
import { cartQuery, uid } from "@/lib/user";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/cart")({
  head: () => ({ meta: [{ title: "Cart — Evolution" }, { name: "description", content: "Your Evolution cart." }, { property: "og:title", content: "Cart — Evolution" }, { property: "og:description", content: "Your Evolution cart." }] }),
  component: Cart,
});

function Cart() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: products = [] } = useQuery(productsQuery);
  const { data: cart = [] } = useQuery(cartQuery);
  const lines = cart.map((c) => ({ ...c, p: products.find((p) => p.id === c.product_id)! })).filter((l) => l.p);
  const total = lines.reduce((s, l) => s + l.p.price * l.quantity, 0);

  async function remove(id: string) { await supabase.from("cart_items").delete().eq("id", id); qc.invalidateQueries({ queryKey: ["cart"] }); }
  async function checkout() {
    const user_id = await uid();
    const { error } = await supabase.from("orders").insert(lines.map((l) => ({ user_id, product_id: l.p.id, quantity: l.quantity, price: l.p.price })));
    if (error) { toast.error("Checkout failed. Please try again."); return; }
    await supabase.from("cart_items").delete().eq("user_id", user_id);
    qc.invalidateQueries();
    toast.success("Order placed! Thanks for shopping Evolution.");
    navigate({ to: "/account" });
  }

  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 font-display text-4xl tracking-wide">Your cart</h1>
      {lines.length === 0 ? <p className="text-muted-foreground">Your cart is empty. <Link to="/home" className="text-primary">Keep shopping</Link></p> : (
        <>
          <ul className="space-y-3">
            {lines.map((l) => (
              <li key={l.id} className="flex items-center gap-4 rounded-lg border bg-card p-3">
                <div className="flex h-20 w-20 items-center justify-center rounded bg-muted/30 text-[9px] font-medium uppercase tracking-[0.25em] text-muted-foreground">
                  No image
                </div>
                <div className="flex-1"><p className="font-semibold">{l.p.name}</p><p className="text-sm text-muted-foreground">Qty {l.quantity}</p></div>
                <p className="font-semibold">{money(l.p.price * l.quantity)}</p>
                <button onClick={() => remove(l.id)} aria-label="Remove"><Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" /></button>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex items-center justify-between rounded-lg border bg-card p-4">
            <p className="text-lg">Total: <span className="font-bold text-primary">{money(total)}</span></p>
            <Button size="lg" onClick={checkout}>Checkout</Button>
          </div>
        </>
      )}
    </div>
  );
}
