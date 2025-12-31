const sseManager = require("../../../infrastructure/sse/SseConnectionManager");

class CoverLetterStreamController {
  static stream(req, res) {
    const { coverLetterId } = req.query;

    if (!coverLetterId) {
      return res.status(400).end();
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    sseManager.addClient(coverLetterId, res);

    res.write(`event: connected\ndata: {}\n\n`);

    req.on("close", () => {
      sseManager.removeClient(coverLetterId);
    });
  }
}

module.exports = CoverLetterStreamController;
