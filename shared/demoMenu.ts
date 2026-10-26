export interface DemoMenuItem {
  id: string;
  name: string;
  description: string;
  category: string;
  priceRupees: number;
}

/**
 * School-demo menu only. These example dishes and prices are not a real offer,
 * are not connected to fulfilment, and must be confirmed before any live use.
 */
export const DEMO_MENU: DemoMenuItem[] = [
  {
    id: "paneer-tikka",
    name: "Charred paneer tikka",
    description:
      "A bright, smoky sample plate with garden herbs and house chutney.",
    category: "From the tandoor",
    priceRupees: 320,
  },
  {
    id: "lamb-curry",
    name: "A Sunday-style lamb curry",
    description:
      "A warming, slow-simmered draft inspired by home-style Indian cooking.",
    category: "Slow cooked",
    priceRupees: 460,
  },
  {
    id: "saffron-biryani",
    name: "Saffron basmati biryani",
    description:
      "Long-grain basmati, fragrant spice and fresh herbs, served with raita.",
    category: "Biryani & rice",
    priceRupees: 380,
  },
  {
    id: "paneer-greens",
    name: "Seasonal paneer & greens",
    description:
      "A comforting vegetarian sample, finished with coriander and gentle spice.",
    category: "The vegetarian table",
    priceRupees: 340,
  },
  {
    id: "potato-chaat",
    name: "Crisp potato chaat",
    description:
      "A lively sharing plate with tamarind, mint and a little crunch.",
    category: "Small plates",
    priceRupees: 220,
  },
  {
    id: "cardamom-kulfi",
    name: "Cardamom kulfi",
    description:
      "A cool, fragrant ending to the meal; sample dessert selection.",
    category: "Sweet finish",
    priceRupees: 160,
  },
  {
    id: "lime-mint-cooler",
    name: "House lime & mint cooler",
    description: "A bright, alcohol-free sample serve.",
    category: "Drinks",
    priceRupees: 120,
  },
];

export const ORDER_STATUSES = [
  { id: "received", label: "Order received" },
  { id: "preparing", label: "Preparing food" },
  { id: "on_the_way", label: "On the way" },
  { id: "arrived", label: "Arrived" },
  { id: "delivered", label: "Delivered" },
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number]["id"];
export type DemoOrderStatus = OrderStatus;
