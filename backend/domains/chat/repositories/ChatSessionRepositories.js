class ChatSessionRepository {
  async create(chatSession) {
    throw new Error("Method not implemented");
  }

  async findById(id) {
    throw new Error("Method not implemented");
  }

  async findByUser(userId) {
    throw new Error("Method not implemented");
  }

  async update(chatSession) {
    throw new Error("Method not implemented");
  }

  async isSessionOwnedByUser({ chatSessionId, userId }) {
    throw new Error("Method not implemented");
  }

  async deleteById(chatSessionId) {
    throw new Error("Method not implemented");
  }
}

module.exports = ChatSessionRepository;
