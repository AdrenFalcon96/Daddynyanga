import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // placeholder, will set in .env
});

const AGRI_TIPS: Record<string, string> = {
  maize: "Maize grows best in well-drained soil with pH 5.8–7.0...",
  tomato: "Tomatoes need 6–8 hours of sunlight...",
  fertilizer: "Use Compound D at planting and AN top-dressing...",
};

export async function universalAI(
  message: string,
  section: string = "general"
): Promise<string> {
  const lower = message.toLowerCase();

  // 1. Fast local tips
  for (const [key, tip] of Object.entries(AGRI_TIPS)) {
    if (lower.includes(key)) return tip;
  }

  // 2. Section-specific prompt
  let systemPrompt = "";
  if (section === "student") {
    systemPrompt =
      "You are a study assistant. Give clear explanations, examples, and step-by-step academic help.";
  } else if (section === "admin") {
    systemPrompt =
      "You are a business assistant. Help with revenue, management, analytics, and decision-making.";
  } else if (section === "marketplace") {
    systemPrompt =
      "You are a marketplace assistant. Help users buy, sell, price products, and understand listings.";
  } else if (section === "farmer") {
    systemPrompt =
      "You are an agricultural expert in Zimbabwe. Give practical farming advice.";
  } else {
    systemPrompt =
      "You are an assistant inside Samanyanga Companion. Give practical, step-by-step help.";
  }

  // 3. Call OpenAI for smart answers
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ]
    });

    return response.choices[0].message.content || "No response";
  } catch (error) {
    return "I'm currently offline. Please try again later.";
  }
}