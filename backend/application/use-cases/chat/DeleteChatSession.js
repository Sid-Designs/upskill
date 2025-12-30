class DeleteChatSession {
  constructor({ chatSessionRepository, chatMessageRepository }) {
    this.chatSessionRepository = chatSessionRepository;
    this.chatMessageRepository = chatMessageRepository;
  }

  async execute({ userId, chatSessionId }) {
    if (!userId) throw new Error("userId required");
    if (!chatSessionId) throw new Error("chatSessionId required");

    const session = await this.chatSessionRepository.findById(chatSessionId);

    if (!session) throw new Error("ChatSession not found");

    if (String(session.userId) !== String(userId)) {
      throw new Error("Unauthorized access to chat session");
    }

    // 1️⃣ Delete messages first
    const info = await this.chatMessageRepository.deleteByChatSessionId(
      chatSessionId
    );

    // 2️⃣ Delete session
    await this.chatSessionRepository.deleteById(chatSessionId);

    return { success: true };
  }
}

module.exports = DeleteChatSession;
