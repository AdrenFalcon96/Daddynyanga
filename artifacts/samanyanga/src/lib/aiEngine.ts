import { API_BASE } from "./queryClient";

const AGRI_RESPONSES: [string, string][] = [
  ["maize", "Maize grows best in well-drained soil (pH 5.8–7.0). Plant after first rains, spacing 25–30cm. Apply compound D at planting, then AN top-dressing at 6 weeks."],
  ["tomato", "Tomatoes need 6–8 hours of sunlight. Water consistently and stake tall varieties. Watch for early blight in wet conditions."],
  ["fertilizer", "For most Zimbabwe crops: compound D at planting, ammonium nitrate (AN) top-dressing 4–6 weeks later. Soil test to fine-tune rates."],
  ["drought", "Plant SC403 or DK8031 for drought-tolerant maize. Mulching and conservation tillage retain soil moisture significantly."],
  ["livestock", "Cattle need 30–50L of water daily. Vaccinate against foot-and-mouth annually. Dip regularly for tick control."],
  ["price", "Check ZFU (Zimbabwe Farmers Union) or GMB (Grain Marketing Board) for official crop prices."],
  ["pest", "Use integrated pest management — scout fields early, use biopesticides where possible, and rotate crops seasonally."],
  ["soil", "Test your soil every 3 years. AGRITEX extension officers assist with soil testing across Zimbabwe provinces."],
  ["irrigation", "Drip irrigation is most efficient for horticulture. Centre pivots suit large-scale grain crops on flat terrain."],
  ["harvest", "Harvest maize when husks are dry and brown, grain moisture below 13% for safe long-term storage."],
  ["sell", "Use the marketplace section to list your produce. Set a competitive price and add clear photos to attract buyers."],
  ["market", "Popular markets: Mbare Musika (Harare), Egodini (Bulawayo), Sakubva (Mutare). Check GMB for official prices."],
];

const STUDENT_RESPONSES: [string, string][] = [
  ["math", "Break maths problems into steps: identify what you know, what you need, then apply the correct formula. Always show all working."],
  ["algebra", "Isolate the variable: perform the same operation on both sides of the equation to maintain balance."],
  ["biology", "Use diagrams — they help greatly. Understand photosynthesis and respiration mechanistically, not just as memorised facts."],
  ["chemistry", "Understand why reactions happen (electron transfer, energy changes) rather than just memorising equations."],
  ["physics", "Draw a diagram first. Identify all forces or variables before attempting calculations."],
  ["history", "State your argument, give examples with dates and names, then explain significance. Evidence is everything."],
  ["english", "Structure essays: introduction (thesis), body (evidence + analysis), conclusion (reflect and restate)."],
  ["exam", "Past papers are the best preparation — they reveal patterns. Practise under timed conditions and review every mistake."],
  ["study", "Pomodoro technique: 25 minutes focused study, 5-minute break. After 4 cycles, take a longer 20-minute break."],
  ["zimsec", "Use the official syllabus as your guide. Past papers from the last 5 years are essential revision tools."],
  ["zimbabwe", "Zimbabwe gained independence 18 April 1980. Key eras: Great Zimbabwe (11th–15th c.), colonisation (1890), UDI (1965), liberation war (1970s)."],
];

// ── AI Response Cache ─────────────────────────────────────────────────────────
// Stores successful API answers in localStorage so they work offline later.

const AI_CACHE_KEY = "samanyanga-ai-cache";
const AI_CACHE_MAX = 60;

interface AiCacheEntry { reply: string; cachedAt: number; }

function getCacheStore(): Record<string, AiCacheEntry> {
  try { return JSON.parse(localStorage.getItem(AI_CACHE_KEY) || "{}"); }
  catch { return {}; }
}

function cacheKey(message: string, context?: string): string {
  return `${(context || "").slice(0, 20)}|${message.toLowerCase().trim().slice(0, 120)}`;
}

function readCache(key: string): string | null {
  const store = getCacheStore();
  return store[key]?.reply ?? null;
}

function writeCache(key: string, reply: string): void {
  try {
    const store = getCacheStore();
    store[key] = { reply, cachedAt: Date.now() };
    // Evict oldest entries if over limit
    const entries = Object.entries(store).sort((a, b) => a[1].cachedAt - b[1].cachedAt);
    const trimmed = Object.fromEntries(entries.slice(-AI_CACHE_MAX));
    localStorage.setItem(AI_CACHE_KEY, JSON.stringify(trimmed));
  } catch { /* storage full — skip */ }
}

// ── AI Functions ──────────────────────────────────────────────────────────────

export async function hybridAI(message: string, section = "general"): Promise<string> {
  const lower = message.toLowerCase();
  for (const [key, response] of AGRI_RESPONSES) {
    if (lower.includes(key)) return response;
  }
  for (const [key, response] of STUDENT_RESPONSES) {
    if (lower.includes(key)) return response;
  }

  const ck = cacheKey(message, section);
  try {
    const res = await fetch(`${API_BASE}/api/ai/hybrid`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, section }),
    });
    if (res.ok) {
      const data = await res.json();
      const reply = data.reply || "I can help with agricultural and educational questions.";
      writeCache(ck, reply);
      return reply;
    }
  } catch { /* offline — fall through */ }

  const cached = readCache(ck);
  if (cached) return `(Offline — saved answer) ${cached}`;
  return "I can help with farming, buying, selling, and studying in Zimbabwe. What would you like to know?";
}

export async function agriAIHybrid(message: string): Promise<string> {
  const lower = message.toLowerCase();
  for (const [key, response] of AGRI_RESPONSES) {
    if (lower.includes(key)) return response;
  }

  const ck = cacheKey(message, "agri");
  try {
    const res = await fetch(`${API_BASE}/api/ai/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    if (res.ok) {
      const data = await res.json();
      const reply = data.reply || "I can help with agricultural questions about crops, soil, pests, livestock, and Zimbabwe markets.";
      writeCache(ck, reply);
      return reply;
    }
  } catch { /* offline — fall through */ }

  const cached = readCache(ck);
  if (cached) return `(Offline — saved answer) ${cached}`;
  return "I can help with agricultural questions about crops, soil management, pest control, livestock, and market prices in Zimbabwe. What would you like to know?";
}

export async function studentAIHybrid(message: string, context?: string): Promise<string> {
  const lower = message.toLowerCase();
  for (const [key, response] of STUDENT_RESPONSES) {
    if (lower.includes(key)) {
      return context ? `[${context}] ${response}` : response;
    }
  }

  const ck = cacheKey(message, context);
  try {
    const res = await fetch(`${API_BASE}/api/ai/student`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, context }),
    });
    if (res.ok) {
      const data = await res.json();
      const reply = data.reply || "I'm here to help with your studies.";
      writeCache(ck, reply);
      return reply;
    }
  } catch { /* offline — fall through */ }

  const cached = readCache(ck);
  if (cached) return `(Offline — saved answer) ${cached}`;
  return `I'm here to help with your ${context || "studies"}. Ask me about any subject — mathematics, science, English, history, or exam preparation strategies.`;
}
