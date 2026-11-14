import { Link } from "@tanstack/react-router";
import { productImage, money, type Product } from "@/lib/products";

export function ProductCard({ p, compact }: { p: Product; compact?: boolean }) {
  return (
    <Link to="/product/$slug" params={{ slug: p.slug }} className="group block overflow-hidden rounded-lg border bg-card transition hover:border-primary">
      <img src={productImage(p.image)} alt={p.name} loading="lazy" width={1024} height={1024} className="aspect-square w-full object-cover transition group-hover:scale-[1.03]" />
      <div className={compact ? "p-2" : "p-3"}>
        <p className={`font-semibold ${compact ? "text-xs" : "text-sm"}`}>{p.name}</p>
        <p className="text-xs text-primary">{money(p.price)}</p>
      </div>
    </Link>
  );
}
