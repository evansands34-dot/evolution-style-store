export type Searchable = { name: string; description: string; category: string; tags: string[] };

const SYNONYMS: Record<string, string[]> = {
  shoes: ["sneakers", "boots", "slides", "footwear", "trainers", "kicks"],
  shoe: ["sneakers", "boots", "slides", "footwear"],
  sneaker: ["sneakers"],
  shirt: ["tee", "tshirt", "top"],
  tshirt: ["tee", "shirt"],
  jacket: ["coat", "puffer", "outerwear"],
  coat: ["jacket", "puffer"],
  pants: ["trousers", "cargo", "bottoms"],
  hat: ["cap", "headwear"],
  sweater: ["hoodie", "sweatshirt", "jumper"],
  clothes: ["clothing"],
};

function lev(a: string, b: string) {
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array<number>(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0]![j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i]![j] = Math.min(d[i - 1]![j]! + 1, d[i]![j - 1]! + 1, d[i - 1]![j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length]![b.length]!;
}

export function scoreItem(item: Searchable, query: string): number {
  const terms = query.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter(Boolean);
  if (!terms.length) return 0;
  const words = `${item.name} ${item.category} ${item.tags.join(" ")}`.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  const desc = item.description.toLowerCase();
  let score = 0;
  for (const t of terms) {
    const variants = [t, ...(SYNONYMS[t] ?? [])];
    let best = 0;
    for (const v of variants) {
      for (const w of words) {
        if (w === v) best = Math.max(best, v === t ? 10 : 7);
        else if (w.startsWith(v) || v.startsWith(w)) best = Math.max(best, 6);
        else if (v.length > 3 && lev(w, v) <= 1) best = Math.max(best, 5);
      }
      if (desc.includes(v)) best = Math.max(best, 3);
    }
    score += best;
  }
  return score;
}

export function searchItems<T extends Searchable>(items: T[], query: string): T[] {
  return items
    .map((i) => ({ i, s: scoreItem(i, query) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .map((x) => x.i);
}
