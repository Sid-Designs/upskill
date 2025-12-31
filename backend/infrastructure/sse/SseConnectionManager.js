class SseConnectionManager {
  constructor() {
    this.clients = new Map(); // sessionId → response
  }

  addClient(sessionId, res) {
    this.clients.set(sessionId, res);
  }

  removeClient(sessionId) {
    this.clients.delete(sessionId);
  }

  notify(sessionId, event, payload = {}) {
    const client = this.clients.get(sessionId);
    if (!client) return;

    client.write(`event: ${event}\n`);
    client.write(`data: ${JSON.stringify(payload)}\n\n`);
  }
}

module.exports = new SseConnectionManager();
