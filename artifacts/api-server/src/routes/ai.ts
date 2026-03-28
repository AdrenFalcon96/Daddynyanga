import { Router, type IRouter } from "express";

const router: IRouter = Router();

const OPENROUTER_URL = process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL;
const OPENROUTER_KEY = process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY;

const AGRI_TIPS: [string, string][] = [
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
];

const STUDENT_TIPS: [string, string][] = [
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

async function openrouterChat(systemPrompt: string, userMessage: string): Promise<string | null> {
  if (!OPENROUTER_URL || !OPENROUTER_KEY) return null;
  try {
    const res = await fetch(`${OPENROUTER_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENROUTER_KEY}`,
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.2-3b-instruct:free",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        max_tokens: 256,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json() as any;
    return data.choices?.[0]?.message?.content || null;
  } catch {
    return null;
  }
}

router.post("/ai/chat", async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "message required" });
  const lower = String(message).toLowerCase();
  for (const [key, tip] of AGRI_TIPS) {
    if (lower.includes(key)) return res.json({ reply: tip });
  }
  const aiReply = await openrouterChat(
    "You are an agricultural assistant inside Samanyanga Companion, a Zimbabwe farming marketplace app. Give concise, step-by-step answers using local context (Zimbabwe crops, AGRITEX, GMB prices, local farming practices). Keep responses under 150 words.",
    message
  );
  res.json({ reply: aiReply || "I can help with agricultural questions about crops, soil management, pest control, livestock, and market prices in Zimbabwe. What would you like to know?" });
});

router.post("/ai/student", async (req, res) => {
  const { message, context } = req.body;
  if (!message) return res.status(400).json({ error: "message required" });
  const lower = String(message).toLowerCase();
  for (const [key, tip] of STUDENT_TIPS) {
    if (lower.includes(key)) {
      return res.json({ reply: context ? `[${context}] ${tip}` : tip });
    }
  }
  const systemPrompt = `You are an assistant inside Samanyanga Companion. Give step-by-step answers using platform features and actionable guidance, tailored to the context of the current section. Current section: ${context || "Student Companion"}. Focus on ZIMSEC curriculum (Grade 7, O Level, A Level) for Zimbabwe students. Keep responses under 200 words.`;
  const aiReply = await openrouterChat(systemPrompt, message);
  res.json({ reply: aiReply || `I'm here to help with your ${context || "studies"}. Ask me about any subject — mathematics, science, English, history, or exam preparation.` });
});

router.post("/ai/admin", async (req, res) => {
  const { message, section } = req.body;
  if (!message) return res.status(400).json({ error: "message required" });
  const SECTION_CONTEXT: Record<string, string> = {
    "advert-requests": "advert and advertisement management — reviewing, approving, or rejecting business ad requests, and generating image or video content for adverts",
    "product-requests": "marketplace product request management — reviewing buyer inquiries, accepting or rejecting product purchase requests",
    "intern-requests": "intern attachment request management — reviewing student applications for agricultural attachments at farms",
    "revenue": "revenue management and financial tracking — payment records, EcoCash payments (account 0783652488), advert and consultation revenue",
    "consultations": "consultation request management — reviewing and responding to student, farmer, buyer, seller, intern, and paid agronomic consultations",
  };
  const sectionDesc = SECTION_CONTEXT[section] || "admin dashboard management";
  const systemPrompt = `You are an assistant inside Samanyanga Companion Admin Dashboard. Give step-by-step answers using platform features and actionable guidance, tailored to the context of the current section. Current section: ${sectionDesc}. Be concise and practical. Keep responses under 200 words.`;
  const aiReply = await openrouterChat(systemPrompt, message);
  res.json({ reply: aiReply || `I can help you manage ${section || "the admin dashboard"}. Ask about approvals, payments, consultations, or any platform feature.` });
});

export default router;
