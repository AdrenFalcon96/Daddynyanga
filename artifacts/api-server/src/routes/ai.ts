import { Router, type IRouter } from "express";

const router: IRouter = Router();

const AGRI_TIPS: Record<string, string> = {
  maize: "Maize grows best in well-drained soil with pH 5.8–7.0. Plant after first rains, spacing 25–30cm. Use compound D fertilizer at planting.",
  tomato: "Tomatoes need 6–8 hours of sunlight. Water consistently and stake tall varieties. Watch for early blight in wet conditions.",
  fertilizer: "Use compound D at planting and ammonium nitrate (AN) top-dressing 4–6 weeks later for most Zimbabwe crops.",
  drought: "Consider drought-tolerant varieties like SC403 for maize. Mulching and conservation tillage help retain soil moisture.",
  livestock: "Cattle need 30–50L of water daily. Vaccinate against foot-and-mouth annually. Dip regularly for tick control.",
  price: "Check ZFU (Zimbabwe Farmers Union) or GMB (Grain Marketing Board) for official crop prices.",
  pest: "Use integrated pest management — scout fields early, use biopesticides where possible, and rotate crops seasonally.",
  soil: "Test your soil every 3 years. AGRITEX extension officers assist with soil testing across Zimbabwe provinces.",
  irrigation: "Drip irrigation is most efficient for horticulture. Centre pivots suit large-scale grain crops.",
  harvest: "Harvest maize when husks are dry and brown, with grain moisture below 13% for safe storage.",
};

router.post("/ai/chat", (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "message required" });
  const lower = String(message).toLowerCase();
  for (const [key, tip] of Object.entries(AGRI_TIPS)) {
    if (lower.includes(key)) return res.json({ reply: tip });
  }
  res.json({ reply: "I can help with agricultural questions about crops, soil management, pest control, livestock, and market prices in Zimbabwe. What would you like to know?" });
});

router.post("/ai/student", (req, res) => {
  const { message, context } = req.body;
  if (!message) return res.status(400).json({ error: "message required" });
  const lower = String(message).toLowerCase();
  const replies: [string, string][] = [
    ["math", "For maths, break problems into steps: identify what you know, what you need, then apply the correct formula or theorem."],
    ["algebra", "In algebra, isolate the variable: perform the same operation on both sides of the equation to maintain balance."],
    ["biology", "Biology is about living organisms. Try to understand processes (like respiration or photosynthesis) mechanistically — diagrams help greatly."],
    ["chemistry", "In chemistry, understand why reactions happen (electron transfer, energy changes) rather than just memorising equations."],
    ["physics", "Physics links mathematics to the real world. Draw diagrams and identify forces or variables before attempting calculations."],
    ["history", "Good history answers use evidence: state your argument, provide examples with dates and names, then explain significance."],
    ["english", "Structure essays clearly: introduction (state your thesis), body (evidence and analysis), conclusion (restate and reflect)."],
    ["essay", "Plan before you write. A 5-minute outline saves 20 minutes of revision. Use linking words to connect ideas."],
    ["exam", "Use past papers — they reveal question patterns. Practise under timed conditions and review your mistakes."],
    ["study", "Pomodoro technique: 25 minutes focused study, 5-minute break. After 4 cycles, take a longer break."],
    ["zimbabwe", "Zimbabwe gained independence on 18 April 1980. Key historical periods include Great Zimbabwe (11th–15th c.), colonisation (1890), and the liberation war (1970s)."],
  ];
  for (const [key, reply] of replies) {
    if (lower.includes(key)) return res.json({ reply: `${context ? `[${context}] ` : ""}${reply}` });
  }
  res.json({ reply: `I'm here to help with your ${context || "studies"}. Ask me about any subject — mathematics, science, English, history, or exam preparation strategies.` });
});

export default router;
