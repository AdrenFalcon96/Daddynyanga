const API_BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

type KnowledgeEntry = { keywords: string[]; sections: string[]; answer: string };

const KNOWLEDGE: KnowledgeEntry[] = [
  { keywords: ["maize", "corn", "mealies"], sections: ["farmer", "buyer", "seller", "general"],
    answer: "Maize grows best in well-drained soil (pH 5.8–7.0). Plant after first rains, 25–30 cm spacing, 75 cm between rows. Apply Compound D (7:14:7) at planting and AN (ammonium nitrate) top-dressing at 6 weeks. Recommended varieties: SC403 (drought-tolerant), SC513, or DK8031. Expect 4–6 t/ha under good management." },
  { keywords: ["tomato", "tomatoes"], sections: ["farmer", "general"],
    answer: "Tomatoes need 6–8 hours of sunlight and consistent watering. Stake indeterminate varieties. Fertilise with NPK 6:14:12 at planting and calcium nitrate during fruiting. Watch for early blight after rains. Drip irrigation reduces leaf wetness and disease." },
  { keywords: ["fertiliser", "fertilizer", "compound d", "an ", "ammonium", "basal"], sections: ["farmer", "general"],
    answer: "Standard Zimbabwe program: Compound D (7:14:7) at 200 kg/ha as basal at planting, then AN (34.5% N) at 200 kg/ha as top-dressing 4–6 weeks after emergence. Always soil-test first — AGRITEX officers assist with testing." },
  { keywords: ["drought", "dry", "moisture", "irrigation", "water"], sections: ["farmer", "general"],
    answer: "For drought-prone areas plant SC403 or DK8031 maize. Use conservation tillage, mulching, and tied ridges to retain moisture. Supplemental irrigation from boreholes or dams can increase yield significantly in dry seasons." },
  { keywords: ["livestock", "cattle", "goats", "chickens", "poultry", "pig"], sections: ["farmer", "general", "buyer", "seller"],
    answer: "Cattle need 30–50 L of water daily. Vaccinate against FMD (foot-and-mouth) annually and against anthrax in high-risk areas. Dip or spray fortnightly for tick control. For poultry, Newcastle Disease vaccination at day-old and 21 days is critical in Zimbabwe." },
  { keywords: ["pest", "pests", "armyworm", "stalk borer", "aphid", "whitefly", "insect"], sections: ["farmer", "general"],
    answer: "Fall armyworm: scout weekly and apply Lambda-cyhalothrin or Emamectin benzoate early. Stalk borer: apply Carbofuran granules in the whorl stage. Use integrated pest management — rotate crops and use biopesticides where possible to reduce chemical resistance." },
  { keywords: ["soil", "ph", "soil test", "lime", "acidic"], sections: ["farmer", "general"],
    answer: "Test soil every 3 years. Most Zimbabwe soils are acidic (pH 4.5–6.0). Apply agricultural lime 6–8 weeks before planting at 1–2 t/ha to raise pH. AGRITEX officers can arrange soil testing across all provinces." },
  { keywords: ["harvest", "storage", "grain", "drying"], sections: ["farmer", "general"],
    answer: "Harvest maize when husks are dry and brown. Dry grain to below 13% moisture before storage to prevent aflatoxin. Use hermetic bags or metal silos for safe storage of up to 12 months." },
  { keywords: ["price", "prices", "market price", "gmb", "zfu", "selling price"], sections: ["farmer", "buyer", "seller", "general"],
    answer: "For official prices check the GMB (Grain Marketing Board) or ZFU (Zimbabwe Farmers Union) websites. Current market prices also appear on the Samanyanga marketplace — browse by category to see what sellers are listing." },
  { keywords: ["buy", "purchase", "find", "looking for", "want to buy"], sections: ["buyer", "general"],
    answer: "Browse products by category in the marketplace. Click on a listing to see the seller's contact details and arrange delivery or collection. Use the search to filter by crop type, location, or price range." },
  { keywords: ["sell", "list", "listing", "post", "advertise my"], sections: ["seller", "farmer", "general"],
    answer: "Go to 'My Listings' and click 'Add Listing'. Fill in the product name, category, quantity, price, and your contact details. Add a clear photo for more enquiries. Update the status to 'Sold' once sold to keep your listings accurate." },
  { keywords: ["advert", "ad", "advertisement", "advertise"], sections: ["public-ads", "general", "admin"],
    answer: "To submit an advert, click 'Request an Advert' on the ads page. Provide your business name, a description, contact details, and your preferred format (image or video). Pay the fee to 0783652488 (EcoCash) and await admin approval." },
  { keywords: ["ecocash", "payment", "pay", "fee", "cost", "charge"], sections: ["admin", "public-ads", "general"],
    answer: "All payments go to EcoCash number 0783652488. Confirm payment with a screenshot when submitting your request. Admin will verify before approving adverts or consultations." },
  { keywords: ["consultation", "consult", "expert", "agronomist", "extension"], sections: ["consultation", "farmer", "general"],
    answer: "Book a consultation through the Consultation page. Provide your topic (crop management, pest control, soil health, etc.) and preferred date. Online consultations are available by phone or WhatsApp; on-farm visits can be arranged." },
  { keywords: ["intern", "attachment", "placement", "attach", "agri intern"], sections: ["intern", "general"],
    answer: "Apply for an agricultural attachment by completing the form on the Agri Intern page. Provide your student details, institution, preferred attachment period, and area of interest. An admin will contact you to confirm a farm placement." },
  { keywords: ["math", "maths", "algebra", "equation", "calculate", "solve"], sections: ["student", "general"],
    answer: "Break every maths problem into steps: (1) identify what is given, (2) identify what you need to find, (3) choose the correct formula, (4) substitute values, (5) calculate, (6) check your answer. Always show all working in ZIMSEC exams." },
  { keywords: ["algebra"], sections: ["student"],
    answer: "In algebra, isolate the variable by performing the same operation on both sides. E.g.: 3x + 5 = 14 → subtract 5 → 3x = 9 → divide by 3 → x = 3. Always check by substituting back." },
  { keywords: ["biology", "photosynthesis", "respiration", "cell", "dna", "genetics"], sections: ["student", "general"],
    answer: "For biology: use labelled diagrams wherever possible. Understand processes mechanistically — e.g., photosynthesis: light + CO₂ + H₂O → glucose + O₂ (in chloroplasts). Respiration: glucose + O₂ → CO₂ + H₂O + ATP (energy). Link structure to function in all questions." },
  { keywords: ["chemistry", "reaction", "element", "compound", "acid", "base"], sections: ["student", "general"],
    answer: "For chemistry: balance equations by adjusting coefficients, never subscripts. Understand why reactions occur — acids donate H⁺, bases accept H⁺. Electrolysis: oxidation at anode, reduction at cathode (OIL RIG). Practice mole calculations step-by-step." },
  { keywords: ["physics", "force", "velocity", "acceleration", "energy", "wave", "electricity"], sections: ["student", "general"],
    answer: "For physics: always draw a diagram first. Identify all forces or variables before calculating. Key formulae: F=ma, v=u+at, E=mc², P=IV. Check units carefully — wrong units lose marks in ZIMSEC. Practise past papers for calculation questions." },
  { keywords: ["history", "essay", "argument", "explain", "source"], sections: ["student", "general"],
    answer: "For history essays: State your argument in the introduction, support with specific evidence (dates, names, events), then explain the significance. 'PEE' structure — Point, Evidence, Explain — works well. Use ZIMSEC past papers to see what examiners look for." },
  { keywords: ["english", "essay", "comprehension", "grammar", "write"], sections: ["student", "general"],
    answer: "For English essays: Introduction (hook + thesis), Body paragraphs (topic sentence + evidence + analysis), Conclusion (restate thesis + broader significance). For comprehension: read the question first, then locate the answer in the text. Avoid copying whole sentences — paraphrase." },
  { keywords: ["zimsec", "exam", "past paper", "o level", "a level", "grade 7"], sections: ["student", "general"],
    answer: "ZIMSEC past papers from the last 5 years are the best preparation — they reveal recurring question patterns. Practise under timed exam conditions and review every mistake carefully. Use the official ZIMSEC syllabus to ensure full coverage of each topic." },
  { keywords: ["revenue", "income", "earnings", "profit", "report"], sections: ["admin", "revenue"],
    answer: "Track all revenue streams: advert fees, consultation fees, and intern attachment fees. Export payment records monthly. All EcoCash payments come in to 0783652488 — confirm each payment with a timestamp before approving requests." },
];

function offlineFallback(message: string, section: string): string {
  const lower = message.toLowerCase();

  for (const entry of KNOWLEDGE) {
    const sectionMatch = entry.sections.includes(section) || entry.sections.includes("general");
    const keywordMatch = entry.keywords.some(kw => lower.includes(kw));
    if (sectionMatch && keywordMatch) return entry.answer;
  }

  const questionWords = ["how", "what", "when", "where", "why", "which", "can", "should", "is", "are", "do", "does"];
  const isQuestion = questionWords.some(w => lower.startsWith(w)) || lower.includes("?");

  const contextualDefaults: Record<string, string> = {
    farmer: isQuestion
      ? "Good question! For specific farming advice, I can help with crops, soil health, pest control, irrigation, fertilisers, and livestock in Zimbabwe. Try asking about a specific crop or challenge you're facing."
      : "I'm here to help with all your farming questions. Ask me about crops, soil, pests, livestock, market prices, or any other farming topic.",
    buyer: isQuestion
      ? "I can help you find what you're looking for on the marketplace. Try asking about a specific product, price range, or how to contact a seller."
      : "Browse the marketplace to find fresh produce, livestock, and farm inputs. Ask me anything about buying, pricing, or arranging delivery.",
    seller: isQuestion
      ? "I can help you sell more effectively. Ask about pricing your produce, writing good listings, reaching more buyers, or managing your sales."
      : "I can help you list your products, set competitive prices, and connect with buyers across Zimbabwe.",
    student: isQuestion
      ? "I'm your ZIMSEC study companion. Ask me about any subject — maths, science, English, history, geography — and I'll walk you through it step by step."
      : "Pick a subject and ask me a question or topic. I cover Grade 7, O Level, and A Level ZIMSEC curriculum for all subjects.",
    intern: isQuestion
      ? "I can help with your agricultural attachment — the application process, what to expect on placement, writing farm reports, or agri-career pathways in Zimbabwe."
      : "Ask me about attachment requirements, farm life, agri-career options, or how to get the most from your placement.",
    admin: isQuestion
      ? "I can guide you through platform management — approving adverts, handling consultations, managing users, tracking revenue, or resolving issues."
      : "I can assist with any admin task. Ask about advert approvals, payment verification, intern placements, or platform operations.",
    consultation: isQuestion
      ? "I can help you prepare for your agricultural consultation. What topic or farming challenge would you like to discuss?"
      : "Describe your farming challenge and I'll help you prepare the right questions for your consultation.",
    "public-ads": isQuestion
      ? "I can explain the advert submission process, what to include, the fees, and what happens after you submit."
      : "To place an advert: click 'Request an Advert', fill in your details, and pay via EcoCash 0783652488. Admin will review and publish within 24 hours.",
  };

  return contextualDefaults[section]
    || "I'm your Samanyanga Companion assistant. Ask me about farming, buying, selling, studying, or anything else on the platform and I'll do my best to help.";
}

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
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.reply || offlineFallback(message, section);
  } catch {
    return offlineFallback(message, section);
  }
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
