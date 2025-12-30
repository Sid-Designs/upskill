class ChatMessage {
  constructor({
    id,
    chatSessionId,
    userId,
    role,
    content,
    model = null,
    tokensUsed = 0,
    status,
    createdAt,
    updatedAt,
  }) {

    if (!chatSessionId) {
      throw new Error("ChatMessage: chatSessionId is required");
    }

    if (!role) {
      throw new Error("ChatMessage: role is required");
    }

    if (!content) {
      throw new Error("ChatMessage: content is required");
    }


    if (role === "user") {
      status = "completed";
    }

    if (role === "assistant" && !status) {
      status = "pending";
    }

    this.id = id;
    this.chatSessionId = chatSessionId;
    this.userId = userId;
    this.role = role;
    this.content = content;
    this.model = model;
    this.tokensUsed = tokensUsed;
    this.status = status;

    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();
  }

  complete({ content, model, tokensUsed }) {
    if (this.role !== "assistant") {
      throw new Error("Only assistant messages can be completed");
    }

    this.content = content;
    this.model = model;
    this.tokensUsed = tokensUsed;
    this.status = "completed";
    this.updatedAt = new Date();
  }

  fail() {
    if (this.role !== "assistant") return;
    this.status = "failed";
    this.updatedAt = new Date();
  }

  isPending() {
    return this.status === "pending";
  }

  isCompleted() {
    return this.status === "completed";
  }
}

module.exports = ChatMessage;
