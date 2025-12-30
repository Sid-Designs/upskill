const { GoogleGenerativeAI } = require("@google/generative-ai");
const AIProvider = require("./AIProvider");

class GeminiProvider extends AIProvider {
  constructor() {
    super();
    this.client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.modelName = process.env.GEMINI_MODEL;
  }

  async generate(prompt) {
    try {
      const model = this.client.getGenerativeModel({
        model: this.modelName,
      });

      // Gemini does not support role-based messages natively
      const flattenedPrompt = [
        prompt.system,
        ...prompt.messages.map((m) => `${m.role}: ${m.content}`),
      ].join("\n");

      const result = await model.generateContent(flattenedPrompt);

      return {
        provider: "gemini",
        text: result.response.text(),
        tokensUsed: 0, 
      };
    } catch (error) {
      throw new Error(`Gemini failed: ${error.message}`);
    }
  }
}

module.exports = GeminiProvider;
