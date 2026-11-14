import { Link } from "@tanstack/react-router";
import { type Product } from "@/lib/products";

export function ProductCard({ p, compact }: { p: Product; compact?: boolean }) {
  return (
    <Link
      to="/product/$slug"
      params={{ slug: p.slug }}
      className="group block overflow-hidden rounded-lg border bg-card transition hover:border-primary"
    >
      <div className="flex aspect-square w-full items-center justify-center border-b bg-muted/30 text-[10px] font-medium uppercase tracking-[0.3em] text-muted-foreground">
        No image
      </div>
      <div className={compact ? "p-2" : "p-3"}>
        <p className={`font-semibold ${compact ? "text-xs" : "text-sm"}`}>{p.name}</p>
        <p className="text-xs text-primary">${Number(p.price).toFixed(2)}</p>
      </div>
    </Link>
  );
}
