const ChatSession = require("../../../domains/chat/entities/ChatSession");

class CreateChatSession {
  constructor({ chatSessionRepository }) {
    this.chatSessionRepository = chatSessionRepository;
  }

  async execute({ userId, type, title }) {
    if (!userId) {
      throw new Error("CreateChatSession: userId is required");
    }

    if (!type) {
      throw new Error("CreateChatSession: type is required");
    }

    const chatSession = new ChatSession({
      userId,
      type,
      title,
    });

    const savedChatSession = await this.chatSessionRepository.create(
      chatSession
    );

    return savedChatSession;
  }
}

module.exports = CreateChatSession;