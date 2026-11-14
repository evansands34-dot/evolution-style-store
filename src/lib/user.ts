import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const profileQuery = queryOptions({
  queryKey: ["profile"],
  queryFn: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return null;
    const { data } = await supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle();
    return data;
  },
});

export const cartQuery = queryOptions({
  queryKey: ["cart"],
  queryFn: async () => {
    const { data, error } = await supabase.from("cart_items").select("id,quantity,product_id").order("created_at");
    if (error) throw error;
    return data ?? [];
  },
});

export async function uid() {
  const { data } = await supabase.auth.getUser();
  return data.user!.id;
}
