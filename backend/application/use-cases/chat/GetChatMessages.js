class GetChatMessages {
  constructor({ chatSessionRepository, chatMessageRepository }) {
    this.chatSessionRepository = chatSessionRepository;
    this.chatMessageRepository = chatMessageRepository;
  }

  async execute({ userId, chatSessionId }) {
    if (!userId || !chatSessionId) {
      throw new Error("GetChatMessages: invalid input");
    }

    const session =
      await this.chatSessionRepository.findById(chatSessionId);

    if (!session) {
      throw new Error("ChatSession not found");
    }

    if (String(session.userId) !== String(userId)) {
      throw new Error("Unauthorized access");
    }

    return this.chatMessageRepository.findByChatSessionId(
      chatSessionId,
      { limit: 100 }
    );
  }
}

module.exports = GetChatMessages;
