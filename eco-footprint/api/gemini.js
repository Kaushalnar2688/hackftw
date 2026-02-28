export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY is missing in env variables" });
    }

    const body = req.body;

    // Prepare prompt for Gemini API
    const prompt = `
You are a home energy and carbon footprint expert. Analyze the following household data:

${JSON.stringify(body)}

Return a **single valid JSON object only** (no markdown, no explanations) following exactly this schema:

{
  "score": number,                       // overall efficiency score 0-100
  "grade": string,                        // e.g., "Excellent", "Good", "Fair", "Poor"
  "estimatedKgCO2PerYear": number,        // annual CO₂ in kg
  "summary": string,                       // short overall summary
  "breakdown": [                           // per area scores
    { "area": string, "score": number, "note": string }
  ],
  "tips": [                                // actionable improvement suggestions
    { "title": string, "description": string, "priority": string, "estimatedSaving": string }
  ]
}

- Only return JSON, nothing else.
- Fill all fields; if no data, use null or empty string/array.
- Ensure numbers are numbers, strings are strings.
- Make tips practical and realistic.
Do not include any conversational text or markdown blocks.
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );

    // Handle errors from Gemini API
    if (!response.ok) {
      const text = await response.text(); // get raw text to debug
      console.error("Gemini API error:", text);
      return res.status(500).json({ error: "Gemini API returned an error", details: text });
    }

    // Parse Gemini JSON
    const data = await response.json();

    // Extract raw text from response (depends on Gemini structure)
    let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      return res.status(500).json({ error: "Gemini API response missing expected text" });
    }

    // Robust JSON parsing
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(500).json({ error: "Gemini API returned invalid JSON" });
    }

    const result = JSON.parse(jsonMatch[0]);

    // Return final JSON to frontend
    res.status(200).json(result);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
}

