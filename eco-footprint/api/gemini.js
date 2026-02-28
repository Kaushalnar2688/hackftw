import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST allowed' });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.4,
        responseMimeType: 'application/json'
      }
    });

    const prompt = `
You are a home energy expert.

Analyze this data:
${JSON.stringify(req.body)}

Return ONLY valid JSON:
{
  "score": number,
  "grade": string,
  "estimatedKgCO2PerYear": number,
  "summary": string,
  "breakdown": [
    { "area": string, "score": number, "note": string }
  ],
  "tips": [
    {
      "title": string,
      "description": string,
      "priority": "high" | "medium" | "low",
      "estimatedSaving": string
    }
  ]
}
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const data = JSON.parse(text);

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({
      message: 'Gemini error',
      error: err.message
    });
  }
}