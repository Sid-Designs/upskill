const ChatSessionRepository = require("../../domains/chat/repositories/ChatSessionRepositories");
const ChatSession = require("../../domains/chat/entities/ChatSession");
const ChatSessionModel = require("../db/models/ChatSession");
const ChatMessageModel = require("../db/models/ChatMessage");
const mongoose = require("mongoose");

class ChatSessionRepositoryImpl extends ChatSessionRepository {
  async create(chatSession) {
    const doc = await ChatSessionModel.create({
      userId: chatSession.userId,
      type: chatSession.type,
      title: chatSession.title,
      status: chatSession.status,
    });

    return this._toDomain(doc);
  }

  async findById(id) {
    const doc = await ChatSessionModel.findById(id);
    if (!doc) return null;
    return this._toDomain(doc);
  }

  async findByUserId(userId) {
    const docs = await ChatSessionModel.find({
      userId,
      status: "active",
    }).sort({ updatedAt: -1 });

    return docs.map((doc) => this._toDomain(doc));
  }

  async findByUser(userId) {
    const docs = await ChatSessionModel.find({ userId }).sort({
      createdAt: -1,
    });

    return docs.map((doc) => this._toDomain(doc));
  }

  async update(chatSession) {
    const doc = await ChatSessionModel.findByIdAndUpdate(
      chatSession.id,
      {
        title: chatSession.title,
        status: chatSession.status,
        updatedAt: chatSession.updatedAt,
      },
      { new: true }
    );

    return doc ? this._toDomain(doc) : null;
  }

  async deleteById(chatSessionId) {
    const doc = await ChatSessionModel.findByIdAndDelete(chatSessionId);
    if (!doc) return null;
    return this._toDomain(doc);
  }

  _toDomain(doc) {
    return new ChatSession({
      id: doc._id.toString(),
      userId: doc.userId,
      type: doc.type,
      title: doc.title,
      status: doc.status,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}

module.exports = ChatSessionRepositoryImpl;
