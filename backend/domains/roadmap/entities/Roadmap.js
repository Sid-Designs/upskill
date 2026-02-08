class Roadmap {
  constructor({
    id,
    userId,
    goalTitle,
    durationDays,
    currentSkillLevel,
    targetSkillLevel,
    educationalBackground,
    priorKnowledge,
    learningStyle,
    resourceConstraints,
    careerGoal,
    additionalNotes,
    generatedContent = null,
    status = "pending",
    provider = null,
    completedNodes = [],
    totalNodes = 0,
    progressPercent = 0,
    learningStatus = "not_started",
    capstoneStatus = "not_started",
    capstoneSubmissions = [],
    createdAt,
    updatedAt,
  }) {
    this.id = id;
    this.userId = userId;
    this.goalTitle = goalTitle;
    this.durationDays = durationDays;
    this.currentSkillLevel = currentSkillLevel;
    this.targetSkillLevel = targetSkillLevel;
    this.educationalBackground = educationalBackground;
    this.priorKnowledge = priorKnowledge;
    this.learningStyle = learningStyle;
    this.resourceConstraints = resourceConstraints;
    this.careerGoal = careerGoal;
    this.additionalNotes = additionalNotes;
    this.generatedContent = generatedContent;
    this.status = status;
    this.provider = provider;
    this.completedNodes = completedNodes;
    this.totalNodes = totalNodes;
    this.progressPercent = progressPercent;
    this.learningStatus = learningStatus;
    this.capstoneStatus = capstoneStatus;
    this.capstoneSubmissions = capstoneSubmissions;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  complete(text, provider) {
    this.generatedContent = text;
    this.provider = provider;
    this.status = "completed";
    this.updatedAt = new Date();
  }

  fail() {
    this.status = "failed";
    this.updatedAt = new Date();
  }

  /**
   * Extract all nodeIds from generatedContent in sequential order.
   */
  getAllNodeIds() {
    if (!this.generatedContent || !this.generatedContent.phases) return [];
    const ids = [];
    this.generatedContent.phases.forEach((phase) => {
      if (phase.weeks) {
        phase.weeks.forEach((week) => {
          if (week.nodes) {
            week.nodes.forEach((node) => {
              if (node.nodeId) ids.push(node.nodeId);
            });
          }
        });
      }
    });
    return ids;
  }

  /**
   * Count total nodes from generatedContent.
   */
  computeTotalNodes() {
    return this.getAllNodeIds().length;
  }

  /**
   * Compute progress percentage.
   */
  computeProgressPercent() {
    const total = this.computeTotalNodes();
    if (total === 0) return 0;
    const completed = this.completedNodes
      ? this.completedNodes.length
      : 0;
    return Math.round((completed / total) * 100);
  }

  /**
   * Compute learning status based on completedNodes and totalNodes.
   */
  computeLearningStatus() {
    const total = this.computeTotalNodes();
    if (total === 0) return "not_started";
    const completed = this.completedNodes
      ? this.completedNodes.length
      : 0;
    if (completed === 0) return "not_started";
    // All nodes done AND capstone passed = completed
    if (completed >= total && this.capstoneStatus === "passed") return "completed";
    return "in_progress";
  }

  /**
   * Recompute all progress fields from current state.
   */
  recomputeProgress() {
    this.totalNodes = this.computeTotalNodes();
    this.progressPercent = this.computeProgressPercent();
    this.learningStatus = this.computeLearningStatus();
  }
}

module.exports = Roadmap;