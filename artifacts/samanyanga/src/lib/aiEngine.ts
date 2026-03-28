const API_BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

const LOCAL_TIPS: [string, string][] = [
  ["maize", "Maize grows best in well-drained soil (pH 5.8–7.0). Plant after first rains, 25–30cm spacing. Apply compound D at planting, AN top-dressing at 6 weeks."],
  ["tomato", "Tomatoes need 6–8 hours of sunlight. Water consistently and stake tall varieties. Watch for early blight in wet conditions."],
  ["fertilizer", "Use Compound D at planting and ammonium nitrate (AN) top-dressing 4–6 weeks later. Soil test to fine-tune rates."],
  ["drought", "Plant SC403 or DK8031 for drought tolerance. Mulching and conservation tillage retain soil moisture."],
  ["livestock", "Cattle need 30–50L of water daily. Vaccinate against foot-and-mouth annually. Dip regularly for tick control."],
  ["pest", "Scout fields early, use biopesticides where possible, and rotate crops seasonally."],
  ["soil", "Test your soil every 3 years. AGRITEX officers assist with soil testing across Zimbabwe provinces."],
  ["harvest", "Harvest maize when husks are dry and brown, moisture below 13% for safe storage."],
  ["math", "Break maths into steps: identify what you know, what you need, then apply the formula. Show all working."],
  ["exam", "Past papers are the best prep — they reveal patterns. Practise timed and review every mistake."],
  ["zimsec", "Use the official ZIMSEC syllabus. Past papers from the last 5 years are essential revision tools."],
];

async function callHybrid(message: string, section: string): Promise<string> {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE}/api/ai/hybrid`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ message, section }),
    });
    if (!res.ok) throw new Error("Network error");
    const data = await res.json();
    return data.reply || offlineFallback(message, section);
  } catch {
    return offlineFallback(message, section);
  }
}

function offlineFallback(message: string, section: string): string {
  const lower = message.toLowerCase();
  for (const [key, tip] of LOCAL_TIPS) {
    if (lower.includes(key)) return tip;
  }
  const defaults: Record<string, string> = {
    farmer: "I can help with crops, soil, pests, livestock, and market prices in Zimbabwe. What would you like to know?",
    buyer: "I can help you find produce, understand pricing, and contact sellers. What are you looking for?",
    seller: "I can help you list produce, set prices, and reach buyers. What do you need?",
    student: "Ask me about any subject — maths, science, English, history, or ZIMSEC exam prep.",
    intern: "I can help with your agricultural attachment application and farm placement. What do you need?",
    admin: "I can help manage adverts, consultations, payments, and intern attachments.",
    consultation: "I can help you book or prepare for an agricultural consultation.",
    "public-ads": "I can help you submit an advert request or track your advert status.",
  };
  return defaults[section] || "I'm your Samanyanga Companion assistant. Ask me anything about farming, studying, or the platform.";
}

export async function hybridAI(message: string, section = "general"): Promise<string> {
  return callHybrid(message, section);
}

export async function agriAIHybrid(message: string): Promise<string> {
  return callHybrid(message, "farmer");
}

export async function studentAIHybrid(message: string, context?: string): Promise<string> {
  return callHybrid(message, context || "student");
}
