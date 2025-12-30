class ChatSession {
  constructor({
    id,
    userId,
    type,
    title,
    status = "active",
    createdAt,
    updatedAt,
  }) {
    if (!userId) {
      throw new Error("ChatSession: userId is required");
    }

    if (!type) {
      throw new Error("ChatSession: type is required");
    }

    this.id = id;
    this.userId = userId;
    this.type = type;
    this.title = title || "New Chat";
    this.status = status;
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();
  }

  archive() {
    if (this.status === "archived") return;
    this.status = "archived";
    this.updatedAt = new Date();
  }

  isActive() {
    return this.status === "active";
  }

  isOwnedBy(userId) {
    return this.userId === userId;
  }
}

module.exports = ChatSession;
