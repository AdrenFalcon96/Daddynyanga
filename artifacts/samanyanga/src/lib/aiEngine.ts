const AGRI_TIPS: Record<string, string> = {
  maize: "Maize grows best in well-drained soil with pH 5.8–7.0. Plant after first rains, about 3–4 seeds per hole, 25–30cm apart.",
  tomato: "Tomatoes need 6–8 hours of sunlight. Water consistently and stake tall varieties. Watch for blight in wet weather.",
  fertilizer: "Use compound D at planting and AN top-dressing 4–6 weeks later for most crops in Zimbabwe.",
  drought: "Consider drought-tolerant varieties like SC403 or DK8031 for maize. Mulching helps retain soil moisture.",
  livestock: "Cattle need 30–50L of water daily. Vaccinate against foot-and-mouth disease annually.",
  price: "Current crop prices vary by season. Check ZFU or GMB for official maize prices.",
  pest: "Use integrated pest management — scout fields early, use biopesticides where possible, rotate crops.",
  soil: "Test your soil before planting. AGRITEX extension officers can assist with soil testing.",
};

export async function agriAIHybrid(message: string): Promise<string> {
  const lower = message.toLowerCase();
  for (const [key, tip] of Object.entries(AGRI_TIPS)) {
    if (lower.includes(key)) return tip;
  }
  try {
    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.reply || "I can help with agricultural questions. Try asking about crops, soil, pests, or livestock.";
    }
  } catch {}
  return "I can help with agricultural questions about crops, soil management, pest control, and livestock. What would you like to know?";
}

export async function studentAIHybrid(message: string, context?: string): Promise<string> {
  try {
    const res = await fetch("/api/ai/student", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, context }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.reply || generateLocalStudentReply(message);
    }
  } catch {}
  return generateLocalStudentReply(message);
}

function generateLocalStudentReply(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("math") || lower.includes("algebra") || lower.includes("equation"))
    return "For mathematics, break problems into steps. Identify what you know, what you need to find, and which formula applies.";
  if (lower.includes("science") || lower.includes("biology") || lower.includes("chemistry"))
    return "Science is about observation and reasoning. Try to understand concepts rather than memorise — draw diagrams to help.";
  if (lower.includes("english") || lower.includes("essay") || lower.includes("write"))
    return "Good writing has a clear introduction, body, and conclusion. Use specific examples to support your points.";
  if (lower.includes("history") || lower.includes("zimbabwe"))
    return "Zimbabwe's history includes the Great Zimbabwe civilisation, colonisation, the liberation war, and independence in 1980. Context matters for historical events.";
  if (lower.includes("exam") || lower.includes("study") || lower.includes("revision"))
    return "Effective studying: use past papers, create summaries, teach concepts to someone else, and take short breaks (Pomodoro technique).";
  return "I'm here to help with your studies. Ask me about any subject — maths, science, English, history, or exam preparation.";
}
