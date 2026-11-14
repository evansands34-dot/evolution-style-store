import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Msg = { role: "user" | "assistant"; content: string };

export const askEvo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { messages: Msg[]; productSlug?: string }) => input)
  .handler(async ({ data, context }) => {
    const { generateResponse, GatewayError } = await import("@lovable.dev/ai-gateway");
    const { data: products } = await context.supabase
      .from("products").select("slug,name,description,category,tags,price");
    const catalog = (products ?? [])
      .map((p) => `- [[${p.slug}]] ${p.name} | ${p.category} | $${p.price} | ${p.description}`)
      .join("\n");
    const focus = data.productSlug ? `\nThe shopper is currently asking about the item [[${data.productSlug}]].` : "";
    const instructions = `You are Evo AI, the friendly shopping assistant for Evolution, a clothing and shoe brand.
Only recommend items from this catalog. When you mention or show an item, include its tag exactly like [[slug]] so the app can display it.
Keep answers short and helpful. Catalog:\n${catalog}${focus}`;
    try {
      const res = await generateResponse({
        model: "openai/gpt-6-astra",
        instructions,
        input: data.messages.slice(-12).map((m) => ({ role: m.role, content: m.content })),
      });
      let text = "";
      for (const item of res.output ?? []) {
        if (item.type === "message") for (const c of item.content) if (c.type === "output_text") text += c.text;
      }
      return { text: text || "Sorry, I couldn't come up with an answer." };
    } catch (e) {
      if (e instanceof GatewayError) {
        console.error("Evo AI error", e.code);
        return { text: "Evo AI is busy right now. Please try again in a moment." };
      }
      throw e;
    }
  });
