const ChatMessage = require("../../../infrastructure/db/models/ChatMessage");

// Inngest trigger (this replaces local workers/events)
const { triggerChatGeneration } = require("../../events/ChatEvents");

const MAX_INPUT_CHARS = 500;

const handleChat = async ({ chatSessionId, prompt }) => {
  // 1️⃣ Validate prompt
  if (typeof prompt !== "string") {
    throw new Error("Prompt must be a string");
  }

  const trimmedPrompt = prompt.trim();

  if (!trimmedPrompt) {
    throw new Error("Prompt cannot be empty");
  }

  if (trimmedPrompt.length > MAX_INPUT_CHARS) {
    throw new Error(`Prompt exceeds ${MAX_INPUT_CHARS} characters`);
  }

  // 2️⃣ Create USER message (completed immediately)
  const userMessage = await ChatMessage.create({
    chatSessionId,
    role: "user",
    content: trimmedPrompt,
    model: null,
    tokensUsed: 0,
    status: "completed",
  });

  // 3️⃣ Create ASSISTANT placeholder (pending)
  const aiMessage = await ChatMessage.create({
    chatSessionId,
    role: "assistant",
    content: "Error...",
    model: null,
    tokensUsed: 0,
    status: "pending",
  });

  // 4️⃣ Trigger Inngest async AI generation
  await triggerChatGeneration({
    chatSessionId,
    assistantMessageId: aiMessage._id,
  });

  // 5️⃣ Return response (matches your schema exactly)
  return {
    success: true,
    data: {
      userMessage: {
        id: userMessage._id,
        chatSessionId: userMessage.chatSessionId,
        role: userMessage.role,
        content: userMessage.content,
        model: userMessage.model,
        tokensUsed: userMessage.tokensUsed,
        status: userMessage.status,
        createdAt: userMessage.createdAt,
        updatedAt: userMessage.updatedAt,
      },
      aiMessage: {
        id: aiMessage._id,
        chatSessionId: aiMessage.chatSessionId,
        role: aiMessage.role,
        content: aiMessage.content,
        model: aiMessage.model,
        tokensUsed: aiMessage.tokensUsed,
        status: aiMessage.status,
        createdAt: aiMessage.createdAt,
        updatedAt: aiMessage.updatedAt,
      },
    },
  };
};

module.exports = handleChat;
