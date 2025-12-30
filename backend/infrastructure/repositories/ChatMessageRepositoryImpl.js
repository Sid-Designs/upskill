const ChatMessageRepository = require("../../domains/chat/repositories/ChatMessageRepositories");
const ChatMessage = require("../../domains/chat/entities/ChatMessage");
const ChatMessageModel = require("../db/models/ChatMessage");

class ChatMessageRepositoryImpl extends ChatMessageRepository {
  // Create a new message
  async create(message) {
    const doc = await ChatMessageModel.create({
      chatSessionId: message.chatSessionId,
      userId: message.userId,
      role: message.role,
      content: message.content,
      model: message.model,
      tokensUsed: message.tokensUsed,
      status: message.status,
    });

    return this._toDomain(doc);
  }

  // ✅ INDUSTRY STANDARD METHOD
  // Find messages by chat session ID (ordered)
  async findByChatSessionId(chatSessionId, { limit = 20 } = {}) {
    const docs = await ChatMessageModel.find({ chatSessionId })
      .sort({ createdAt: 1 })
      .limit(limit);

    return docs.map((doc) => this._toDomain(doc));
  }

  // Find single message by ID
  async findById(id) {
    const doc = await ChatMessageModel.findById(id);
    if (!doc) return null;
    return this._toDomain(doc);
  }

  // Check if a user has messages in a chat session
  async existsBySessionAndUser({ chatSessionId, userId }) {
    const exists = await ChatMessageModel.exists({
      chatSessionId,
      userId,
    });

    return Boolean(exists);
  }

  // Update message (used by AI worker later)
  async update(message) {
    if (!message.id) {
      throw new Error("ChatMessage.update: id is required");
    }

    const doc = await ChatMessageModel.findByIdAndUpdate(
      message.id,
      {
        content: message.content,
        model: message.model,
        tokensUsed: message.tokensUsed,
        status: message.status,
      },
      { new: true }
    );

    return doc ? this._toDomain(doc) : null;
  }

  // Delete message by ID
  async deleteByChatSessionId(chatSessionId) {
    const result = await ChatMessageModel.deleteMany({ chatSessionId });

    return {
      deletedCount: result.deletedCount,
    };
  }

  // 🔒 Private mapper: MongoDB → Domain
  _toDomain(doc) {
    return new ChatMessage({
      id: doc._id.toString(),
      chatSessionId: doc.chatSessionId.toString(),
      userId: doc.userId ? doc.userId.toString() : null,
      role: doc.role,
      content: doc.content,
      model: doc.model,
      tokensUsed: doc.tokensUsed,
      status: doc.status,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}

module.exports = ChatMessageRepositoryImpl;
