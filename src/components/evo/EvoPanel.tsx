import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, Send, Sparkles } from "lucide-react";
import { productsQuery } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";
import { useEvo } from "./evo-context";

type Msg = { role: "user" | "assistant"; content: string };

function buildEvoReply(products: { slug: string; name: string; category: string; tags: string[]; description: string }[], input: string, productSlug?: string) {
  const q = input.trim().toLowerCase();
  if (!q) return "Ask me about a style, color, or fit and I’ll suggest something to check out.";

  const focus = products.find((p) => p.slug === productSlug);
  const matches = products.filter((p) => {
    const haystack = `${p.name} ${p.category} ${p.tags.join(" ")} ${p.description}`.toLowerCase();
    return haystack.includes(q) || p.name.toLowerCase().includes(q) || p.tags.some((tag) => tag.toLowerCase().includes(q));
  });

  if (matches.length > 0) {
    const suggested = matches.slice(0, 3).map((p) => `[[${p.slug}]]`).join(" ");
    const intro = focus ? `For ${focus.name}, I’d look at ` : "I’d recommend ";
    return `${intro}${matches.slice(0, 3).map((p) => p.name).join(", ")}.\n\n${suggested}`;
  }

  const fallback = ["sneakers", "hoodie", "boots", "tee", "cargo", "slides"]
    .map((term) => products.find((p) => p.tags.some((tag) => tag.toLowerCase().includes(term)) || p.category.toLowerCase().includes(term)))
    .filter(Boolean)
    .slice(0, 3);

  if (fallback.length > 0) {
    const suggested = fallback.map((p) => `[[${p.slug}]]`).join(" ");
    return `I’m running in a safe offline mode right now, but these are good starters:\n\n${fallback.map((p) => p.name).join(", ")}\n\n${suggested}`;
  }

  return "I’m here to help with style picks, but the AI is currently offline. Try terms like sneakers, hoodie, boots, or cargo.";
}

export function EvoPanel() {
  const { productSlug, close } = useEvo();
  const { data: products = [] } = useQuery(productsQuery);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const focus = products.find((p) => p.slug === productSlug);

  useEffect(() => end.current?.scrollIntoView({ behavior: "smooth" }), [msgs, busy]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || busy) return;

    const next = [...msgs, { role: "user" as const, content: trimmed }];
    setMsgs(next);
    setInput("");
    setBusy(true);

    try {
      const response = buildEvoReply(products, trimmed, productSlug);
      setMsgs([...next, { role: "assistant", content: response }]);
    } catch {
      setMsgs([...next, { role: "assistant", content: "Something went wrong. Please try again." }]);
    } finally {
      setBusy(false);
    }
  }

  function render(text: string) {
    const slugs = [...text.matchAll(/\[\[([a-z0-9-]+)\]\]/g)].map((m) => m[1]);
    const clean = text.replace(/\[\[([a-z0-9-]+)\]\]/g, (_, s) => products.find((p) => p.slug === s)?.name ?? s);
    const items = [...new Set(slugs)]
      .map((s) => products.find((p) => p.slug === s))
      .filter(Boolean) as typeof products;

    return (
      <>
        <p className="whitespace-pre-wrap">{clean}</p>
        {items.length > 0 && (
          <div className="mt-2 grid grid-cols-2 gap-2">
            {items.map((p) => <ProductCard key={p.id} p={p} compact />)}
          </div>
        )}
      </>
    );
  }

  return (
    <aside className="sticky top-0 flex h-screen w-full flex-col border-l bg-surface md:w-1/4 md:min-w-[300px]">
      <div className="flex items-center justify-between border-b p-4">
        <h2 className="flex items-center gap-2 font-display text-2xl tracking-wide">
          <Sparkles className="h-5 w-5 text-primary" /> Evo AI
        </h2>
        <button onClick={close} aria-label="Close Evo AI">
          <X className="h-5 w-5" />
        </button>
      </div>
      {focus && <div className="border-b px-4 py-2 text-xs text-muted-foreground">Asking about: <span className="text-foreground">{focus.name}</span></div>}
      <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
        {msgs.length === 0 && (
          <p className="text-muted-foreground">Ask me about any item, or tell me what you’re looking for — like "show me something warm for winter".</p>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={m.role === "user" ? "ml-8 rounded-lg bg-primary p-3 text-primary-foreground" : "mr-4 rounded-lg bg-card p-3"}>
            {m.role === "user" ? m.content : render(m.content)}
          </div>
        ))}
        {busy && <p className="text-muted-foreground">Evo is thinking…</p>}
        <div ref={end} />
      </div>
      <form onSubmit={send} className="flex gap-2 border-t p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Evo AI…"
          className="flex-1 rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <button className="rounded-md bg-primary px-3 text-primary-foreground" aria-label="Send">
          <Send className="h-4 w-4" />
        </button>
      </form>
    </aside>
  );
}
