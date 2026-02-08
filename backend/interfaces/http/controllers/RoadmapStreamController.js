const sseManager = require("../../../infrastructure/sse/SseConnectionManager");

class RoadmapStreamController {
  static stream(req, res) {
    const { roadmapId } = req.query;

    if (!roadmapId) {
      return res.status(400).end();
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    sseManager.addClient(roadmapId, res);

    res.write(`event: connected\ndata: {}\n\n`);

    req.on("close", () => {
      sseManager.removeClient(roadmapId);
    });
  }
}

module.exports = RoadmapStreamController;
