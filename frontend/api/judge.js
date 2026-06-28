import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { players } = req.body;
    
    if (!players || players.length === 0) {
      return res.status(400).json({ message: 'No players provided' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ message: 'GEMINI_API_KEY is not configured in Vercel.' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    let promptText = `You are the AI Warden of the Ritual Chain Hunger Games.\nYour job is to read the survival prompts of the remaining players and ELIMINATE ONE player who has the weakest, least creative, or most flawed logic.\n\nLiving Players:\n`;
    
    players.forEach(p => {
        promptText += `- Wallet: ${p.wallet}\n  Prompt: "${p.prompt}"\n\n`;
    });

    promptText += `Return your decision strictly in this JSON format (no markdown, no extra text):\n{"eliminatedWallet": "0x...", "reason": "A cold, ruthless 1-sentence reason why they were purged."}`;

    const result = await model.generateContent(promptText);
    const responseText = result.response.text();
    let cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    
    // Attempt to extract JSON if Gemini added conversational text
    const jsonStart = cleanJson.indexOf('{');
    const jsonEnd = cleanJson.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
        cleanJson = cleanJson.substring(jsonStart, jsonEnd + 1);
    }
    
    let decision;
    try {
        decision = JSON.parse(cleanJson);
    } catch (parseErr) {
        return res.status(500).json({ message: 'Error executing AI judgment', error: 'Invalid JSON from Gemini', raw: responseText });
    }
    res.status(200).json(decision);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error executing AI judgment', error: error.message });
  }
}
