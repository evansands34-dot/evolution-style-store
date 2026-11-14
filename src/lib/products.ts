import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const productImage = (_key: string) => "";

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  price: number;
  image: string;
};

export const productsQuery = queryOptions({
  queryKey: ["products"],
  queryFn: async () => {
    const { data, error } = await supabase.from("products").select("*").order("created_at");
    if (error) throw error;
    return (data ?? []).map((p) => ({ ...p, price: Number(p.price), image: "" })) as Product[];
  },
  staleTime: 60_000,
});

export const money = (n: number) => `$${n.toFixed(2)}`;
