import { Router, type IRouter } from "express";
import { randomUUID } from "crypto";

const router: IRouter = Router();

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  quantity: string;
  price: number;
  location: string;
  imageUrl?: string;
  sellerName: string;
  sellerPhone?: string;
  createdAt: Date;
}

interface ProductRequest {
  id: string;
  productId: string;
  buyerName: string;
  buyerPhone: string;
  message?: string;
  createdAt: Date;
}

const products: Product[] = [
  {
    id: "1",
    name: "Fresh Maize",
    description: "Freshly harvested open-pollinated maize, sun-dried. Available in 50kg bags.",
    category: "Vegetables",
    quantity: "500kg",
    price: 25,
    location: "Harare",
    imageUrl: "https://images.unsplash.com/photo-1604977042946-1eecc30f269e?w=400",
    sellerName: "Tariro Dube",
    sellerPhone: "263771234567",
    createdAt: new Date(),
  },
  {
    id: "2",
    name: "Hereford Cattle",
    description: "Grade A Hereford cattle, 18 months old, pasture-raised. Ideal for beef production.",
    category: "Livestock",
    quantity: "5 head",
    price: 850,
    location: "Bulawayo",
    imageUrl: "https://images.unsplash.com/photo-1546445317-29f4545e9d53?w=400",
    sellerName: "Munyaradzi Mhuri",
    sellerPhone: "263772345678",
    createdAt: new Date(),
  },
  {
    id: "3",
    name: "Organic Tomatoes",
    description: "Pesticide-free organic tomatoes, various sizes. Perfect for resale or food processing.",
    category: "Vegetables",
    quantity: "200kg",
    price: 12,
    location: "Mutare",
    imageUrl: "https://images.unsplash.com/photo-1518977822534-7049a61ee0c2?w=400",
    sellerName: "Chiedza Farm",
    sellerPhone: "263773456789",
    createdAt: new Date(),
  },
  {
    id: "4",
    name: "Mango (Tommy Atkins)",
    description: "Premium export-grade mangoes from Muzarabani. Sweet, firm, and pest-free.",
    category: "Fruits",
    quantity: "2 tonnes",
    price: 18,
    location: "Muzarabani",
    imageUrl: "https://images.unsplash.com/photo-1553279768-865429fa0078?w=400",
    sellerName: "Blessing Orchards",
    sellerPhone: "263774567890",
    createdAt: new Date(),
  },
];

const productRequests: ProductRequest[] = [];

router.get("/products", (req, res) => {
  const { category } = req.query;
  let result = products;
  if (category && category !== "All") {
    result = products.filter(p => p.category.toLowerCase() === String(category).toLowerCase());
  }
  res.json(result);
});

router.get("/products/:id", (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(product);
});

router.post("/products", (req, res) => {
  const { name, description, category, quantity, price, location, imageUrl, sellerName, sellerPhone } = req.body;
  if (!name || !description || !category || !quantity || price === undefined || !location || !sellerName) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  const product: Product = {
    id: randomUUID(),
    name,
    description,
    category,
    quantity,
    price: Number(price),
    location,
    imageUrl,
    sellerName,
    sellerPhone,
    createdAt: new Date(),
  };
  products.push(product);
  res.status(201).json(product);
});

router.post("/products/:id/request", (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found" });
  const { buyerName, buyerPhone, message } = req.body;
  if (!buyerName || !buyerPhone) {
    return res.status(400).json({ error: "buyerName and buyerPhone are required" });
  }
  const request: ProductRequest = {
    id: randomUUID(),
    productId: req.params.id,
    buyerName,
    buyerPhone,
    message,
    createdAt: new Date(),
  };
  productRequests.push(request);
  res.status(201).json(request);
});

export default router;
