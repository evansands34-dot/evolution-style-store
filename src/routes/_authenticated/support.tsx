import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useEvo } from "@/components/evo/evo-context";

export const Route = createFileRoute("/_authenticated/support")({
  head: () => ({ meta: [{ title: "Customer service — Evolution" }, { name: "description", content: "Get help with your order." }, { property: "og:title", content: "Customer service — Evolution" }, { property: "og:description", content: "Get help with your order." }] }),
  component: Support,
});

const FAQ = [
  ["How do returns work?", "Go to your account, open Recent buys and press Return on any item."],
  ["How long does shipping take?", "Orders usually arrive in 3–7 business days."],
  ["How do I find my size?", "Ask Evo AI about any item and it'll help you pick a size."],
];

function Support() {
  const [msg, setMsg] = useState("");
  const { openEvo } = useEvo();
  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="font-display text-4xl tracking-wide">Customer service</h1>
      <div className="space-y-3">{FAQ.map(([q, a]) => <div key={q} className="rounded-lg border bg-card p-4"><p className="font-semibold">{q}</p><p className="text-sm text-muted-foreground">{a}</p></div>)}</div>
      <div className="space-y-3 rounded-lg border bg-card p-4">
        <p className="font-semibold">Send us a message</p>
        <Textarea value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="How can we help?" />
        <div className="flex gap-2">
          <Button onClick={() => { if (msg.trim()) { toast.success("Thanks! Our team will get back to you."); setMsg(""); } }}>Send</Button>
          <Button variant="outline" onClick={() => openEvo()}>Ask Evo AI instead</Button>
        </div>
      </div>
    </div>
  );
}
