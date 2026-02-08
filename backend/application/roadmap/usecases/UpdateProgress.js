const {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} = require("../../../infrastructure/errors/AppError");

class UpdateProgress {
  constructor({ roadmapRepository }) {
    this.roadmapRepository = roadmapRepository;
  }

  async execute({ userId, roadmapId, completedNodes }) {
    if (!userId) throw new BadRequestError("userId is required");
    if (!roadmapId) throw new BadRequestError("roadmapId is required");
    if (!Array.isArray(completedNodes))
      throw new BadRequestError("completedNodes must be an array");

    const roadmap = await this.roadmapRepository.findById(roadmapId);
    if (!roadmap) throw new NotFoundError("Roadmap not found");
    if (String(roadmap.userId) !== String(userId))
      throw new UnauthorizedError("Unauthorized access to roadmap");

    // Roadmap must be generated successfully before tracking progress
    if (roadmap.status !== "completed" || !roadmap.generatedContent?.phases) {
      throw new BadRequestError(
        "Cannot update progress for a roadmap that hasn't been generated yet"
      );
    }

    // Get valid nodeIds from the generated content
    const validNodeIds = new Set(roadmap.getAllNodeIds());

    // Filter out any invalid nodeIds (client may send stale data)
    const sanitized = completedNodes.filter((id) => validNodeIds.has(id));

    // Enforce sequential ordering: every completed node must have all predecessors completed
    const orderedIds = roadmap.getAllNodeIds();
    const completedSet = new Set(sanitized);
    for (let i = 0; i < orderedIds.length; i++) {
      if (completedSet.has(orderedIds[i])) {
        // All nodes before this one must be completed
        for (let j = 0; j < i; j++) {
          if (!completedSet.has(orderedIds[j])) {
            throw new BadRequestError(
              `Cannot mark "${orderedIds[i]}" as complete before completing "${orderedIds[j]}"`
            );
          }
        }
      }
    }

    // Compute progress fields
    roadmap.completedNodes = sanitized;
    roadmap.recomputeProgress();

    const updated = await this.roadmapRepository.updateProgress(
      roadmapId,
      sanitized,
      roadmap.totalNodes,
      roadmap.progressPercent,
      roadmap.learningStatus
    );

    return {
      id: updated.id,
      completedNodes: updated.completedNodes,
      totalNodes: updated.totalNodes,
      progressPercent: updated.progressPercent,
      learningStatus: updated.learningStatus,
    };
  }
}

module.exports = UpdateProgress;
