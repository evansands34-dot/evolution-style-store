import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Evolution — Clothing & Shoes" },
      { name: "description", content: "Shop Evolution sneakers, boots, hoodies and more." },
      { property: "og:title", content: "Evolution — Clothing & Shoes" },
      { property: "og:description", content: "Shop Evolution sneakers, boots, hoodies and more." },
    ],
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    throw redirect({ to: data.session ? "/home" : "/auth" });
  },
  component: () => null,
});
