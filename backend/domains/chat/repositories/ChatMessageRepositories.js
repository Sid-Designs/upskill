class ChatMessageRepository {
  async create(message) {
    throw new Error("Method not implemented");
  }

  async findBySession(chatSessionId, limit = 20) {
    throw new Error("Method not implemented");
  }

  async findById(id) {
    throw new Error("Method not implemented");
  }

  async update(message) {
    throw new Error("Method not implemented");
  }

  async deleteByChatSessionId(chatSessionId) {
    throw new Error("Method not implemented");
  }
}

module.exports = ChatMessageRepository;
