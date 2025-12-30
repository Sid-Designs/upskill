class GetUserChatSessions {
  constructor({ chatSessionRepository }) {
    this.chatSessionRepository = chatSessionRepository;
  }

  async execute({ userId }) {
    if (!userId) {
      throw new Error("GetUserChatSessions: userId is required");
    }

    return this.chatSessionRepository.findByUserId(userId);
  }
}

module.exports = GetUserChatSessions;
