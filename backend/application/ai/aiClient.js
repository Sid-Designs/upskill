const { OpenAI } = require("openai");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Clients
const openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// AI Response
const generateAIResponse = async (prompt) => {
  // OpenAI
  if (openaiClient) {
    try {
      const res = await openaiClient.chat.completions.create({
        model: process.env.OPENAI_MODEL,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 400,
      });

      return {
        provider: "openai",
        response: res.choices[0].message.content,
      };
    } catch (error) {
      console.warn("OpenAI failed, falling back to Gemini:", error.message);
    }
  }

  // Gemini
  if (geminiClient) {
    try {
      const model = geminiClient.getGenerativeModel({
        model: process.env.GEMINI_MODEL,
      });

      const result = await model.generateContent(prompt);

      return {
        provider: "gemini",
        response: result.response.text(),
      };
    } catch (error) {
      throw new Error(`Gemini failed: ${error.message}`);
    }
  }

  // 3️⃣ No provider available
  throw new Error("No AI provider is configured");
};

module.exports = {
  generateAIResponse,
};
