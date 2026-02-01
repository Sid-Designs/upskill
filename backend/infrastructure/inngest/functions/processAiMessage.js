const inngest = require("../client");

const ChatSessionRepositoryImpl = require("../../repositories/ChatSessionRepositoryImpl");
const ChatMessageRepositoryImpl = require("../../repositories/ChatMessageRepositoryImpl");
const ProfileRepositoryImpl = require("../../repositories/ProfileRepositoryImpl");

const { buildPrompt } = require("../../../application/ai/promptBuilder");
const { getCreditCost } = require("../../../application/ai/pricing");
const {
  getAIProvider,
} = require("../../../application/ai/providers/ProviderFactory");

const sseManager = require("../../sse/SseConnectionManager");

const chatSessionRepo = new ChatSessionRepositoryImpl();
const chatMessageRepo = new ChatMessageRepositoryImpl();
const profileRepo = new ProfileRepositoryImpl();

module.exports = inngest.createFunction(
  { id: "process-ai-message" },
  { event: "ai.process.message" },

  async ({ event, step }) => {
    const { chatSessionId, aiMessageId, userId } = event.data;

    /* 1️⃣ Load session */
    const chatSession = await step.run("load-session", async () => {
      return chatSessionRepo.findById(chatSessionId);
    });
    if (!chatSession) throw new Error("ChatSession not found");

    /* 2️⃣ Load messages */
    const messages = await step.run("load-messages", async () => {
      return chatMessageRepo.findByChatSessionId(chatSessionId);
    });

    /* 3️⃣ Build context */
    const context = messages.map((m) => ({
      role: m.role,
      content: m.content,
      status: m.status,
    }));

    /* 4️⃣ Load profile */
    const profile = await step.run("load-profile", async () => {
      return profileRepo.getUserProfile(userId);
    });

    /* 5️⃣ Build prompt */
    const prompt = buildPrompt({
      chatType: chatSession.type,
      context,
      userProfile: profile,
    });

    /* 6️⃣ Credit check */
    const cost = getCreditCost(chatSession.type);
    if (!profile || profile.credits < cost) {
      await step.run("handle-insufficient-credits", async () => {
        await chatMessageRepo.update({
          id: aiMessageId,
          content: "Insufficient credits",
          status: "failed",
        });
      });
      
      // Notify with retry
      sseManager.notify(chatSessionId, "failed", {
        reason: "insufficient_credits",
        chatSessionId,
      }, { retry: true, maxRetries: 10, retryDelay: 300 });
      
      return { status: "failed", reason: "insufficient_credits" };
    }

    /* 7️⃣ Call AI */
    const aiResult = await step.run("call-ai", async () => {
      const provider = getAIProvider(chatSession.type);
      return provider.generate(prompt);
    });

    /* 8️⃣ Update AI message */
    await step.run("update-ai-message", async () => {
      await chatMessageRepo.update({
        id: aiMessageId,
        content: aiResult.text,
        model: aiResult.provider,
        status: "completed",
      });
    });

    /* 9️⃣ Deduct credits */
    await step.run("deduct-credits", async () => {
      await profileRepo.deductCredits(userId, cost);
    });

    /* 🔟 Notify client with retry mechanism */
    sseManager.notify(chatSessionId, "completed", {
      message: "assistant_completed",
      aiMessageId,
    }, { retry: true, maxRetries: 10, retryDelay: 300 });

    console.log("[Inngest] AI response generated & credits deducted");
    
    return { status: "completed", aiMessageId };
  }
);
