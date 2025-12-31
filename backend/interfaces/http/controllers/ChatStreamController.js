const sseManager = require('../../../infrastructure/sse/SseConnectionManager');

class ChatStreamController {
  static stream(req, res) {
    const { sessionId } = req.query;

    if (!sessionId) {
      return res.status(400).end();
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    sseManager.addClient(sessionId, res);

    // Initial handshake
    res.write(`event: connected\ndata: {}\n\n`);

    req.on('close', () => {
      sseManager.removeClient(sessionId);
    });
  }
}

module.exports = ChatStreamController;
