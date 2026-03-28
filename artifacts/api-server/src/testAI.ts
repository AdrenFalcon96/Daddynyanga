import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // uses your secret
});

(async () => {
  try {
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an assistant inside Samanyanga Companion. Provide step-by-step answers." },
        { role: "user", content: "Give me tips for maize farming." }
      ],
    });
    console.log("AI response:", res.choices[0].message.content);
  } catch (err) {
    console.error("AI error:", err);
  }
})();
