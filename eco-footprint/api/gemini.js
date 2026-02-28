export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY is missing in env variables" });
    }

    const body = req.body;

    const prompt = `
You are a home energy and carbon footprint expert. Analyze the following household data (all inputs are qualitative descriptors):

${JSON.stringify(body, null, 2)}

Guidelines for interpreting qualitative values:
- Electricity bill: "very-low" = ~$40/mo, "low" = ~$75/mo, "moderate" = ~$150/mo, "high" = ~$250/mo
- Household size: "1" = 1 person, "2" = 2 people, "3-4" = 3-4 people, "5+" = 5+ people
- Home size: "small" = ~600 sqft, "medium" = ~1400 sqft, "large" = ~2500 sqft
- Thermostat: "cool" = 17°C, "comfortable" = 20°C, "warm" = 22°C, "hot" = 25°C
- Shower: "short" = 4 min, "medium" = 7 min, "long" = 15 min, "very-long" = 25 min
- Baths/week: "never" = 0, "rarely" = 1, "weekly" = 2, "multiple" = 4
- Diet impact: vegan < vegetarian < flexitarian < meat-daily
- Transport: walk-cycle and public-transit are low carbon, ev is moderate, car is high

Return a **single valid JSON object only** (no markdown, no explanations) following exactly this schema:
{
  "score": number,
  "grade": string,
  "estimatedKgCO2PerYear": number,
  "summary": string,
  "breakdown": [
    { "area": string, "score": number, "note": string }
  ],
  "tips": [
    { "title": string, "description": string, "priority": string, "estimatedSaving": string }
  ]
}

Rules:
- score: 0–100 where 100 is best (lowest carbon footprint)
- grade: one of "Excellent", "Good", "Fair", "Needs Improvement", "Poor"
- estimatedKgCO2PerYear: realistic annual CO₂ estimate in kg (typical UK/US household is 5000–15000 kg)
- breakdown: 4–5 areas (e.g. "Electricity", "Heating", "Water", "Lifestyle", "Transport")
- tips: 4–6 practical tips, each with priority "high", "medium", or "low"
- estimatedSaving: e.g. "Save ~400 kg CO₂/year" or "Save ~$120/year"
- Only return JSON, nothing else.
`;

    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 1200,
          }
        }),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      console.error("Gemini API error:", text);
      return res.status(500).json({ error: "Gemini API returned an error", details: text });
    }

    const data = await response.json();
    let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      return res.status(500).json({ error: "Gemini API response missing expected text" });
    }

    // Strip markdown code blocks if present
    rawText = rawText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(500).json({ error: "Gemini API returned invalid JSON", raw: rawText });
    }

    const result = JSON.parse(jsonMatch[0]);
    res.status(200).json(result);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
}

