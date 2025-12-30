const ChatMessage = require("../../../domains/chat/entities/ChatMessage");

const MAX_INPUT_CHARS = 500;

class SendUserMessage {
  constructor({ chatSessionRepository, chatMessageRepository, inngest }) {
    this.chatSessionRepository = chatSessionRepository;
    this.chatMessageRepository = chatMessageRepository;
    this.inngest = inngest;
  }

  async execute({ userId, chatSessionId, content }) {
    if (!userId) throw new Error("SendUserMessage: userId is required");
    if (!chatSessionId)
      throw new Error("SendUserMessage: chatSessionId is required");
    if (typeof content !== "string") {
      throw new Error("SendUserMessage: content must be a string");
    }

    const trimmedContent = content.trim();

    if (!trimmedContent) {
      throw new Error("SendUserMessage: content cannot be empty");
    }

    if (trimmedContent.length > MAX_INPUT_CHARS) {
      throw new Error(
        `SendUserMessage: content exceeds ${MAX_INPUT_CHARS} characters`
      );
    }

    // 1️⃣ Load session
    const chatSession = await this.chatSessionRepository.findById(
      chatSessionId
    );

    if (!chatSession) throw new Error("ChatSession not found");

    // 2️⃣ Authorization (FIRST vs SUBSEQUENT message)
    const hasMessages = await this.chatMessageRepository.existsBySessionAndUser(
      {
        chatSessionId,
        userId,
      }
    );

    if (!hasMessages) {
      // First message → check session ownership
      if (String(chatSession.userId) !== String(userId)) {
        throw new Error("Unauthorized access to chat session");
      }
    }

    // 3️⃣ Save user message
    const userMessage = new ChatMessage({
      chatSessionId,
      userId,
      role: "user",
      content: trimmedContent,
      status: "completed",
    });

    const savedUserMessage = await this.chatMessageRepository.create(
      userMessage
    );

    // 4️⃣ Save AI placeholder
    const aiMessage = new ChatMessage({
      chatSessionId,
      userId,
      role: "assistant",
      content: "Thinking...",
      status: "pending",
    });

    const savedAiMessage = await this.chatMessageRepository.create(aiMessage);

    // 5️⃣ Trigger Inngest
    await this.inngest.send({
      name: "ai.process.message",
      data: {
        chatSessionId,
        aiMessageId: savedAiMessage.id,
        userId,
      },
    });

    return {
      userMessage: savedUserMessage,
      aiMessage: savedAiMessage,
    };
  }
}

module.exports = SendUserMessage;
