import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import sneakers from "@/assets/products/sneakers.jpg";
import boots from "@/assets/products/boots.jpg";
import slides from "@/assets/products/slides.jpg";
import hoodie from "@/assets/products/hoodie.jpg";
import tee from "@/assets/products/tee.jpg";
import cargo from "@/assets/products/cargo.jpg";
import puffer from "@/assets/products/puffer.jpg";
import cap from "@/assets/products/cap.jpg";

const IMAGES: Record<string, string> = { sneakers, boots, slides, hoodie, tee, cargo, puffer, cap };
export const productImage = (key: string) => IMAGES[key] ?? sneakers;

export type Product = {
  id: string; slug: string; name: string; description: string; category: string; tags: string[]; price: number; image: string;
};

export const productsQuery = queryOptions({
  queryKey: ["products"],
  queryFn: async () => {
    const { data, error } = await supabase.from("products").select("*").order("created_at");
    if (error) throw error;
    return (data ?? []).map((p) => ({ ...p, price: Number(p.price) })) as Product[];
  },
  staleTime: 60_000,
});

export const money = (n: number) => `$${n.toFixed(2)}`;
