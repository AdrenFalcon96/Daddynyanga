import { Router, type IRouter } from "express";
import { randomUUID } from "crypto";

const router: IRouter = Router();

interface Ad {
  id: string;
  title: string;
  description: string;
  type: "image" | "video";
  url: string;
  imageUrl?: string;
  videoUrl?: string;
  whatsapp?: string;
  facebook?: string;
  instagram?: string;
  twitter?: string;
  createdAt: Date;
}

interface AdvertRequest {
  id: string;
  name: string;
  email: string;
  phone?: string;
  description: string;
  createdAt: Date;
}

const ads: Ad[] = [
  {
    id: "1",
    title: "Fresh Tomatoes from Masvingo Farm",
    description: "Premium quality tomatoes available in bulk. 50kg bags at competitive prices. Direct from farm to your table.",
    type: "image",
    url: "https://images.unsplash.com/photo-1518977822534-7049a61ee0c2?w=600",
    imageUrl: "https://images.unsplash.com/photo-1518977822534-7049a61ee0c2?w=600",
    whatsapp: "263771234567",
    facebook: "https://facebook.com",
    createdAt: new Date(),
  },
  {
    id: "2",
    title: "Mutare Dairy — Fresh Milk Daily",
    description: "Pure, pasteurised milk delivered daily to Harare. Bulk orders welcome. Quality guaranteed.",
    type: "image",
    url: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600",
    imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600",
    whatsapp: "263772345678",
    createdAt: new Date(),
  },
];

const advertRequests: AdvertRequest[] = [];

router.get("/ads", (_req, res) => {
  res.json(ads);
});

router.get("/ads/:id", (req, res) => {
  const ad = ads.find(a => a.id === req.params.id);
  if (!ad) return res.status(404).json({ error: "Ad not found" });
  res.json(ad);
});

router.post("/advert-requests", (req, res) => {
  const { name, email, phone, description } = req.body;
  if (!name || !email || !description) {
    return res.status(400).json({ error: "name, email, and description are required" });
  }
  const request: AdvertRequest = {
    id: randomUUID(),
    name,
    email,
    phone,
    description,
    createdAt: new Date(),
  };
  advertRequests.push(request);
  res.status(201).json(request);
});

export default router;
