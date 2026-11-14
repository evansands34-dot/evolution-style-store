CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text NOT NULL DEFAULT '',
  last_name text NOT NULL DEFAULT '',
  language text NOT NULL DEFAULT 'English',
  country text NOT NULL DEFAULT 'Canada',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'first_name',''), COALESCE(NEW.raw_user_meta_data->>'last_name',''));
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  price numeric(10,2) NOT NULL,
  image text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products public" ON public.products FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.products (slug,name,description,category,tags,price,image) VALUES
('apex-runner-sneakers','Apex Runner Sneakers','Lightweight knit sneakers with a cushioned sole built for all-day comfort and street style.','Shoes','{shoes,sneakers,trainers,running,footwear,kicks}',129.99,'sneakers'),
('summit-leather-boots','Summit Leather Boots','Rugged full-grain leather boots with a lug sole, made for cold streets and long walks.','Shoes','{shoes,boots,leather,footwear,winter}',189.99,'boots'),
('drift-slides','Drift Slides','Soft molded slides for recovery days, poolside and quick errands.','Shoes','{shoes,slides,sandals,footwear,summer}',39.99,'slides'),
('core-heavy-hoodie','Core Heavy Hoodie','Heavyweight brushed fleece hoodie with a relaxed fit and embroidered Evo logo.','Clothing','{clothing,hoodie,sweatshirt,top,jumper,pullover}',84.99,'hoodie'),
('essential-oversized-tee','Essential Oversized Tee','Premium cotton oversized t-shirt with dropped shoulders. A wardrobe staple.','Clothing','{clothing,shirt,tshirt,tee,top}',34.99,'tee'),
('utility-cargo-pants','Utility Cargo Pants','Tapered cargo pants with six pockets and an adjustable hem.','Clothing','{clothing,pants,trousers,cargo,bottoms}',94.99,'cargo'),
('storm-puffer-jacket','Storm Puffer Jacket','Water-resistant puffer jacket with recycled insulation and a stowable hood.','Clothing','{clothing,jacket,coat,puffer,outerwear,winter}',219.99,'puffer'),
('evo-cap','Evo Cap','Structured six-panel cap with curved brim and tonal logo.','Accessories','{accessories,hat,cap,headwear}',29.99,'cap');

CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  author_name text NOT NULL,
  rating int NOT NULL DEFAULT 5,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews read" ON public.reviews FOR SELECT TO authenticated USING (true);
CREATE POLICY "reviews insert own" ON public.reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reviews delete own" ON public.reviews FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cart_items TO authenticated;
GRANT ALL ON public.cart_items TO service_role;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cart own" ON public.cart_items FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity int NOT NULL DEFAULT 1,
  price numeric(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'purchased',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders own" ON public.orders FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.search_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  query text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.search_history TO authenticated;
GRANT ALL ON public.search_history TO service_role;
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "search own" ON public.search_history FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.product_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.product_views TO authenticated;
GRANT ALL ON public.product_views TO service_role;
ALTER TABLE public.product_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "views own" ON public.product_views FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);