/** Product truth — nothing here is invented beyond what Paddy Systems publishes. */

export type ProductStatus = "AVAILABLE NOW" | "IN DEVELOPMENT" | "UNANNOUNCED";

export type Product = {
  index: string;
  name: string;
  slug?: "relay" | "mirror";
  status: ProductStatus;
  summary: string;
};

export const PRODUCTS: Product[] = [
  {
    index: "01",
    name: "Relay",
    slug: "relay",
    status: "AVAILABLE NOW",
    summary:
      "Share a local service with another machine using a simple access code — no public ports, no complicated connection strings.",
  },
  {
    index: "02",
    name: "Mirror",
    slug: "mirror",
    status: "IN DEVELOPMENT",
    summary:
      "Compare a web implementation against its design reference at a chosen viewport.",
  },
  {
    index: "03",
    name: "Future",
    status: "UNANNOUNCED",
    summary: "A slot held for the next piece of friction worth removing.",
  },
];

export const RELAY_CLI = "npx --package @paddy-systems/relay-cli relay 3000";

/** Each product keeps its own site; these are the authoritative product homes. */
export const PRODUCT_SITES = {
  relay: "https://relay.paddy.systems",
  mirror: "https://mirror.paddy.systems",
} as const;

export type Note = {
  number: string;
  slug: string;
  title: string;
  /** Taxonomy is deliberately open enough for long-form technical writing. */
  category:
    | "Engineering"
    | "Architecture"
    | "Protocols"
    | "Infrastructure"
    | "Product"
    | "Company";
  standfirst: string;
  related?: { label: string; to: string };
};

export const NOTES: Note[] = [
  {
    number: "001",
    slug: "why-relay-local-starts-with-the-real-device",
    title: "Why Relay Local starts with the real device",
    category: "Engineering",
    standfirst:
      "Desktop development environments hide behaviour that only appears on a physical phone. Relay keeps the workflow small.",
    related: { label: "Relay", to: "/products/relay" },
  },
  {
    number: "002",
    slug: "mirror-starts-with-visual-truth",
    title: "Mirror starts with visual truth",
    category: "Product",
    standfirst:
      "Mirror begins with measurable rendered output rather than pretending it can infer everything about source code.",
    related: { label: "Mirror", to: "/products/mirror" },
  },
  {
    number: "003",
    slug: "small-tools-bigger-possibilities",
    title: "Small tools. Bigger possibilities.",
    category: "Company",
    standfirst:
      "We start with friction worth removing and try very hard not to turn every solution into an oversized platform.",
  },
];

export const noteBySlug = (slug: string) => NOTES.find((n) => n.slug === slug);
