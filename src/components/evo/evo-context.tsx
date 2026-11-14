import { createContext, useContext, useState, type ReactNode } from "react";

type Evo = { open: boolean; productSlug?: string; openEvo: (slug?: string) => void; close: () => void };
const Ctx = createContext<Evo | null>(null);

export function EvoProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [productSlug, setSlug] = useState<string | undefined>();
  return (
    <Ctx.Provider value={{ open, productSlug, openEvo: (s) => { setSlug(s); setOpen(true); }, close: () => setOpen(false) }}>
      {children}
    </Ctx.Provider>
  );
}
export const useEvo = () => useContext(Ctx)!;
