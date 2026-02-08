const {
  BadRequestError,
} = require("../../../infrastructure/errors/AppError");

class GetUserRoadmaps {
  constructor({ roadmapRepository }) {
    this.roadmapRepository = roadmapRepository;
  }

  async execute(userId) {
    if (!userId) {
      throw new BadRequestError("userId is required");
    }

    const roadmaps = await this.roadmapRepository.findAllByUserId(userId);

    return roadmaps.map((r) => ({
      id: r.id,
      goalTitle: r.goalTitle,
      durationDays: r.durationDays,
      currentSkillLevel: r.currentSkillLevel,
      targetSkillLevel: r.targetSkillLevel,
      status: r.status,
      totalNodes: r.totalNodes || 0,
      completedNodesCount: r.completedNodes ? r.completedNodes.length : 0,
      progressPercent: r.progressPercent || 0,
      learningStatus: r.learningStatus || "not_started",
      createdAt: r.createdAt,
    }));
  }
}

module.exports = GetUserRoadmaps;
