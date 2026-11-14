import { describe, it, expect } from "vitest";
import { searchItems } from "./search";

const items = [
  { name: "Apex Runner Sneakers", description: "knit", category: "Shoes", tags: ["shoes", "sneakers"] },
  { name: "Core Heavy Hoodie", description: "fleece", category: "Clothing", tags: ["hoodie"] },
];

describe("search", () => {
  it("searching shoes shows the sneakers", () => {
    expect(searchItems(items, "shoes").map((i) => i.name)).toContain("Apex Runner Sneakers");
  });
  it("searching sneakers shows sneakers first", () => {
    expect(searchItems(items, "sneakers")[0]!.name).toBe("Apex Runner Sneakers");
  });
  it("typo still finds item", () => {
    expect(searchItems(items, "hoodi")[0]!.name).toBe("Core Heavy Hoodie");
  });
  it("unrelated term returns nothing", () => {
    expect(searchItems(items, "laptop")).toHaveLength(0);
  });
});
