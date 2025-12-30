const { OpenAI } = require("openai");
const AIProvider = require("./AIProvider");

class ChatGPTProvider extends AIProvider {
  constructor() {
    super();
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.model = process.env.OPENAI_MODEL;
  }

  async generate(prompt) {
    try {
      const res = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: "system", content: prompt.system },
          ...prompt.messages,
        ],
        max_tokens: 400,
      });

      return {
        provider: "openai",
        text: res.choices[0].message.content,
        tokensUsed: res.usage?.total_tokens || 0,
      };
    } catch (error) {
      throw new Error(`OpenAI failed: ${error.message}`);
    }
  }
}

module.exports = ChatGPTProvider;
