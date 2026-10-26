export interface OpeningHour {
  days: string;
  hours: string;
}

export interface MenuEntry {
  category: string;
  name: string;
  description: string;
  price: string;
}

// Replace the blank operational details when Sobha's confirmed information is supplied.
export const restaurant = {
  address: "",
  phone: "",
  email: "",
  openingHours: [] as OpeningHour[],
  bookingUrl: "",
  orderUrl: "",
  socialLinks: [] as { label: string; url: string }[],
};

// These are editorial sample dishes, not confirmed Sobha menu claims. Replace names,
// descriptions and prices from the restaurant's actual menu before publishing.
export const menuDraft = true;

export const signaturePlates: MenuEntry[] = [
  { category: "FROM THE TANDOOR", name: "Charred paneer tikka", description: "A bright, smoky sample plate with garden herbs and house chutney.", price: "" },
  { category: "SLOW COOKED", name: "A Sunday-style lamb curry", description: "A warming, slow-simmered draft inspired by home-style Indian cooking.", price: "" },
  { category: "BIRYANI & RICE", name: "Saffron basmati biryani", description: "Long-grain basmati, fragrant spice and fresh herbs, served with raita.", price: "" },
  { category: "THE VEGETARIAN TABLE", name: "Seasonal paneer & greens", description: "A comforting vegetarian sample, finished with coriander and gentle spice.", price: "" },
  { category: "SMALL PLATES", name: "Crisp potato chaat", description: "A lively sharing plate with tamarind, mint and a little crunch.", price: "" },
  { category: "SWEET FINISH", name: "Cardamom kulfi", description: "A cool, fragrant ending to the meal; final dessert selection to come.", price: "" },
  { category: "DRINKS", name: "House lime & mint cooler", description: "A bright, alcohol-free sample serve; final drinks selection to come.", price: "" },
];

const tandoorImage = "/images/tandoor.webp";
const biryaniImage = "/images/biryani.webp";
const vegetarianImage = "/images/vegetarian.webp";
const drinksImage = "/images/drinks-dessert.webp";

export const foodCategories = [
  { title: "Small plates & starters", tag: "A FIRST TASTE", image: tandoorImage, alt: "A charred tandoor sharing plate", description: "A little brightness and crunch to open the evening." },
  { title: "Grills & tandoor", tag: "FROM THE FIRE", image: tandoorImage, alt: "Indian tandoor specialities with fresh herbs", description: "Smoky, charred and made for the middle of the table." },
  { title: "Slow-cooked curries", tag: "LOW & SLOW", image: vegetarianImage, alt: "A slow-cooked Indian curry with herbs", description: "Comforting sauces, layered spice and patient cooking." },
  { title: "Biryani & rice", tag: "FRAGRANT & WARM", image: biryaniImage, alt: "Saffron basmati biryani in a copper handi", description: "Basmati, fragrance and the pleasure of a shared bowl." },
  { title: "Vegetarian favourites", tag: "GARDEN TO TABLE", image: vegetarianImage, alt: "A vegetarian Indian feast with curry and roti", description: "A generous celebration of vegetables, lentils and spice." },
  { title: "Drinks & something sweet", tag: "RAISE A GLASS", image: drinksImage, alt: "Indian-inspired drinks and a saffron dessert", description: "A refreshing pour or a little sweetness to close." },
];
