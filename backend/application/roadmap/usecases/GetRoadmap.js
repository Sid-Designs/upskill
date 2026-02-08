const {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} = require("../../../infrastructure/errors/AppError");

class GetRoadmap {
  constructor({ roadmapRepository }) {
    this.roadmapRepository = roadmapRepository;
  }

  async execute({ userId, roadmapId }) {
    if (!userId) {
      throw new BadRequestError("userId is required");
    }

    if (!roadmapId) {
      throw new BadRequestError("roadmapId is required");
    }

    const roadmap = await this.roadmapRepository.findById(roadmapId);

    if (!roadmap) {
      throw new NotFoundError("Roadmap not found");
    }

    if (String(roadmap.userId) !== String(userId)) {
      throw new UnauthorizedError("Unauthorized access to roadmap");
    }

    return roadmap;
  }
}

module.exports = GetRoadmap;
