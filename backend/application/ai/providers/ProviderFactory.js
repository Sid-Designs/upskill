const ChatGPTProvider = require("./ChatGPTProvider");
const GeminiProvider = require("./GeminiProvider");

function getAIProvider(chatType, options = {}) {
  const primary = options.primary || process.env.AI_PRIMARY_PROVIDER || "openai";
  const fallback = options.fallback || process.env.AI_FALLBACK_PROVIDER || "gemini";

  return {
    async generate(prompt) {
      try {
        if (primary === "openai") {
          const openai = new ChatGPTProvider();
          return await openai.generate(prompt);
        }

        if (primary === "gemini") {
          const gemini = new GeminiProvider();
          return await gemini.generate(prompt);
        }

        throw new Error(`Unknown AI provider: ${primary}`);
      } catch (primaryError) {
        console.warn(
          `[AI] Primary provider (${primary}) failed, trying fallback (${fallback})`,
          primaryError.message
        );

        if (!fallback || fallback === primary) {
          throw primaryError;
        }

        // Fallback attempt
        if (fallback === "openai") {
          const openai = new ChatGPTProvider();
          return await openai.generate(prompt);
        }

        if (fallback === "gemini") {
          const gemini = new GeminiProvider();
          return await gemini.generate(prompt);
        }

        throw primaryError;
      }
    },
  };
}

module.exports = { getAIProvider };
