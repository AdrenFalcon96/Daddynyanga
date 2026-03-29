import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import OpenAI from "openai";
import { verifyToken } from "../lib/jwt";

const router: IRouter = Router();

function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const payload = verifyToken(auth.slice(7));
    (req as any).user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const openrouter = process.env.OPENROUTER_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": "https://samanyanga.replit.app",
        "X-Title": "Samanyanga Companion",
      },
    })
  : null;

const SISIF_API_KEY = process.env.SISIF_AI_API_KEY || null;
const SISIF_BASE = "https://sisif.ai/api";

const LOCAL_TIPS: [string, string, string[]][] = [
  ["maize", "Maize grows best in well-drained soil (pH 5.8–7.0). Plant after first rains, spacing 25–30cm. Apply compound D at planting, then AN top-dressing at 6 weeks.", ["farmer", "general", "buyer", "seller"]],
  ["tomato", "Tomatoes need 6–8 hours of sunlight. Water consistently and stake tall varieties. Watch for early blight in wet conditions.", ["farmer", "general"]],
  ["fertilizer", "For most Zimbabwe crops: compound D at planting, ammonium nitrate (AN) top-dressing 4–6 weeks later. Soil test to fine-tune rates.", ["farmer", "general"]],
  ["drought", "Plant SC403 or DK8031 for drought-tolerant maize. Mulching and conservation tillage retain soil moisture significantly.", ["farmer", "general"]],
  ["livestock", "Cattle need 30–50L of water daily. Vaccinate against foot-and-mouth annually. Dip regularly for tick control.", ["farmer", "general", "buyer", "seller"]],
  ["price", "Check ZFU (Zimbabwe Farmers Union) or GMB (Grain Marketing Board) for official crop prices.", ["farmer", "buyer", "seller", "general"]],
  ["pest", "Use integrated pest management — scout fields early, use biopesticides where possible, and rotate crops seasonally.", ["farmer", "general"]],
  ["soil", "Test your soil every 3 years. AGRITEX extension officers assist with soil testing across Zimbabwe provinces.", ["farmer", "general"]],
  ["harvest", "Harvest maize when husks are dry and brown, grain moisture below 13% for safe long-term storage.", ["farmer", "general"]],
  ["math", "Break maths problems into steps: identify what you know, what you need, then apply the correct formula. Always show all working.", ["student"]],
  ["algebra", "Isolate the variable: perform the same operation on both sides of the equation to maintain balance.", ["student"]],
  ["biology", "Use diagrams — they help greatly. Understand photosynthesis and respiration mechanistically, not just as memorised facts.", ["student"]],
  ["chemistry", "Understand why reactions happen (electron transfer, energy changes) rather than just memorising equations.", ["student"]],
  ["physics", "Draw a diagram first. Identify all forces or variables before attempting calculations.", ["student"]],
  ["history", "State your argument, give examples with dates and names, then explain significance. Evidence is everything.", ["student"]],
  ["english", "Structure essays: introduction (thesis), body (evidence + analysis), conclusion (reflect and restate).", ["student"]],
  ["exam", "Past papers are the best preparation — they reveal patterns. Practise under timed conditions and review every mistake.", ["student"]],
  ["zimsec", "Use the official ZIMSEC syllabus as your guide. Past papers from the last 5 years are essential revision tools.", ["student"]],
  ["revenue", "Track all incoming payments: EcoCash (0783652488), advert fees, and consultation charges. Export reports monthly.", ["admin", "revenue"]],
  ["payment", "EcoCash payments go to 0783652488. Confirm payment before approving adverts or consultations.", ["admin", "revenue"]],
  ["advert", "Review advert requests in the Advert Requests tab. Approve, generate an image, then publish to make it live.", ["admin", "advert-requests"]],
  ["consultation", "Consultations can be online or on-farm. Confirm availability and payment before scheduling.", ["admin", "consultation", "consultations"]],
  ["intern", "Review intern attachment requests under Intern Requests. Contact the farm and student to confirm placement.", ["admin", "intern-requests", "intern"]],
  ["buy", "Browse products by category. Contact the seller directly via WhatsApp for bulk or delivery enquiries.", ["buyer", "general"]],
  ["sell", "List your produce with clear photos, accurate weight/quantity, and your contact number. Update status when sold.", ["seller", "farmer"]],
  ["ad", "Submit an advert request with your business name, description, and contact. Await admin approval and payment confirmation.", ["public-ads", "general"]],
];

const SECTION_PROMPTS: Record<string, string> = {
  farmer: "You are an agricultural expert inside Samanyanga Companion, a Zimbabwe farming marketplace. Give practical, step-by-step farming advice using local context: Zimbabwe crops, AGRITEX extension services, GMB prices, local weather patterns, and regional practices. Keep responses under 180 words.",
  buyer: "You are a marketplace assistant inside Samanyanga Companion. Help buyers find produce, understand pricing, negotiate with sellers, and arrange delivery in Zimbabwe. Be concise and practical. Keep responses under 150 words.",
  seller: "You are a marketplace assistant inside Samanyanga Companion. Help sellers list produce effectively, price competitively, reach buyers, and manage their listings in Zimbabwe. Keep responses under 150 words.",
  student: "You are a study assistant inside Samanyanga Companion. Help Zimbabwe students (Grade 7, O Level, A Level) with ZIMSEC curriculum subjects. Give clear, step-by-step academic explanations with examples. Keep responses under 200 words.",
  intern: "You are an agricultural intern assistant inside Samanyanga Companion. Help agri-intern students understand attachment procedures, farm placements, reports, and career pathways in Zimbabwe agriculture. Keep responses under 150 words.",
  admin: "You are an admin assistant inside Samanyanga Companion. Give actionable guidance on managing advert requests, product listings, consultations, intern attachments, and revenue tracking. Be concise and practical. Keep responses under 180 words.",
  "advert-requests": "You are an admin assistant for advert request management inside Samanyanga Companion. Guide the admin on reviewing, approving, rejecting ad requests, generating images, and publishing adverts. Keep responses under 180 words.",
  "product-requests": "You are an admin assistant for product request management inside Samanyanga Companion. Guide the admin on reviewing buyer enquiries and managing product purchase requests. Keep responses under 150 words.",
  "intern-requests": "You are an admin assistant for intern attachment requests inside Samanyanga Companion. Guide the admin on reviewing student applications and confirming farm placements. Keep responses under 150 words.",
  revenue: "You are a revenue assistant inside Samanyanga Companion Admin. Help the admin track payments, EcoCash collections (0783652488), advert fees, and consultation revenue. Keep responses under 150 words.",
  consultations: "You are a consultation assistant inside Samanyanga Companion Admin. Help manage farmer, student, buyer, seller, and agronomic consultation requests, scheduling, and follow-ups. Keep responses under 150 words.",
  consultation: "You are an agricultural consultant assistant inside Samanyanga Companion. Help users book, prepare for, and get value from farm or agronomic consultations in Zimbabwe. Keep responses under 150 words.",
  "public-ads": "You are an advertising assistant inside Samanyanga Companion. Help users understand how to submit advert requests, what to include, pricing, and how their ad will be published. Keep responses under 150 words.",
  "image-adverts": "You are an admin assistant for image advert management inside Samanyanga Companion. Help the admin review, approve, generate AI images for, and publish image advert requests. Keep responses under 150 words.",
  "video-adverts": "You are an admin assistant for video advert management inside Samanyanga Companion. Help the admin review, approve, generate AI videos for, and publish video advert requests. Keep responses under 150 words.",
  "media-hub": "You are a media distribution assistant inside Samanyanga Companion Admin. Help the admin upload, edit, publish, and distribute media adverts across social platforms. Keep responses under 150 words.",
  "study-materials": "You are an educational content assistant inside Samanyanga Companion Admin. Help the admin upload, organise, and manage study materials for Zimbabwe students (Grade 7, O Level, A Level) across all ZIMSEC subjects. Keep responses under 150 words.",
  subjects: "You are a curriculum assistant inside Samanyanga Companion Admin. Help the admin manage subjects by grade level — adding, editing, categorising, and organising ZIMSEC curriculum subjects. Keep responses under 150 words.",
  security: "You are a security assistant inside Samanyanga Companion Admin. Help with account management, credential security, user roles, JWT tokens, and platform access controls. Keep responses under 150 words.",
  general: "You are an assistant inside Samanyanga Companion, a Zimbabwe agricultural marketplace and learning platform. Give helpful, practical, step-by-step answers using local Zimbabwean context. Keep responses under 180 words.",
};

const SECTION_FALLBACKS: Record<string, string> = {
  farmer: "I can help with crop management, soil health, pest control, livestock, irrigation, and market prices in Zimbabwe. What would you like to know?",
  buyer: "I can help you find produce, understand pricing, contact sellers, and arrange bulk purchases. What are you looking for?",
  seller: "I can help you list your produce, set competitive prices, and reach buyers across Zimbabwe. What do you need help with?",
  student: "I'm here to help with your studies — mathematics, science, English, history, or ZIMSEC exam preparation. What subject can I help with?",
  intern: "I can help with your agricultural attachment application, farm placement procedures, and agri-career advice. What do you need?",
  admin: "I can help you manage advert requests, consultations, payments, intern attachments, and platform operations. What would you like to do?",
  revenue: "I can help you track payments, EcoCash collections, and revenue reports. What would you like to review?",
  consultation: "I can help you book or prepare for an agricultural consultation. What topic or challenge do you want to discuss?",
  "public-ads": "I can help you submit an advert request, understand what to include, or track your advert status. What do you need?",
  "media-hub": "I can help you upload, edit, publish, and share media adverts across WhatsApp, Facebook, Instagram, and Twitter. What would you like to do?",
  subjects: "I can help you add, edit, categorise, and manage subjects for each grade level. What subject changes do you need?",
  general: "I'm your Samanyanga Companion assistant. Ask me about farming, buying, selling, studying, or anything on the platform.",
};

async function openaiChat(systemPrompt: string, userMessage: string): Promise<string | null> {
  if (!openai) return null;
  try {
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userMessage }],
      max_tokens: 300,
    });
    return res.choices[0]?.message?.content || null;
  } catch (err: any) {
    console.warn("[OpenAI] chat failed:", err?.message || err);
    return null;
  }
}

async function openrouterChat(systemPrompt: string, userMessage: string): Promise<string | null> {
  if (!openrouter) return null;
  try {
    const res = await openrouter.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userMessage }],
      max_tokens: 300,
    });
    return res.choices[0]?.message?.content || null;
  } catch (err: any) {
    console.warn("[OpenRouter] chat failed:", err?.message || err);
    return null;
  }
}

async function sisifGenerateVideo(prompt: string): Promise<{ videoUrl: string | null; jobId?: string; source: string; error?: string }> {
  if (!SISIF_API_KEY) return { videoUrl: null, source: "placeholder", error: "SISIF_AI_API_KEY not configured" };
  try {
    const submitRes = await fetch(`${SISIF_BASE}/videos/generate/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${SISIF_API_KEY}` },
      body: JSON.stringify({ prompt, duration: 8, resolution: "540x960" }),
    });
    if (!submitRes.ok) {
      const errText = await submitRes.text().catch(() => String(submitRes.status));
      return { videoUrl: null, source: "placeholder", error: `Submit error ${submitRes.status}: ${errText}` };
    }
    const job: any = await submitRes.json();
    const jobId: string = job?.id;
    if (!jobId) return { videoUrl: null, source: "placeholder", error: "No job ID returned" };
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 6000));
      try {
        const statusRes = await fetch(`${SISIF_BASE}/videos/${jobId}/status/`, { headers: { Authorization: `Bearer ${SISIF_API_KEY}` } });
        if (!statusRes.ok) continue;
        const status: any = await statusRes.json();
        if (status?.status === "ready" && status?.video_url) return { videoUrl: status.video_url, jobId, source: "sisif" };
        if (status?.status === "failed") return { videoUrl: null, jobId, source: "placeholder", error: "SISIF job failed" };
      } catch { /* keep polling */ }
    }
    return { videoUrl: null, jobId, source: "placeholder", error: "Timed out waiting for video" };
  } catch (err: any) {
    return { videoUrl: null, source: "placeholder", error: err?.message || "Network error" };
  }
}

router.get("/ai/status", (_req, res) => {
  res.json({ openai: !!openai, openrouter: !!openrouter, sisif: !!SISIF_API_KEY });
});

// Hybrid: OpenRouter → OpenAI → local keyword → fallback
router.post("/ai/hybrid", async (req, res) => {
  const { message, section = "general" } = req.body;
  if (!message) { res.status(400).json({ error: "message required" }); return; }

  const lower = String(message).toLowerCase();
  const systemPrompt = SECTION_PROMPTS[section] || SECTION_PROMPTS.general;

  for (const [key, tip, sections] of LOCAL_TIPS) {
    if (lower.includes(key) && (sections.includes(section) || sections.includes("general"))) {
      const aiReply = (await openrouterChat(systemPrompt, message)) || (await openaiChat(systemPrompt, message));
      const src = aiReply ? (openrouter ? "openrouter" : "openai") : "local";
      res.json({ reply: aiReply || tip, source: src }); return;
    }
  }

  const aiReply = (await openrouterChat(systemPrompt, message)) || (await openaiChat(systemPrompt, message));
  const fallback = SECTION_FALLBACKS[section] || SECTION_FALLBACKS.general;
  const src = aiReply ? (openrouter ? "openrouter" : "openai") : "local";
  res.json({ reply: aiReply || fallback, source: src });
});

router.post("/ai/chat", async (req, res) => {
  const { message } = req.body;
  if (!message) { res.status(400).json({ error: "message required" }); return; }
  const systemPrompt = SECTION_PROMPTS.farmer;
  const aiReply = (await openrouterChat(systemPrompt, message)) || (await openaiChat(systemPrompt, message));
  res.json({ reply: aiReply || SECTION_FALLBACKS.farmer, source: aiReply ? (openrouter ? "openrouter" : "openai") : "local" });
});

router.post("/ai/student", async (req, res) => {
  const { message, context } = req.body;
  if (!message) { res.status(400).json({ error: "message required" }); return; }
  const lower = String(message).toLowerCase();
  const systemPrompt = SECTION_PROMPTS.student;
  for (const [key, tip, sections] of LOCAL_TIPS) {
    if (lower.includes(key) && sections.includes("student")) {
      const aiReply = (await openrouterChat(systemPrompt, message)) || (await openaiChat(systemPrompt, message));
      res.json({ reply: aiReply || (context ? `[${context}] ${tip}` : tip), source: aiReply ? (openrouter ? "openrouter" : "openai") : "local" }); return;
    }
  }
  const aiReply = (await openrouterChat(systemPrompt, message)) || (await openaiChat(systemPrompt, message));
  res.json({
    reply: aiReply || `I'm here to help with your ${context || "studies"}. Ask me about any subject — mathematics, science, English, history, or exam preparation.`,
    source: aiReply ? (openrouter ? "openrouter" : "openai") : "local",
  });
});

router.post("/ai/admin", requireAuth, async (req, res) => {
  const { message, section } = req.body;
  if (!message) { res.status(400).json({ error: "message required" }); return; }
  const sectionKey = section || "admin";
  const systemPrompt = SECTION_PROMPTS[sectionKey] || SECTION_PROMPTS.admin;
  const aiReply = (await openrouterChat(systemPrompt, message)) || (await openaiChat(systemPrompt, message));
  const src = aiReply ? (openrouter ? "openrouter" : "openai") : "local";
  res.json({
    reply: aiReply || `I can help you manage ${sectionKey}. Ask about approvals, payments, consultations, or any platform feature.`,
    source: src,
  });
});

// Generate image (requires auth to prevent abuse)
router.post("/ai/generate-image", requireAuth, async (req, res) => {
  const { prompt, requestId } = req.body;
  if (!prompt) { res.status(400).json({ error: "prompt required" }); return; }

  let imageUrl = `https://picsum.photos/seed/${Date.now()}/800/600`;
  let source = "placeholder";

  if (openai) {
    try {
      const imgRes = await openai.images.generate({
        model: "dall-e-3",
        prompt: `Professional agricultural advertisement for Zimbabwe: ${prompt}. High quality, vibrant colors, clear text space.`,
        n: 1,
        size: "1024x1024",
        quality: "standard",
      });
      if (imgRes.data?.[0]?.url) { imageUrl = imgRes.data[0].url; source = "openai-dalle3"; }
    } catch (err: any) {
      console.warn("[DALL-E 3] failed:", err?.message);
      if (openrouter) {
        try {
          // Use OpenRouter to generate a detailed image prompt, then use placeholder
          const promptRes = await openrouterChat(
            "You are an expert at writing DALL-E prompts for agricultural advertisements. Write a detailed, vivid image generation prompt.",
            `Create an image prompt for: ${prompt}`
          );
          if (promptRes) {
            imageUrl = `https://picsum.photos/seed/${encodeURIComponent(promptRes.slice(0, 50))}/800/600`;
            source = "openrouter-enhanced-placeholder";
          }
        } catch { /* ignore */ }
      }
    }
  }

  res.json({ imageUrl, source, requestId });
});

router.post("/ai/generate-video", requireAuth, async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) { res.status(400).json({ error: "prompt required" }); return; }
  const result = await sisifGenerateVideo(prompt);
  if (result.videoUrl) { res.json({ videoUrl: result.videoUrl, source: result.source }); return; }
  res.json({
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    source: "placeholder",
    warning: result.error || "Video generation unavailable; using placeholder",
  });
});

export default router;
